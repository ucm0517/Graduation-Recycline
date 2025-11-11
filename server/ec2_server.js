const express = require("express");
const path = require("path");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");
const multer = require("multer");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",  // 배포 시에는 도메인 제한 필요
    methods: ["GET", "POST"]
  }
});
const PORT = 3001;
const SECRET_KEY = "your_secret_key";

app.use(cors());
app.use(express.json());

//  MySQL 연결
const db = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "",
  database: "",
});

//  메모리 데이터 저장용
let latestData = {
  plastic: 0,
  metal: 0,
  glass: 0,
  "general trash": 0,
};
let lastUpdateTime = 0;
let beginTime = 0;

//  Jetson → 처리 시작 알림
app.post("/begin", (req, res) => {
  beginTime = Date.now(); 
  console.log("[⚙️ 처리 시작 요청 수신]", beginTime);
  res.json({ beginTime }); 
});

//  이미지 업로드 설정
const uploadPath = path.join(__dirname, "var/data");

// 저장 위치 및 파일명 설정
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const original = path.parse(file.originalname).name;  // e.g. 202505151321
    const unique = `id-${original}_${Date.now()}.jpg`;
    cb(null, unique);
  },
});

const upload = multer({ storage });

//  Jetson에서 이미지 + 클래스명 + 각도 전송, 데이터 업데이트 시 모든 관리자에게 알림
app.post("/upload", upload.single("image"), async (req, res) => {
  try {
    const { class: className, angle, device_id = "jetson" } = req.body;

    if (!req.file || !className || !angle) {
      return res.status(400).json({ message: "필수 필드 누락" });
    }

    const originalName = req.file.originalname;
    const storedName = req.file.filename;
    const fullPath = `/var/data/${storedName}`;

    await db.query(
      `INSERT INTO images (original_name, stored_name, path, class, angle, device_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [originalName, storedName, fullPath, className, parseInt(angle), device_id]
    );

    console.log(`[📸 업로드] ${originalName} → ${storedName}`);
    alertNamespace.emit("log_update"); //  실시간 로그 알림 전송
    alertNamespace.emit("stat_update"); // 실시간 통계 알림 전송
    
    res.status(200).json({ message: "업로드 성공", filename: storedName });
  } catch (err) {
    console.error("❌ 이미지 업로드 오류:", err);
    res.status(500).json({ message: "서버 에러" });
  }
});

//  Raspberry Pi → 채움률 업데이트
app.post("/update", async (req, res) => {
  const { class: className, level, device_id = "jetson" } = req.body;

  if (className && typeof level === "number") {
    latestData[className] = level;
    lastUpdateTime = Date.now();

    try {
      await db.query(
        "INSERT INTO levels (device_id, class, level) VALUES (?, ?, ?)",
        [device_id, className, level]
      );
      console.log(`[📩 업데이트] ${className}: ${level}% → DB 저장 완료`);
      
      // 실시간 알림 전송
      alertNamespace.emit("level_update"); 
      
      // 80% 이상일 때 관리자 알림 전송
      if (level >= 80) {
        const koreanName = getKoreanClassName(className);
        const alertMessage = `${koreanName} 쓰레기통이 ${level}%로 가득 찼습니다!`;
        
        console.log(`🚨 관리자 알림: ${alertMessage}`);
        alertNamespace.emit("admin_alert", { 
          type: className, 
          level: level,
          message: alertMessage,
          timestamp: new Date().toISOString()
        });
      }
      
      res.sendStatus(200);
    } catch (err) {
      console.error("❌ levels DB 저장 실패:", err);
      res.sendStatus(500);
    }
  } else {
    console.log("❌ 잘못된 요청:", req.body);
    res.sendStatus(400);
  }
});

// 한글 클래스명 변환 함수 추가
function getKoreanClassName(className) {
  const classNameMap = {
    "general trash": "일반쓰레기",
    "plastic": "플라스틱",
    "metal": "금속",
    "glass": "유리"
  };
  return classNameMap[className] || className;
}

// 사용자 UI → 실시간 상태 조회
app.get("/data", (req, res) => {
  res.json({
    ...latestData,
    lastUpdated: lastUpdateTime,
    lastBegin: beginTime,
  });
});

// 관리자 UI → 실시간 상태 조회
app.post("/alert", (req, res) => {
  const { type, message } = req.body;
  if (!type || !message) {
    return res.status(400).json({ message: "필수 필드 누락" });
  }
  console.log(`🚨 관리자 알림 전송됨: ${type} - ${message}`);
  alertNamespace.emit("admin_alert", { type, message });
  res.sendStatus(200);
});

// 관리자 전용 알림 채널
const alertNamespace = io.of("/alerts");
alertNamespace.on("connection", (socket) => {
  console.log("📡 관리자 UI 연결됨 (/alerts)");
  socket.on("disconnect", () => {
    console.log("❌ 관리자 UI 연결 종료");
  });
});

//  회원가입
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

//  로그인
app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const [rows] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
    if (rows.length === 0) return res.status(401).json({ message: "아이디 또는 비밀번호가 틀렸습니다." });

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "비밀번호가 일치하지 않습니다." });

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name, role: user.role },
      SECRET_KEY,
      { expiresIn: "1h" }
    );

    if (!user.approved) {
      return res.status(403).json({
        message: "관리자의 승인이 필요합니다.",
        name: user.name,
        role: user.role,
        approved: user.approved,
        token,
      });
    }

    res.json({ token, name: user.name, role: user.role, approved: user.approved });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "서버 에러" });
  }
});

//  관리자 사용자 목록 조회
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

// ✅ 관리자 승인 처리
app.post("/api/admin/users/update", async (req, res) => {
  const { id, approved, role } = req.body;
  try {
    await db.query("UPDATE users SET approved = ?, role = ? WHERE id = ?", [approved, role, id]);
    res.json({ message: "사용자 정보가 업데이트되었습니다." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "사용자 업데이트 실패" });
  }
});

// ✅ 로그 삭제 API
app.post("/api/logs/delete", async (req, res) => {
  const { filename } = req.body;
  if (!filename) return res.status(400).json({ message: "파일명이 필요합니다." });

  try {
    const [result] = await db.query("DELETE FROM images WHERE stored_name = ?", [filename]);
    if (result.affectedRows > 0) {
      console.log(`🗑 로그 삭제됨: ${filename}`);
      res.json({ success: true });
    } else {
      res.status(404).json({ message: "해당 파일명을 가진 로그를 찾을 수 없습니다." });
    }
  } catch (err) {
    console.error("❌ 로그 삭제 실패:", err);
    res.status(500).json({ message: "서버 에러" });
  }
});

// ✅ 로그 조회 (TrashLogTable용)
app.get("/api/logs", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT stored_name AS filename, class AS result, angle, created_at AS time
      FROM images
      ORDER BY created_at DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "로그 조회 실패" });
  }
});


//  통계용 데이터 (StatisticsChart용)
app.get("/api/stats", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT class AS result, COUNT(*) AS count
      FROM images
      GROUP BY class
    `);

    const formatted = rows.map(r => ({
      name: r.result,
      value: r.count,
    }));

    res.json(formatted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "통계 조회 실패" });
  }
});

