import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const PendingPage = () => {
  const navigate = useNavigate();
  const [userName] = useState(localStorage.getItem("name") || "사용자");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [animationStep, setAnimationStep] = useState(0);

  useEffect(() => {
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    const animationInterval = setInterval(() => {
      setAnimationStep(prev => (prev + 1) % 3);
    }, 1000);

    return () => {
      clearInterval(timeInterval);
      clearInterval(animationInterval);
    };
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  const steps = [
    {
      icon: "📝",
      title: "회원가입 완료",
      description: "계정이 성공적으로 생성되었습니다",
      status: "completed"
    },
    {
      icon: "⏳",
      title: "관리자 검토 중",
      description: "관리자가 계정을 검토하고 있습니다",
      status: "current"
    },
    {
      icon: "✅",
      title: "승인 완료",
      description: "시스템 이용이 가능해집니다",
      status: "pending"
    }
  ];

  const faqs = [
    {
      question: "승인은 얼마나 걸리나요?",
      answer: "일반적으로 1-2일 내에 승인이 완료됩니다. 업무일 기준으로 처리됩니다."
    },
    {
      question: "승인 현황을 어떻게 확인하나요?",
      answer: "이 페이지에서 새로고침하거나, 승인 완료시 등록된 이메일로 알림을 받을 수 있습니다."
    },
    {
      question: "승인이 거절될 수도 있나요?",
      answer: "부적절한 정보나 중복 계정의 경우 승인이 거절될 수 있습니다. 거절시 이메일로 안내됩니다."
    },
    {
      question: "문의는 어디로 하나요?",
      answer: "admin@recyclean.kr로 문의하시거나 시스템 관리자에게 직접 연락해주세요."
    }
  ];

  return (
    <div className="pending-page">
      <div className="pending-background">
        <div className="pending-shapes">
          {[...Array(5)].map((_, i) => (
            <div 
              key={i} 
              className={`pending-shape shape-${i + 1}`}
              style={{
                animationDelay: `${i * 0.5}s`,
                opacity: animationStep === i % 3 ? 1 : 0.3
              }}
            />
          ))}
        </div>
      </div>

      <div className="pending-container">
        {/* 헤더 */}
        <div className="pending-header">
          <div className="pending-logo">
            <img src="/images/Recyclean.png" alt="리사이클린" className="logo-img" />
          </div>
          
          <div className="pending-welcome">
            <h1>안녕하세요, <span className="user-name">{userName}</span>님! 👋</h1>
            <p className="pending-subtitle">계정 승인을 기다리고 있습니다</p>
            
            <div className="current-time">
              <span className="time-label">현재 시간:</span>
              <span className="time-value">
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

        {/* 승인 진행 단계 */}
        <div className="approval-progress">
          <h2>승인 진행 상황</h2>
          <div className="progress-steps">
            {steps.map((step, index) => (
              <div key={index} className={`progress-step ${step.status}`}>
                <div className="step-icon">
                  <span className="icon">{step.icon}</span>
                  {step.status === "current" && (
                    <div className="pulse-ring"></div>
                  )}
                </div>
                <div className="step-content">
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                </div>
                {index < steps.length - 1 && (
                  <div className={`step-connector ${index === 0 ? 'completed' : 'pending'}`}></div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 대기 중 정보 */}
        <div className="pending-info">
          <div className="info-cards">
            <div className="info-card">
              <div className="card-icon">📧</div>
              <div className="card-content">
                <h3>이메일 알림</h3>
                <p>승인 완료시 등록된 이메일로<br/>자동 알림을 보내드립니다</p>
              </div>
            </div>
            
            <div className="info-card">
              <div className="card-icon">🔒</div>
              <div className="card-content">
                <h3>보안 검토</h3>
                <p>계정 정보와 권한을<br/>철저히 검토하고 있습니다</p>
              </div>
            </div>
            
            <div className="info-card">
              <div className="card-icon">⚡</div>
              <div className="card-content">
                <h3>빠른 처리</h3>
                <p>최대한 신속하게<br/>승인 처리하겠습니다</p>
              </div>
            </div>
          </div>
        </div>

        {/* 자주 묻는 질문 */}
        <div className="faq-section">
          <h2>자주 묻는 질문</h2>
          <div className="faq-list">
            {faqs.map((faq, index) => (
              <div key={index} className="faq-item">
                <div className="faq-question">
                  <span className="faq-icon">❓</span>
                  <span>{faq.question}</span>
                </div>
                <div className="faq-answer">
                  <span className="answer-icon">💡</span>
                  <span>{faq.answer}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 액션 버튼 */}
        <div className="pending-actions">
          <button className="action-btn refresh-btn" onClick={handleRefresh}>
            <span className="btn-icon">🔄</span>
            <span>상태 새로고침</span>
          </button>
          
          <button className="action-btn logout-btn" onClick={handleLogout}>
            <span className="btn-icon">🚪</span>
            <span>로그아웃</span>
          </button>
        </div>

        {/* 푸터 */}
        <div className="pending-footer">
          <div className="footer-content">
            <p>
              <strong>문의사항이 있으시면 언제든 연락해주세요</strong>
            </p>
            <div className="contact-info">
              <span>📧 admin@recyclean.kr</span>
              <span>📞 02-1234-5678</span>
              <span>⏰ 평일 09:00-18:00</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PendingPage;