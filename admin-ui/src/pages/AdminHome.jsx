import React, { useEffect, useState, useCallback } from "react";
import { io } from "socket.io-client";
import { SERVER_URL } from "../config";

const AdminHome = () => {
  const [latestImage, setLatestImage] = useState(null);
  const [logs, setLogs] = useState([]);
  const [trashLevels, setTrashLevels] = useState([]);
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(false);

  // useCallback으로 안정화
  const typeMap = useCallback(() => ({
    "general trash": "일반쓰레기",
    "plastic": "플라스틱", 
    "metal": "금속",
    "glass": "유리",
  }), []);

  const emojiMap = useCallback(() => ({
    "general trash": "🗑️",
    "plastic": "♻️",
    "metal": "🔧", 
    "glass": "🍾",
  }), []);

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
    const fetchData = () => {
      // 로그 데이터 가져오기
      fetch(`${SERVER_URL}/api/logs`)
        .then((res) => res.json())
        .then((data) => {
          setLogs(data);
          if (data && data.length > 0) setLatestImage(data[0]);
        })
        .catch(err => console.error("로그 데이터 가져오기 실패:", err));

      // 채움률 데이터 가져오기
      fetch(`${SERVER_URL}/api/levels`)
        .then((res) => res.json())
        .then((data) => {
          const mapped = data.map(t => ({
            ...t,
            label: typeMap()[t.type] || t.type,
            emoji: emojiMap()[t.type] || "❓"
          }));
          setTrashLevels(mapped);
        })
        .catch(err => console.error("채움률 데이터 가져오기 실패:", err));

      // 통계 데이터 가져오기
      fetch(`${SERVER_URL}/api/stats`)
        .then((res) => res.json())
        .then((data) => {
          setStats(data);
        })
        .catch(err => console.error("통계 데이터 가져오기 실패:", err));
    };

    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [typeMap, emojiMap]); // 의존성 추가

  // 관리자 알림 시스템
  useEffect(() => {
    // 관리자 권한 체크
    const role = localStorage.getItem("role");
    if (role !== "admin" && role !== "superadmin") {
      return;
    }

    // 브라우저 알림 권한 요청
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().then(permission => {
        console.log("브라우저 알림 권한:", permission);
      });
    }

    // Socket.IO 연결
    const socket = io(`${SERVER_URL}/alerts`);
    
    socket.on("connect", () => {
      console.log("관리자 알림 소켓 연결됨");
    });

    // 80% 이상 알림 수신
    socket.on("admin_alert", (data) => {
      const { type, message, timestamp } = data;
      console.log(`관리자 알림 수신:`, data);
      
      // 화면 알림 (Alert)
      alert(`🚨 ${message}`);
      
      // 브라우저 알림 (선택사항)
      if (Notification.permission === "granted") {
        new Notification("쓰레기통 가득참 알림", {
          body: message,
          icon: "/favicon.ico",
          tag: `trash-full-${type}`, // 같은 타입 알림 덮어쓰기 방지
          requireInteraction: true // 사용자가 직접 닫을 때까지 유지
        });
      }
      
      console.log(`🚨 ${message} (시간: ${timestamp})`);
    });

    socket.on("disconnect", () => {
      console.log("관리자 알림 소켓 연결 해제");
    });

    // 컴포넌트 언마운트시 소켓 연결 해제
    return () => {
      socket.disconnect();
    };
  }, []);

  const getStatusColor = (level) => {
    if (level >= 90) return "#ff4757";
    if (level >= 70) return "#ffa502";
    if (level >= 50) return "#ffda79";
    return "#2ed573";
  };

  const totalItems = stats.reduce((sum, item) => sum + item.value, 0);

  // 관리자 권한 체크
  const isAdmin =
    localStorage.getItem("role") === "admin" ||
    localStorage.getItem("role") === "superadmin";

  return (
    <div className="page-container">
      <div className="admin-home-container">
        {/* 헤더 */}
        <div className="admin-home-header">
          <h1>리사이클린 관리 대시보드</h1>
          <p>실시간 쓰레기 분류 및 관리 시스템</p>
        </div>

        {/* 상단 통계 카드들 */}
        <div className="stats-grid">
          <div className="stat-card stat-card-purple">
            <div className="stat-number">{totalItems}</div>
            <div className="stat-label">총 처리량</div>
          </div>
          <div className="stat-card stat-card-pink">
            <div className="stat-text">
              {latestImage ? typeMap()[latestImage.result] || latestImage.result : "없음"}
            </div>
            <div className="stat-label">최근 분류</div>
          </div>
          <div className="stat-card stat-card-blue">
            <div className="stat-number">
              {trashLevels.length > 0 
                ? Math.round(trashLevels.reduce((sum, t) => sum + t.level, 0) / trashLevels.length)
                : 0}%
            </div>
            <div className="stat-label">평균 채움률</div>
          </div>
          <div className="stat-card stat-card-orange">
            <div className="stat-text">🟢 정상 운영</div>
            <div className="stat-label">시스템 상태</div>
          </div>
        </div>

        {/* 메인 콘텐츠 영역 */}
        <div className="main-content">
          {/* 왼쪽: 실시간 쓰레기량 */}
          <div className="dashboard-section">
            <h2>실시간 쓰레기량</h2>
            <div style={{ position: "relative" }}>
              <div className="trash-bars">
                {[
                  { type: "general trash", emoji: "🗑️", label: "일반쓰레기" },
                  { type: "plastic", emoji: "♻️", label: "플라스틱" },
                  { type: "metal", emoji: "🔧", label: "금속" },
                  { type: "glass", emoji: "🍾", label: "유리" }
                ].map((item, index) => {
                  const levelData = trashLevels.find(t => t.type === item.type);
                  const level = levelData ? levelData.level : 0;
                  
                  return (
                    <div key={index} className="trash-bar-item">
                      <div className="trash-emoji">{item.emoji}</div>
                      <div className="trash-bar">
                        <div 
                          className="trash-fill"
                          style={{
                            height: `${level}%`,
                            backgroundColor: getStatusColor(level)
                          }}
                        />
                      </div>
                      <div className="trash-label">{item.label}</div>
                      <div className="trash-percent">{level}%</div>
                    </div>
                  );
                })}
              </div>
              
              {/* 초기화 버튼 */}
              {isAdmin && (
                <button
                  onClick={handleResetLevels}
                  disabled={loading}
                  style={{
                    position: "absolute",
                    left: "50%",
                    bottom: "-60px",
                    transform: "translateX(-50%)",
                    padding: "12px 36px",
                    minWidth: "220px",
                    fontSize: "16px",
                    borderRadius: "8px",
                    background: "#ff0000",
                    color: "#fff",
                    fontWeight: "bold",
                    border: "none",
                    cursor: loading ? "wait" : "pointer",
                    transition: "background 0.2s",
                    zIndex: 2,
                  }}
                  onMouseEnter={(e) => {
                    if (!loading) e.target.style.background = "#cc0000";
                  }}
                  onMouseLeave={(e) => {
                    if (!loading) e.target.style.background = "#ff0000";
                  }}
                >
                  {loading ? "초기화 중..." : "모든 채움률 0%로 초기화"}
                </button>
              )}
            </div>
          </div>

          {/* 오른쪽: 정보 패널들 */}
          <div className="info-panels">
            {/* 최근 분류 이미지 */}
            <div className="info-card">
              <h3>최근 분류 이미지</h3>
              {latestImage ? (
                <div className="latest-image-content">
                  <img
                    src={`${SERVER_URL}/images/${latestImage.filename}`}
                    alt="분류 이미지"
                    className="latest-image"
                  />
                  <div className="image-info">
                    <div className="image-result">
                      {emojiMap()[latestImage.result]} {typeMap()[latestImage.result] || latestImage.result}
                    </div>
                    <div className="image-time">
                      {new Date(latestImage.time).toLocaleString("ko-KR")}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="no-data">분류된 이미지가 없습니다</div>
              )}
            </div>

            {/* 채움률 현황 */}
            <div className="info-card">
              <h3>채움률 현황</h3>
              <div className="level-list">
                {[
                  { type: "general trash", emoji: "🗑️", label: "일반쓰레기" },
                  { type: "plastic", emoji: "♻️", label: "플라스틱" },
                  { type: "metal", emoji: "🔧", label: "금속" },
                  { type: "glass", emoji: "🍾", label: "유리" }
                ].map((item, index) => {
                  const levelData = trashLevels.find(t => t.type === item.type);
                  const level = levelData ? levelData.level : 0;
                  
                  return (
                    <div key={index} className="level-item">
                      <div className="level-info">
                        <span className="level-emoji">{item.emoji}</span>
                        <span className="level-label">{item.label}</span>
                      </div>
                      <div className="level-progress">
                        <div className="progress-bar">
                          <div 
                            className="progress-fill"
                            style={{
                              width: `${level}%`,
                              backgroundColor: getStatusColor(level)
                            }}
                          />
                        </div>
                        <span 
                          className="level-percent"
                          style={{ color: getStatusColor(level) }}
                        >
                          {level}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* 하단: 최근 활동 로그 */}
        <div className="recent-logs">
          <h3>최근 활동 로그</h3>
          <div className="logs-grid">
            {logs.slice(0, 8).map((log, index) => (
              <div key={index} className="log-item">
                <div className="log-header">
                  <span className="log-emoji">{emojiMap[log.result] || "📄"}</span>
                  <span className="log-type">{typeMap[log.result] || log.result}</span>
                </div>
                <div className="log-time">
                  {new Date(log.time).toLocaleString("ko-KR", {
                    month: "short",
                    day: "numeric", 
                    hour: "2-digit",
                    minute: "2-digit"
                  })}
                </div>
              </div>
            ))}
          </div>
          {logs.length === 0 && (
            <div className="no-data">아직 활동 로그가 없습니다</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminHome;