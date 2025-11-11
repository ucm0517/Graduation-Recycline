import React from "react";

const RaspberryTrashMeter = function(props) {
  console.log("RaspberryTrashMeter received props:", props);
  
  // 한글 라벨 (이모지 없음)
  const labels = ["일반", "플라스틱", "금속", "유리"];
  
  // 완전히 안전한 기본값
  let finalLevels = [0, 0, 0, 0];
  
  // props 안전 처리
  if (props) {
    const inputLevels = props.levels;
    if (inputLevels && typeof inputLevels === 'object' && inputLevels.length) {
      try {
        for (let i = 0; i < Math.min(4, inputLevels.length); i++) {
          const val = inputLevels[i];
          if (typeof val === 'number' && !isNaN(val)) {
            finalLevels[i] = Math.max(0, Math.min(100, val));
          }
        }
      } catch (e) {
        console.error("Level processing error:", e);
        finalLevels = [0, 0, 0, 0];
      }
    }
  }

  // 색상 함수 (간단하게)
  function getBarColor(percent) {
    if (percent >= 80) return "#FF0000"; // 빨강
    if (percent >= 60) return "#FF5733"; // 주황빨강
    if (percent >= 40) return "#FFC300"; // 노랑
    if (percent >= 20) return "#A4C639"; // 연두
    return "#4CAF50"; // 초록
  }

  // 상태 텍스트 (이모지 없음)
  function getStatusText(percent) {
    if (percent >= 80) return "꽉참";
    if (percent >= 60) return "거의참";
    if (percent >= 40) return "반정도";
    if (percent >= 20) return "조금참";
    return "비어있음";
  }

  // 인라인 스타일 (변수 사용 안함)
  const containerStyle = {
    display: "flex",
    gap: "20px",
    justifyContent: "center",
    marginTop: "30px",
    flexWrap: "wrap"
  };

  const binStyle = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    minWidth: "70px"
  };

  const barContainerStyle = {
    width: "50px",
    height: "120px",
    border: "2px solid #333",
    backgroundColor: "#f0f0f0",
    position: "relative",
    borderRadius: "5px",
    overflow: "hidden"
  };

  const percentStyle = {
    marginTop: "8px",
    fontSize: "16px",
    fontWeight: "bold",
    color: "#333",
    textAlign: "center"
  };

  const statusStyle = {
    marginTop: "2px",
    fontSize: "11px",
    color: "#666",
    textAlign: "center"
  };

  const labelStyle = {
    marginTop: "4px",
    fontSize: "14px",
    color: "#444",
    fontWeight: "500",
    textAlign: "center"
  };

  // 렌더링
  return React.createElement("div", { style: containerStyle },
    finalLevels.map(function(level, index) {
      const barFillStyle = {
        width: "100%",
        height: level + "%",
        backgroundColor: getBarColor(level),
        position: "absolute",
        bottom: "0",
        left: "0",
        transition: "height 0.5s ease"
      };

      return React.createElement("div", { 
        key: "bin-" + index, 
        style: binStyle 
      }, [
        React.createElement("div", { 
          key: "container-" + index,
          style: barContainerStyle 
        }, 
          React.createElement("div", { 
            key: "fill-" + index,
            style: barFillStyle 
          })
        ),
        React.createElement("p", { 
          key: "percent-" + index,
          style: percentStyle 
        }, level + "%"),
        React.createElement("p", { 
          key: "status-" + index,
          style: statusStyle 
        }, getStatusText(level)),
        React.createElement("p", { 
          key: "label-" + index,
          style: labelStyle 
        }, labels[index])
      ]);
    })
  );
};

export default RaspberryTrashMeter;