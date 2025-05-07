import React, { useEffect, useMemo } from "react";

const Dashboard = () => {
  const trashLevels = useMemo(() => [
    { type: "일반쓰레기", level: 90 },  // 테스트용 90 이상
    { type: "플라스틱", level: 50 },
    { type: "금속", level: 30 },
    { type: "유리", level: 20 },
  ], []);  // 의존성 배열: 빈 배열이면 최초 한 번만 생성됨

  const getColor = (percent) => {
    if (percent >= 90) return "#FF0000";
    if (percent >= 60) return "#FF5733";
    if (percent >= 40) return "#FFC300";
    return "#4CAF50";
  };

  useEffect(() => {
    trashLevels.forEach((trash) => {
      if (trash.level >= 90) {
        alert(`${trash.type}가 ${trash.level}% 차 있어요! 수거가 필요합니다.`);
      }
    });
  }, [trashLevels]); // 이제 의존성으로 안전하게 사용 가능

  return (
    <div className="container">
      <h1 className="text-3xl font-bold text-center mb-8">실시간 쓰레기량</h1>
      <div className="card-grid">
        {trashLevels.map((trash, idx) => (
          <div key={idx} className="flex flex-col items-center mx-4">
            <div className="cylinder">
              <div
                className="fill"
                style={{
                  height: `${trash.level}%`,
                  backgroundColor: getColor(trash.level),
                }}
              />
            </div>
            <p className="mt-2 font-semibold">{trash.type}</p>
            <p>{trash.level}%</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
