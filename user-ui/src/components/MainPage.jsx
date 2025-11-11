import React, { useState, useEffect, useRef } from "react";
import RaspberryTrashMeter from "./RaspberryTrashMeter";
import MessageDisplay from "./MessageDisplay";
import { SERVER_URL, JETSON_URL } from "../config";

const MainPage = () => {
  const [state, setState] = useState("idle");
  const [levels, setLevels] = useState([0, 0, 0, 0]); // 명시적으로 초기값 설정
  const [lastUpdated, setLastUpdated] = useState(0);
  const [lastBegin, setLastBegin] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isMeasuring, setIsMeasuring] = useState(false);
  const [classificationResult, setClassificationResult] = useState("");

  // useRef로 상태 추적하여 비동기 문제 해결
  const stateRef = useRef(state);
  const isProcessingRef = useRef(isProcessing);
  
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    isProcessingRef.current = isProcessing;
  }, [isProcessing]);

  const isBusy = isProcessing || isMeasuring || state === "measuring" || state === "processing";

  const handleStartClassification = async () => {
    if (isBusy || state === "full") return;
    
    console.log("🚀 분류 시작 버튼 클릭");
    setIsProcessing(true);
    setState("processing");
    setClassificationResult(""); // 이전 결과 초기화

    try {
      const res = await fetch(`${JETSON_URL}/start`, { method: "POST" });
      if (res.ok) {
        console.log("✅ Jetson 시작 요청 성공");
        const beginRes = await fetch(`${SERVER_URL}/begin`, { method: "POST" });
        const beginData = await beginRes.json();
        setLastBegin(beginData.beginTime);
      } else {
        console.error("❌ Jetson 시작 요청 실패:", res.status);
        setIsProcessing(false);
        setState("idle");
      }
    } catch (err) {
      console.error("🚨 Jetson 연결 에러:", err);
      setIsProcessing(false);
      setState("idle");
    }
  };

  const handleEmptyConfirm = async () => {
    if (isBusy) return;
    
    console.log("🧹 비움 확인 시작");
    setState("measuring");
    setIsMeasuring(true);
    
    try {
      const res = await fetch(`${JETSON_URL}/empty_check_all`, {
        method: "POST",
      });
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      console.log("📊 비움 확인 결과:", data);

      const ordered = [
        Number(data.levels?.["general trash"]) || 0,
        Number(data.levels?.["plastic"]) || 0,
        Number(data.levels?.["metal"]) || 0,
        Number(data.levels?.["glass"]) || 0,
      ];
      
      console.log("Empty check levels:", ordered);
      setLevels(ordered);

      if (data.status === "cleared") {
        console.log("✅ 모든 쓰레기통이 비워짐");
        setState("empty_confirmed");
        setTimeout(() => {
          if (stateRef.current === "empty_confirmed") {
            setState("idle");
          }
        }, 4000);
      } else {
        console.log("⚠️ 아직 비워지지 않은 쓰레기통 있음");
        setState("full");
      }
    } catch (err) {
      console.error("🚨 비움 확인 실패:", err);
      setState("full");
    } finally {
      setIsMeasuring(false);
    }
  };

  const fetchLevels = async () => {
    // 측정 중이거나 비움 확인된 상태에서는 레벨 조회 안함
    if (["measuring", "empty_confirmed"].includes(stateRef.current)) {
      return;
    }

    try {
      const res = await fetch(`${SERVER_URL}/api/levels`);
      if (!res.ok) return;
      
      const data = await res.json();
      
      // 안전한 데이터 처리
      if (!Array.isArray(data)) {
        console.warn("API에서 받은 데이터가 배열이 아닙니다:", data);
        return;
      }
      
      const ordered = [
        Number(data.find((d) => d && d.type === "general trash")?.level) || 0,
        Number(data.find((d) => d && d.type === "plastic")?.level) || 0,
        Number(data.find((d) => d && d.type === "metal")?.level) || 0,
        Number(data.find((d) => d && d.type === "glass")?.level) || 0,
      ];
      
      console.log("Fetch levels:", ordered);
      setLevels(ordered);

      // 80% 이상인 것이 있고, 현재 특정 상태가 아닐 때만 full 상태로 변경
      if (ordered.some((v) => v >= 80) && 
          !["measuring", "empty_confirmed", "processing"].includes(stateRef.current)) {
        console.log("🗑️ 쓰레기통이 꽉 참 - full 상태로 변경");
        setState("full");
      }
    } catch (err) {
      console.error("🚨 levels 불러오기 실패:", err);
    }
  };

  // 분류 결과 가져오기
  const fetchLatestClassification = async () => {
    try {
      const res = await fetch(`${SERVER_URL}/api/logs?limit=1`);
      if (res.ok) {
        const data = await res.json();
        if (data.length > 0) {
          const latest = data[0];
          const resultMap = {
            "general trash": "일반쓰레기",
            "plastic": "플라스틱", 
            "metal": "금속",
            "glass": "유리"
          };
          return resultMap[latest.result] || latest.result;
        }
      }
    } catch (err) {
      console.error("분류 결과 조회 실패:", err);
    }
    return "";
  };

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${SERVER_URL}/data`);
        if (!res.ok) return;
        
        const data = await res.json();

        // 새로운 처리 시작 감지
        if (data.lastBegin !== lastBegin && data.lastBegin > lastBegin) {
          console.log("🔄 새로운 처리 시작 감지");
          setLastBegin(data.lastBegin);
          if (stateRef.current === "idle") {
            setState("processing");
            setIsProcessing(true);
          }
        }

        // 처리 완료 감지
        if (data.lastUpdated !== lastUpdated && 
            data.lastUpdated > lastUpdated && 
            stateRef.current === "processing" && 
            isProcessingRef.current) {
          
          console.log("✅ 처리 완료 감지");
          setLastUpdated(data.lastUpdated);
          setIsProcessing(false);
          
          // 분류 결과 가져오기
          const result = await fetchLatestClassification();
          setClassificationResult(result);
          
          setState("done");
          
          // 4초 후 상태 변경
          setTimeout(async () => {
            if (stateRef.current === "done") {
              console.log("⏰ done 상태에서 다음 단계로 전환");
              // 레벨 체크해서 full인지 확인
              await fetchLevels();
              
              // 레벨 체크 후 1초 뒤에 상태 결정
              setTimeout(() => {
                if (stateRef.current === "done") {
                  setState("idle");
                }
              }, 1000);
            }
          }, 4000);
        }

        // 특정 상태가 아닐 때만 레벨 업데이트
        if (!["measuring", "empty_confirmed", "processing"].includes(stateRef.current)) {
          await fetchLevels();
        }

      } catch (err) {
        console.error("데이터 가져오기 실패:", err);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [lastBegin, lastUpdated]);

  // 메시지 결정
  const getMessage = () => {
    switch (state) {
      case "processing":
        return "쓰레기를 처리중입니다!";
      case "done":
        return classificationResult ? 
          `분류 결과: ${classificationResult}` : 
          "처리 완료되었습니다!";
      case "measuring":
        return "쓰레기량 측정 중입니다, 잠시만 기다려 주세요!";
      case "full":
        return "쓰레기가 꽉 찼습니다ㅠㅠ";
      case "empty_confirmed":
        return "쓰레기통이 비워졌습니다!";
      default:
        return "쓰레기를 넣어주세요!";
    }
  };

  // 버튼 라벨 결정
  const getButtonLabel = () => {
    switch (state) {
      case "processing":
        return "처리 중...";
      case "measuring":
        return "측정 중...";
      case "full":
        return "쓰레기 비움 확인";
      default:
        return "쓰레기 분류 시작";
    }
  };

  const buttonHandler = state === "full" ? handleEmptyConfirm : handleStartClassification;

  return (
    <div style={styles.page}>
      <MessageDisplay message={getMessage()} />
      <button
        onClick={buttonHandler}
        style={{
          ...styles.button,
          backgroundColor: isBusy ? "#cccccc" : "#4f7fff",
          cursor: isBusy ? "not-allowed" : "pointer"
        }}
        disabled={isBusy}
      >
        {getButtonLabel()}
      </button>
      <RaspberryTrashMeter levels={levels} />
    </div>
  );
};

const styles = {
  page: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    height: "100vh",
    backgroundColor: "#d0f0c0",
  },
  button: {
    marginTop: "30px",
    padding: "14px 28px",
    fontSize: "18px",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    transition: "background-color 0.3s ease",
  },
};

export default MainPage;