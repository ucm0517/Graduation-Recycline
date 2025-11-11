import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { SERVER_URL } from "../config";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    // 유효성 검사
    if (!email.trim()) {
      setError("이메일을 입력해주세요.");
      setIsLoading(false);
      return;
    }

    if (!password.trim()) {
      setError("비밀번호를 입력해주세요.");
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch(`${SERVER_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.status === 403) {
        // 승인되지 않은 사용자
        localStorage.setItem("token", data.token);
        localStorage.setItem("name", data.name);
        localStorage.setItem("role", data.role);
        localStorage.setItem("approved", "false");
        navigate("/pending");
        return;
      }

      if (res.ok) {
        // 승인된 사용자
        localStorage.setItem("token", data.token);
        localStorage.setItem("name", data.name);
        localStorage.setItem("role", data.role);
        localStorage.setItem("approved", data.approved === true || data.approved === 1 ? "true" : "false");
        navigate(data.approved ? "/admin/home" : "/pending");
        window.location.reload();
      } else {
        setError(data.message || "로그인에 실패했습니다.");
      }
    } catch (err) {
      setError("서버 연결에 실패했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-background">
        <div className="auth-shapes">
          <div className="auth-shape shape-1"></div>
          <div className="auth-shape shape-2"></div>
          <div className="auth-shape shape-3"></div>
        </div>
      </div>

      <div className="auth-container">
        <div className="auth-card">
          {/* 로고 섹션 */}
          <div className="auth-header">
            <div className="auth-logo">
              <img src="/images/Recyclean.png" alt="리사이클린" className="auth-logo-img" />
            </div>
            <h1>관리자 로그인</h1>
            <p>리사이클린 관리 시스템에 접속하세요</p>
          </div>

          {/* 로그인 폼 */}
          <form onSubmit={handleLogin} className="auth-form">
            {error && (
              <div className="error-alert">
                <span className="error-icon">⚠️</span>
                <span className="error-message">{error}</span>
              </div>
            )}

            <div className="input-group">
              <label htmlFor="email">이메일</label>
              <div className="input-wrapper">
                <span className="input-icon">📧</span>
                <input
                  id="email"
                  type="email"
                  placeholder="이메일을 입력하세요"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={error && !email.trim() ? "input-error" : ""}
                  disabled={isLoading}
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="input-group">
              <label htmlFor="password">비밀번호</label>
              <div className="input-wrapper">
                <span className="input-icon">🔒</span>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="비밀번호를 입력하세요"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={error && !password.trim() ? "input-error" : ""}
                  disabled={isLoading}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              className={`submit-btn ${isLoading ? 'loading' : ''}`}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="loading-spinner"></span>
                  <span>로그인 중...</span>
                </>
              ) : (
                <>
                  <span>🚀</span>
                  <span>로그인</span>
                </>
              )}
            </button>
          </form>

          {/* 추가 액션 */}
          <div className="auth-footer">
            <div className="auth-divider">
              <span>또는</span>
            </div>
            
            <div className="auth-links">
              <button 
                className="link-btn register-link"
                onClick={() => navigate("/admin/register")}
                disabled={isLoading}
              >
                <span>📝</span>
                <span>새 계정 만들기</span>
              </button>
              
              <button 
                className="link-btn home-link"
                onClick={() => navigate("/")}
                disabled={isLoading}
              >
                <span>🏠</span>
                <span>홈으로 돌아가기</span>
              </button>
            </div>

            <div className="auth-info">
              <p>🔐 관리자 승인 후 이용 가능합니다</p>
            </div>
          </div>
        </div>

        {/* 사이드 정보 패널 */}
        <div className="auth-side-panel">
          <div className="side-content">
            <h3>🌟 시스템 특징</h3>
            <div className="feature-list">
              <div className="feature-item">
                <span className="feature-icon">🤖</span>
                <div className="feature-text">
                  <strong>AI 기반 분류</strong>
                  <p>머신러닝으로 정확한 쓰레기 분류</p>
                </div>
              </div>
              <div className="feature-item">
                <span className="feature-icon">📊</span>
                <div className="feature-text">
                  <strong>실시간 모니터링</strong>
                  <p>채움률과 처리량 실시간 확인</p>
                </div>
              </div>
              <div className="feature-item">
                <span className="feature-icon">🔒</span>
                <div className="feature-text">
                  <strong>보안 관리</strong>
                  <p>권한 기반 안전한 시스템</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;