//  채움률 데이터 (Dashboard, RealTimeTrashLevel용)
app.get("/api/levels", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT l.class, l.level
      FROM levels l
      INNER JOIN (
        SELECT class, MAX(measured_at) AS latest
        FROM levels
        GROUP BY class
      ) latest_level
      ON l.class = latest_level.class AND l.measured_at = latest_level.latest
    `);

    const result = rows.map(r => ({
      type: r.class,
      level: r.level,
    }));

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "채움률 조회 실패" });
  }
});

// 채움률 전체 로그 조회
app.get("/api/levels/logs", async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT id, device_id, class, level, measured_at FROM levels ORDER BY measured_at DESC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: "채움률 로그 조회 실패" });
  }
});

// 채움률 로그 단건 삭제
app.post("/api/levels/delete", async (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ message: "id 필요" });
  try {
    const [result] = await db.query(`DELETE FROM levels WHERE id=?`, [id]);
    if (result.affectedRows > 0) res.json({ success: true });
    else res.status(404).json({ message: "존재하지 않는 id" });
  } catch (err) {
    res.status(500).json({ message: "채움률 로그 삭제 실패" });
  }
});

// 서버 코드 (ec2_server.js 또는 admin_server.js 등)
app.post("/api/levels/reset", async (req, res) => {
  try {
    const types = ["general trash", "plastic", "metal", "glass"];
    for (const type of types) {
      // levels 테이블에 0% 값을 새로 추가
      await db.query(
        "INSERT INTO levels (device_id, class, level) VALUES (?, ?, ?)",
        ["admin", type, 0]
      );
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "초기화 실패" });
  }
});

// ✅ 이미지 정적 파일 서빙
app.use("/images", express.static(path.join(__dirname, "var/data")));

// ✅ 관리자 UI
app.use("/admin", express.static(path.join(__dirname, "admin")));
app.get("/admin/*", (req, res) => {
  res.sendFile(path.join(__dirname, "admin", "index.html"));
});

// ✅ 사용자 UI
app.use("/", express.static(path.join(__dirname, "user")));
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "user", "index.html"));
});

// ✅ 서버 시작
server.listen(PORT, () => {
  console.log(`🚀 통합 EC2 서버 실행 중: http://localhost:${PORT}`);
});
