  import React, { useState, useEffect, useRef } from "react";
  import { SERVER_URL, JETSON_URL } from "../config";

  const InlineMainPage = () => {
    // 주요 상태 변수들
    const [state, setState] = useState("idle");                    // 시스템 현재 상태
    const [levels, setLevels] = useState([0, 0, 0, 0]);           // 쓰레기통 채움률
    const [lastUpdated, setLastUpdated] = useState(0);            // 마지막 업데이트 시간
    const [lastBegin, setLastBegin] = useState(0);                // 마지막 처리 시작 시간
    const [isProcessing, setIsProcessing] = useState(false);      // 처리 진행 상태
    const [isMeasuring, setIsMeasuring] = useState(false);        // 측정 진행 상태
    const [classificationResult, setClassificationResult] = useState(""); // 분류 결과
    const [timeoutIds, setTimeoutIds] = useState([]);             // 타이머 ID 관리

    const stateRef = useRef(state);
    const isProcessingRef = useRef(isProcessing);
    
    // 모든 timeout 클리어하는 함수
    const clearAllTimeouts = () => {
      timeoutIds.forEach(id => clearTimeout(id));
      setTimeoutIds([]);
    };
    
    useEffect(() => {
      stateRef.current = state;
    }, [state]);

    useEffect(() => {
      isProcessingRef.current = isProcessing;
    }, [isProcessing]);

    const isBusy = isProcessing || isMeasuring || state === "measuring" || state === "processing" || state === "done" || state === "completed";

    // 메시지에 따른 배경색 결정
    const getMessageBoxStyle = () => {
      const baseStyle = {
        marginTop: "40px",
        textAlign: "center",
        padding: "20px",
        borderRadius: "15px",
        boxShadow: "0 6px 20px rgba(0,0,0,0.15)",
        maxWidth: "600px",
        margin: "40px 20px 0 20px",
        border: "2px solid rgba(255,255,255,0.3)"
      };

      switch (state) {
        case "processing":
          return { ...baseStyle, backgroundColor: "rgba(33, 150, 243, 0.1)", borderColor: "#2196F3" };
        case "done":
          return { ...baseStyle, backgroundColor: "rgba(76, 175, 80, 0.1)", borderColor: "#4CAF50" };
        case "completed":
          return { ...baseStyle, backgroundColor: "rgba(76, 175, 80, 0.15)", borderColor: "#4CAF50" };
        case "measuring":
          return { ...baseStyle, backgroundColor: "rgba(255, 152, 0, 0.1)", borderColor: "#FF9800" };
        case "full":
          return { ...baseStyle, backgroundColor: "rgba(244, 67, 54, 0.1)", borderColor: "#F44336" };
        case "empty_confirmed":
          return { ...baseStyle, backgroundColor: "rgba(76, 175, 80, 0.15)", borderColor: "#4CAF50" };
        default:
          return { ...baseStyle, backgroundColor: "rgba(156, 39, 176, 0.08)", borderColor: "#9C27B0" };
      }
    };

    const handleStartClassification = async () => {
      if (isBusy || state === "full") return;
      
      console.log("분류 시작 버튼 클릭");
      clearAllTimeouts(); // 이전 timeout들 모두 클리어
      setIsProcessing(true);
      setState("processing");
      setClassificationResult("");

      try {
        const res = await fetch(`${JETSON_URL}/start`, { method: "POST" });
        if (res.ok) {
          console.log("Jetson 시작 요청 성공");
          const beginRes = await fetch(`${SERVER_URL}/begin`, { method: "POST" });
          const beginData = await beginRes.json();
          setLastBegin(beginData.beginTime);
        } else {
          console.error("Jetson 시작 요청 실패:", res.status);
          setIsProcessing(false);
          setState("idle");
        }
      } catch (err) {
        console.error("Jetson 연결 에러:", err);
        setIsProcessing(false);
        setState("idle");
      }
    };

    const handleEmptyConfirm = async () => {
      if (isBusy) return;
      
      console.log("비움 확인 시작");
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
        console.log("비움 확인 결과:", data);

        const ordered = [
          Number(data.levels?.["general trash"]) || 0,
          Number(data.levels?.["plastic"]) || 0,
          Number(data.levels?.["metal"]) || 0,
          Number(data.levels?.["glass"]) || 0,
        ];
        
        console.log("Empty check levels:", ordered);
        setLevels(ordered);

        if (data.status === "cleared") {
          console.log("모든 쓰레기통이 비워짐");
          clearAllTimeouts(); // 비움 확인 시 이전 timeout들 클리어
          setState("empty_confirmed");
          setClassificationResult(""); // 이전 분류 결과 초기화
          
          const timeoutId = setTimeout(() => {
            if (stateRef.current === "empty_confirmed") {
              setState("idle");
              setClassificationResult(""); // idle로 돌아갈 때 분류 결과 초기화
            }
          }, 4000);
          setTimeoutIds([timeoutId]);
          
        } else {
          console.log("아직 비워지지 않은 쓰레기통 있음");
          setState("full");
        }
      } catch (err) {
        console.error("비움 확인 실패:", err);
        setState("full");
      } finally {
        setIsMeasuring(false);
      }
    };

    const fetchLevels = async () => {
      if (["measuring", "empty_confirmed", "completed"].includes(stateRef.current)) {
        return;
      }

      try {
        const res = await fetch(`${SERVER_URL}/api/levels`);
        if (!res.ok) return;
        
        const data = await res.json();
        
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

        if (ordered.some((v) => v >= 80) && 
            !["measuring", "empty_confirmed", "processing", "completed"].includes(stateRef.current)) {
          console.log("쓰레기통이 꽉 참 - full 상태로 변경");
          setState("full");
        }
      } catch (err) {
        console.error("levels 불러오기 실패:", err);
      }
    };

    const fetchLatestClassification = async (beginTime) => {
      try {
        const res = await fetch(`${SERVER_URL}/api/logs?limit=10`); // 더 많은 로그 가져오기
        if (res.ok) {
          const data = await res.json();
          if (data.length > 0) {
            // beginTime 이후에 생성된 로그만 찾기
            const recentLog = data.find(log => {
              const logTime = new Date(log.time).getTime();
              return logTime > beginTime;
            });
            
            if (recentLog) {
              const resultMap = {
                "general trash": "일반쓰레기",
                "plastic": "플라스틱", 
                "metal": "금속",
                "glass": "유리"
              };
              return resultMap[recentLog.result] || recentLog.result;
            }
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

          if (data.lastBegin !== lastBegin && data.lastBegin > lastBegin) {
            console.log("새로운 처리 시작 감지");
            setLastBegin(data.lastBegin);
            setClassificationResult(""); // 새로운 처리 시작 시 이전 결과 초기화
            if (stateRef.current === "idle") {
              setState("processing");
              setIsProcessing(true);
            }
          }

          if (data.lastUpdated !== lastUpdated && 
              data.lastUpdated > lastUpdated && 
              stateRef.current === "processing" && 
              isProcessingRef.current) {
            
            console.log("처리 완료 감지");
            setLastUpdated(data.lastUpdated);
            setIsProcessing(false);
            
            const result = await fetchLatestClassification(lastBegin);
            
            // 새로운 분류 결과가 있을 때만 done 상태로 변경
            if (result) {
              setClassificationResult(result);
              setState("done");
              
              // 4초 후 "처리 완료" 상태로 변경
              const timeoutId1 = setTimeout(async () => {
                if (stateRef.current === "done") {
                  setState("completed");
                  
                  // 3초 후 레벨 체크 및 다음 단계로
                  const timeoutId2 = setTimeout(async () => {
                    if (stateRef.current === "completed") {
                      console.log("completed 상태에서 다음 단계로 전환");
                      await fetchLevels();
                      
                      const timeoutId3 = setTimeout(() => {
                        if (stateRef.current === "completed") {
                          setState("idle");
                          setClassificationResult(""); // idle로 돌아갈 때 분류 결과 초기화
                        }
                      }, 1000);
                      setTimeoutIds(prev => [...prev, timeoutId3]);
                    }
                  }, 3000);
                  setTimeoutIds(prev => [...prev, timeoutId2]);
                }
              }, 4000);
              setTimeoutIds(prev => [...prev, timeoutId1]);
              
            } else {
              // 새로운 결과가 없으면 processing 상태 유지
              console.log("새로운 분류 결과가 아직 없음, processing 상태 유지");
              setIsProcessing(true);
            }
          }

          if (!["measuring", "empty_confirmed", "processing", "completed"].includes(stateRef.current)) {
            await fetchLevels();
          }

        } catch (err) {
          console.error("데이터 가져오기 실패:", err);
        }
      }, 1000);

      return () => {
        clearInterval(interval);
        clearAllTimeouts(); // 컴포넌트 언마운트 시 모든 timeout 클리어
      };
    }, [lastBegin, lastUpdated]);

    const getMessage = () => {
      switch (state) {
        case "processing":
          return "쓰레기를 처리중입니다!";
        case "done":
          return classificationResult ? 
            `분류 결과: ${classificationResult}` : 
            "처리 완료되었습니다!";
        case "completed":
          return "처리 완료되었습니다!";
        case "measuring":
          return "쓰레기량 측정 중입니다, 잠시만 기다려 주세요!";
        case "full":
          return "쓰레기가 꽉 찼습니다";
        case "empty_confirmed":
          return "쓰레기통이 비워졌습니다!";
        default:
          return "쓰레기를 넣어주세요!";
      }
    };

    const getButtonLabel = () => {
      switch (state) {
        case "processing":
          return "처리 중...";
        case "done":
          return "처리 중...";
        case "completed":
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

    // 인라인 TrashMeter 컴포넌트
    const renderTrashMeter = () => {
      const labels = ["일반", "플라스틱", "금속", "유리"];
      
      const getColor = (percent) => {
        if (percent >= 80) return "#FF0000";
        if (percent >= 60) return "#FF5733";
        if (percent >= 40) return "#FFC300";
        if (percent >= 20) return "#A4C639";
        return "#4CAF50";
      };

      const getStatusText = (percent) => {
        if (percent >= 80) return "꽉참";
        if (percent >= 60) return "거의참";
        if (percent >= 40) return "반정도";
        if (percent >= 20) return "조금참";
        return "비어있음";
      };

      return (
        <div style={{
          display: "flex",
          gap: "20px",
          justifyContent: "center",
          marginTop: "30px",
          flexWrap: "wrap"
        }}>
          {levels.map((level, index) => {
            const safeLevel = Number(level) || 0;
            return (
              <div key={index} style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                minWidth: "70px"
              }}>
                <div style={{
                  width: "50px",
                  height: "120px",
                  border: "2px solid #333",
                  backgroundColor: "#f0f0f0",
                  position: "relative",
                  borderRadius: "5px",
                  overflow: "hidden"
                }}>
                  <div style={{
                    width: "100%",
                    height: `${Math.max(0, Math.min(100, safeLevel))}%`,
                    backgroundColor: getColor(safeLevel),
                    position: "absolute",
                    bottom: "0",
                    left: "0",
                    transition: "height 0.5s ease"
                  }} />
                </div>
                <p style={{
                  marginTop: "8px",
                  fontSize: "16px",
                  fontWeight: "bold",
                  color: "#333",
                  textAlign: "center"
                }}>{safeLevel}%</p>
                <p style={{
                  marginTop: "2px",
                  fontSize: "11px",
                  color: "#666",
                  textAlign: "center"
                }}>{getStatusText(safeLevel)}</p>
                <p style={{
                  marginTop: "4px",
                  fontSize: "14px",
                  color: "#444",
                  fontWeight: "500",
                  textAlign: "center"
                }}>{labels[index]}</p>
              </div>
            );
          })}
        </div>
      );
    };

    return (
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        height: "100vh",
        backgroundColor: "#d0f0c0"
      }}>
        <div style={getMessageBoxStyle()}>
          <h2 style={{
            fontSize: "1.8rem",
            fontWeight: "600",
            margin: 0,
            lineHeight: "1.4",
            color: "#333"
          }}>
            {getMessage()}
          </h2>
        </div>
        
        <button
          onClick={buttonHandler}
          style={{
            marginTop: "30px",
            padding: "14px 28px",
            fontSize: "18px",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            transition: "background-color 0.3s ease",
            backgroundColor: isBusy ? "#cccccc" : "#4f7fff",
            cursor: isBusy ? "not-allowed" : "pointer"
          }}
          disabled={isBusy}
        >
          {getButtonLabel()}
        </button>
        
        {renderTrashMeter()}
      </div>
    );
  };

  export default InlineMainPage;