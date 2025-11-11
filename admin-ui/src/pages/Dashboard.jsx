import React, { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { SERVER_URL } from "../config";

const typeMap = {
  "general trash": "일반쓰레기",
  "plastic": "플라스틱",
  "metal": "금속",
  "glass": "유리",
};
const emojiMap = {
  "general trash": "🗑",
  "plastic": "♻",
  "metal": "🛢",
  "glass": "🍾",
};

const getColor = (percent) => {
  if (percent >= 90) return "#FF0000";
  if (percent >= 60) return "#FF5733";
  if (percent >= 40) return "#FFC300";
  return "#4CAF50";
};

const Dashboard = () => {
  const [trashLevels, setTrashLevels] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchLevels = () => {
    fetch(`${SERVER_URL}/api/levels`)
      .then((res) => res.json())
      .then((data) => {
        const mapped = data.map((t) => ({
          ...t,
          label: typeMap[t.type] || t.type,
          emoji: emojiMap[t.type] || "❓"
        }));

        const order = ["general trash", "plastic", "metal", "glass"];
        const ordered = order.map(type =>
          mapped.find((item) => item.type === type) || {
            type,
            label: typeMap[type],
            emoji: emojiMap[type],
            level: 0
          }
        );
        setTrashLevels(ordered);
      })
      .catch((err) => console.error("채움률 가져오기 실패:", err));
  };

  const handleResetLevels = async () => {
    if (!window.confirm("정말 모든 채움률을 0%로 초기화하시겠습니까?")) return;
    setLoading(true);
    try {
      const res = await fetch(`${SERVER_URL}/api/levels/reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (res.ok) {
        alert("모든 채움률이 0%로 초기화되었습니다.");
        setTimeout(() => window.location.reload(), 300);
      } else {
        alert("초기화 실패");
      }
    } catch {
      alert("초기화 요청 실패");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLevels();
    const interval = setInterval(fetchLevels, 3000);

    let socket;
    if (localStorage.getItem("role") === "admin" || localStorage.getItem("role") === "superadmin") {
      socket = io(`${SERVER_URL}/alerts`);
      socket.on("connect", () => console.log("📡 Socket connected to alerts"));
      socket.on("admin_alert", (data) => alert(`[${typeMap[data.type] || data.type}] ${data.message}`));
      socket.on("disconnect", () => console.log("⚠️ Socket disconnected"));
    }
    return () => {
      clearInterval(interval);
      if (socket) socket.disconnect();
    };
  }, []);

  const isAdmin =
    localStorage.getItem("role") === "admin" ||
    localStorage.getItem("role") === "superadmin";

  return (
    <div className="page-container dashboard-container">
      <h1 className="dashboard-title">실시간 쓰레기량</h1>
      <div className="dashboard-bar-wrapper bar-wrapper-relative">
        {trashLevels.map((trash, idx) => (
          <div className="bar-item" key={idx}>
            <p className="bar-emoji">{trash.emoji}</p>
            <div className="bar-frame">
              <div
                className="bar-fill"
                style={{
                  height: `${trash.level}%`,
                  backgroundColor: getColor(trash.level),
                }}
              />
            </div>
            <p className="bar-label">{trash.label}</p>
            <p className="bar-percent">{trash.level}%</p>
          </div>
        ))}
        {isAdmin && (
          <button
            className="reset-level-btn"
            onClick={handleResetLevels}
            disabled={loading}
          >
            {loading ? "초기화 중..." : "모든 채움률 0%로 초기화"}
          </button>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
