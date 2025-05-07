import React, { useState, useEffect } from "react";
import TrashMeter from "./TrashMeter";
import MessageDisplay from "./MessageDisplay";

const MainPage = () => {
  const [state, setState] = useState("idle");
  const [levels, setLevels] = useState([0, 0, 0, 0]);
  const [lastUpdated, setLastUpdated] = useState(0);
  const [lastBegin, setLastBegin] = useState(0);

  // Jetson에 분류 시작 요청 보내는 함수
  const handleStartClassification = async () => {
    try {
      const res = await fetch("http://192.168.137.12:3002/start", {
        method: "POST",
      });
      if (res.ok) {
        console.log("✅ Jetson에 분류 시작 요청 전송됨");
      } else {
        console.error("❌ Jetson 요청 실패:", res.status);
      }
    } catch (err) {
      console.error("🚨 Jetson 연결 에러:", err);
    }
  };

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch("http://localhost:3001/data");
        const data = await res.json();

        const ordered = [
          data["general trash"] || 0,
          data["plastic"] || 0,
          data["metal"] || 0,
          data["glass"] || 0,
        ];
        setLevels(ordered);

        if (data.lastBegin !== lastBegin) {
          setLastBegin(data.lastBegin);
          setState("processing");
        }

        if (data.lastUpdated !== lastUpdated) {
          setLastUpdated(data.lastUpdated);
          setState("done");
          setTimeout(() => setState("idle"), 4000);
        }
      } catch (err) {
        console.error("데이터 가져오기 실패:", err);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [lastBegin, lastUpdated]);

  const message =
    state === "processing"
      ? "쓰레기를 처리중입니다!"
      : state === "done"
      ? "처리 완료되었습니다!"
      : "쓰레기를 넣어주세요!";

  return (
    <div style={styles.page}>
      <MessageDisplay message={message} />
      <button onClick={handleStartClassification} style={styles.button}>
        쓰레기 분류 시작
      </button>
      <TrashMeter levels={levels} />
    </div>
  );
};

const styles = {
  page: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    height: "100vh",
    backgroundColor: "#f4f4f4",
  },
  button: {
    marginTop: "30px",
    padding: "14px 28px",
    fontSize: "18px",
    backgroundColor: "#4f7fff",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
  },
};

export default MainPage;
