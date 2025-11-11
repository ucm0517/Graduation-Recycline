import React, { useEffect, useState } from "react";

const WelcomePage = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [animationStep, setAnimationStep] = useState(0);

  useEffect(() => {
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    const animationInterval = setInterval(() => {
      setAnimationStep(prev => (prev + 1) % 4);
    }, 500);

    return () => {
      clearInterval(timeInterval);
      clearInterval(animationInterval);
    };
  }, []);

  const handleLogin = () => {
    window.location.href = "/admin/auth";
  };

  const handleRegister = () => {
    window.location.href = "/admin/register";
  };

  const features = [
    {
      icon: "🤖",
      title: "AI 기반 분류",
      description: "최신 머신러닝으로 정확한 쓰레기 분류"
    },
    {
      icon: "📊",
      title: "실시간 모니터링",
      description: "채움률과 처리량을 실시간으로 확인"
    },
    {
      icon: "📈",
      title: "통계 분석",
      description: "데이터 기반의 효율적인 관리"
    },
    {
      icon: "🔒",
      title: "안전한 관리",
      description: "권한 기반의 보안 시스템"
    }
  ];

  return (
    <div className="welcome-page">
      {/* 배경 애니메이션 */}
      <div className="welcome-background">
        <div className="floating-shapes">
          {[...Array(6)].map((_, i) => (
            <div 
              key={i} 
              className={`floating-shape shape-${i + 1}`}
              style={{
                animationDelay: `${i * 0.8}s`,
                opacity: animationStep === i % 4 ? 1 : 0.3
              }}
            />
          ))}
        </div>
      </div>

      <div className="welcome-container">
        {/* 헤더 */}
        <div className="welcome-header">
          <div className="brand-logo">
            <img
              src="/images/Recyclean.png"
              alt="리사이클린 로고"
              className="logo-image"
            />
          </div>
          
          <div className="welcome-content">
            <h1 className="welcome-title">
              <span className="title-main">리사이클린</span>
              <span className="title-sub">Recyclean</span>
            </h1>
            
            <p className="welcome-subtitle">
              AI 기반 스마트 쓰레기 분류 관리 시스템
            </p>
            
            <div className="system-status">
              <div className="status-item">
                <span className="status-dot active"></span>
                <span>시스템 정상 운영중</span>
              </div>
              <div className="status-item">
                <span className="time-display">
                  {currentTime.toLocaleString('ko-KR', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 기능 소개 */}
        <div className="features-section">
          <h2>시스템 주요 기능</h2>
          <div className="features-grid">
            {features.map((feature, index) => (
              <div 
                key={index} 
                className="feature-card"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="feature-icon">{feature.icon}</div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 액션 버튼 */}
        <div className="welcome-actions">
          <div className="action-description">
            <h3>관리자 대시보드에 접속하세요</h3>
            <p>시스템 모니터링과 데이터 분석을 위해 로그인이 필요합니다</p>
          </div>
          
          <div className="action-buttons">
            <button className="action-btn primary" onClick={handleLogin}>
              <span className="btn-icon">🔑</span>
              <span className="btn-text">로그인</span>
            </button>
            <button className="action-btn secondary" onClick={handleRegister}>
              <span className="btn-icon">📝</span>
              <span className="btn-text">회원가입</span>
            </button>
          </div>
        </div>

        {/* 푸터 정보 */}
        <div className="welcome-footer">
          <div className="footer-content">
            <div className="footer-item">
              <span className="footer-label">버전:</span>
              <span className="footer-value">v2.2.0</span>
            </div>
            <div className="footer-item">
              <span className="footer-label">최종 업데이트:</span>
              <span className="footer-value">2025.06.17</span>
            </div>
            <div className="footer-item">
              <span className="footer-label">문의:</span>
              <span className="footer-value">monde@recyclean.kr</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomePage;