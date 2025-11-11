import React, { useEffect, useState } from "react";
import { SERVER_URL } from "../config";

const typeMap = {
  "general trash": "일반쓰레기",
  "plastic": "플라스틱",
  "metal": "금속",
  "glass": "유리",
};
const colorMap = {
  "general trash": "#9E9E9E",
  "plastic": "#4CAF50",
  "metal": "#607D8B",
  "glass": "#2196F3",
};

const RealTimeTrashLevel = () => {
  const [trashLevels, setTrashLevels] = useState([]);

  useEffect(() => {
    fetch(`${SERVER_URL}/api/levels`)
      .then((res) => res.json())
      .then((data) => {
        const mapped = data.map((t) => ({
          ...t,
          label: typeMap[t.type] || t.type,
          color: colorMap[t.type] || "#ccc"
        }));
        setTrashLevels(mapped);
      });
  }, []);

  return (
    <div className="grid grid-cols-4 gap-8">
      {trashLevels.map((trash, index) => (
        <div key={index} className="flex flex-col items-center">
          <div className="relative w-24 h-40 border-2 border-gray-400 rounded-t-full overflow-hidden">
            <div
              className="absolute bottom-0 left-0 w-full"
              style={{ height: `${trash.level}%`, backgroundColor: trash.color }}
            />
          </div>
          <p className="mt-4 font-semibold">{trash.label}</p>
          <p className="text-sm text-gray-600">{trash.level}%</p>
        </div>
      ))}
    </div>
  );
};

export default RealTimeTrashLevel;
