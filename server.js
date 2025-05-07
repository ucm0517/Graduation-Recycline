// ✅ server.js
const express = require("express");
const path = require("path");
const cors = require("cors");

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// ✅ 메모리 저장용 데이터 구조
let latestData = {
  plastic: 0,
  metal: 0,
  glass: 0,
  "general trash": 0,
};
let lastUpdateTime = 0;
let beginTime = 0;

// ✅ Jetson → 분류 시작 알림
app.post("/begin", (req, res) => {
  beginTime = Date.now();
  console.log("[⚙️ 처리 시작 요청 수신]");
  res.sendStatus(200);
});

// ✅ Pi → 쓰레기 채움률 업데이트
app.post("/update", (req, res) => {
  const { class: className, level } = req.body;
  if (className && typeof level === "number") {
    latestData[className] = level;
    lastUpdateTime = Date.now();
    console.log(`[📩 업데이트] ${className}: ${level}%`);
    res.sendStatus(200);
  } else {
    console.log("❌ 잘못된 요청:", req.body);
    res.sendStatus(400);
  }
});

// ✅ 사용자 UI → 실시간 상태 조회
app.get("/data", (req, res) => {
  res.json({
    ...latestData,
    lastUpdated: lastUpdateTime,
    lastBegin: beginTime,
  });
});

// ✅ 관리자 UI (빌드된 React 파일 서빙)
app.use("/admin", express.static(path.join(__dirname, "admin")));
app.get("/admin/*", (req, res) => {
  res.sendFile(path.join(__dirname, "admin", "index.html"));
});

// ✅ 사용자 UI (빌드된 React 파일 서빙)
app.use("/", express.static(path.join(__dirname, "public")));
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`🚀 EC2 서버 실행 중: http://localhost:${PORT}`);
});
