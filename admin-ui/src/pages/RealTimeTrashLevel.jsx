import React from "react";

const RealTimeTrashLevel = () => {
  // 임시 쓰레기량 데이터 (0 ~ 100%)
  const trashLevels = [
    { type: "일반쓰레기", level: 80 },
    { type: "플라스틱", level: 50 },
    { type: "금속", level: 30 },
    { type: "유리", level: 20 },
  ];

  return (
    <div className="grid grid-cols-4 gap-8">
      {trashLevels.map((trash, index) => (
        <div key={index} className="flex flex-col items-center">
          <div className="relative w-24 h-40 border-2 border-gray-400 rounded-t-full overflow-hidden">
            {/* 쓰레기 채워진 부분 */}
            <div
              className="absolute bottom-0 left-0 w-full bg-green-400"
              style={{ height: `${trash.level}%` }}
            />
          </div>
          <p className="mt-4 font-semibold">{trash.type}</p>
          <p className="text-sm text-gray-600">{trash.level}%</p>
        </div>
      ))}
    </div>
  );
};

export default RealTimeTrashLevel;
