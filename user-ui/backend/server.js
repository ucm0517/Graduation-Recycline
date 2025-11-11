const express = require("express");
const cors = require("cors");

const app = express();
const PORT = 3001;

// ✅ 요청 body를 JSON으로 파싱하도록 설정
app.use(express.json());
app.use(cors());

let latestData = {
  plastic: 0,
  metal: 0,
  glass: 0,
  "general trash": 0,
};

let lastUpdateTime = 0;
let beginTime = 0; // ✅ 처리 시작 시각 저장

// 처리 시작 요청 (Jetson이 호출)
app.post("/begin", (req, res) => {
  beginTime = Date.now();
  console.log("[⚙️ 처리 시작 요청 수신]");
  res.sendStatus(200);
});

// 쓰레기 채움률 업데이트 (Pi가 호출)
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

// React에서 상태 요청
app.get("/data", (req, res) => {
  res.json({
    ...latestData,
    lastUpdated: lastUpdateTime,
    lastBegin: beginTime, // ✅ 처리 시작 시각도 전달
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Express 서버 실행 중 → http://localhost:${PORT}`);
});
