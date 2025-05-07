import React from "react";

const TrashMeter = ({ levels }) => {
  // 라벨 순서를 일반, 플라스틱, 금속, 유리 순서로
  const labels = ["일반", "플라스틱", "금속", "유리"];

  const getColor = (percent) => {
    if (percent >= 80) return "#FF0000";
    if (percent >= 60) return "#FF5733";
    if (percent >= 40) return "#FFC300";
    if (percent >= 20) return "#A4C639";
    return "#4CAF50";
  };

  return (
    <div style={styles.container}>
      {levels.map((level, index) => (
        <div key={index} style={styles.binContainer}>
          <div style={styles.barContainer}>
            <div
              style={{
                ...styles.barFill,
                height: `${level}%`,
                backgroundColor: getColor(level),
              }}
            />
          </div>
          <p style={styles.percentLabel}>{level}%</p>
          <p style={styles.classLabel}>{labels[index]}</p>
        </div>
      ))}
    </div>
  );
};

const styles = {
  container: {
    display: "flex",
    gap: "20px",
    justifyContent: "center",
    marginTop: "20px",
  },
  binContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  barContainer: {
    width: "50px",
    height: "120px", // 보기 좋게 약간 높임
    border: "2px solid #000",
    backgroundColor: "#eee",
    display: "flex",
    flexDirection: "column-reverse",
    overflow: "hidden",
    borderRadius: "6px", // 모서리 둥글게
  },
  barFill: {
    width: "100%",
    transition: "height 0.6s ease, background-color 0.6s ease",
  },
  percentLabel: {
    marginTop: "8px",
    fontSize: "16px",
    fontWeight: "bold",
  },
  classLabel: {
    marginTop: "4px",
    fontSize: "14px",
    color: "#555",
  },
};

export default TrashMeter;
