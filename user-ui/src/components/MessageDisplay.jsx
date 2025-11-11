import React from "react";

const TrashMeter = ({ levels }) => {
  // 라벨 순서를 일반, 플라스틱, 금속, 유리 순서로
  const labels = ["일반", "플라스틱", "금속", "유리"];

  const getColor = (percent) => {
    if (percent >= 80) return "#FF0000"; // 빨간색 - 꽉참
    if (percent >= 60) return "#FF5733"; // 주황빨간색
    if (percent >= 40) return "#FFC300"; // 노란색
    if (percent >= 20) return "#A4C639"; // 연두색
    return "#4CAF50"; // 초록색 - 비어있음
  };

  const getStatusText = (percent) => {
    if (percent >= 80) return "꽉참";
    if (percent >= 60) return "거의참";
    if (percent >= 40) return "반정도";
    if (percent >= 20) return "조금참";
    return "비어있음";
  };

  return (
    <div style={styles.container}>
      {levels.map((level, index) => (
        <div key={index} style={styles.binContainer}>
          <div style={styles.barContainer}>
            <div
              style={{
                ...styles.barFill,
                height: `${Math.max(0, Math.min(100, level))}%`, // 0-100% 범위 제한
                backgroundColor: getColor(level),
              }}
            />
          </div>
          <p style={styles.percentLabel}>{level}%</p>
          <p style={styles.statusLabel}>{getStatusText(level)}</p>
          <p style={styles.classLabel}>{labels[index]}</p>
        </div>
      ))}
    </div>
  );
};

const styles = {
  container: {
    display: "flex",
    gap: "25px",
    justifyContent: "center",
    marginTop: "30px",
    flexWrap: "wrap", // 작은 화면에서 줄바꿈 가능
  },
  binContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    minWidth: "80px", // 최소 너비 보장
  },
  barContainer: {
    width: "60px",
    height: "140px",
    border: "3px solid #333",
    backgroundColor: "#f5f5f5",
    display: "flex",
    flexDirection: "column-reverse",
    overflow: "hidden",
    borderRadius: "8px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)", // 그림자 효과
  },
  barFill: {
    width: "100%",
    transition: "height 0.8s ease, background-color 0.5s ease",
    borderRadius: "0 0 5px 5px", // 하단 모서리만 둥글게
  },
  percentLabel: {
    marginTop: "10px",
    fontSize: "18px",
    fontWeight: "bold",
    color: "#333",
  },
  statusLabel: {
    marginTop: "2px",
    fontSize: "12px",
    color: "#666",
    fontStyle: "italic",
  },
  classLabel: {
    marginTop: "6px",
    fontSize: "16px",
    color: "#444",
    fontWeight: "500",
  },
};

export default TrashMeter;