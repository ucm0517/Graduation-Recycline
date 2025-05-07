const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");

const app = express();
const PORT = 5000;
const SECRET_KEY = "your_secret_key";

app.use(cors());
app.use(express.json());

// DB 연결
const db = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "0517",
  database: "admin_system",
});

// ✅ 회원가입
app.post("/api/auth/register", async (req, res) => {
  const { email, name, password } = req.body;

  try {
    const [rows] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
    if (rows.length > 0) {
      return res.status(400).json({ message: "이미 존재하는 이메일입니다." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await db.query(
      "INSERT INTO users (email, name, password, role, approved) VALUES (?, ?, ?, 'pending', false)",
      [email, name, hashedPassword]
    );

    res.status(201).json({ message: "회원가입 성공. 관리자 승인 후 사용 가능합니다." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "서버 에러" });
  }
});

// ✅ 로그인
app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const [rows] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
    if (rows.length === 0) {
      return res.status(401).json({ message: "아이디 또는 비밀번호가 틀렸습니다." });
    }

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "비밀번호가 일치하지 않습니다." });
    }

    if (!user.approved) {
      // 승인 안 됐지만 사용자 정보는 전달
      return res.status(403).json({
        message: "관리자의 승인이 필요합니다.",
        name: user.name,
        role: user.role,
        approved: user.approved,
        token: jwt.sign(
          { id: user.id, email: user.email, name: user.name, role: user.role },
          SECRET_KEY,
          { expiresIn: "1h" }
        )
      });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name, role: user.role },
      SECRET_KEY,
      { expiresIn: "1h" }
    );

    res.json({ token, name: user.name, role: user.role, approved: user.approved });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "서버 에러" });
  }
});

// ✅ [GET] 모든 사용자 목록 조회 (superadmin용)
app.get("/api/admin/users", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT id, email, name, role, approved FROM users ORDER BY id DESC"
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "사용자 목록 조회 실패" });
  }
});

// ✅ [POST] 사용자 승인 또는 거부 처리
app.post("/api/admin/users/update", async (req, res) => {
  const { id, approved, role } = req.body;

  try {
    await db.query(
      "UPDATE users SET approved = ?, role = ? WHERE id = ?",
      [approved, role, id]
    );
    res.json({ message: "사용자 정보가 업데이트되었습니다." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "사용자 업데이트 실패" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
