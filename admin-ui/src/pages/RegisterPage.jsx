import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    email: "",
    name: "",
    password: "",
    confirmPassword: ""
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const navigate = useNavigate();

  const validatePassword = (password) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    return strength;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (name === "password") {
      setPasswordStrength(validatePassword(value));
    }

    // 실시간 에러 제거
    if (error) setError("");
  };

  const validateForm = () => {
    const { email, name, password, confirmPassword } = formData;

    if (!email.trim()) return "이메일을 입력해주세요.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "올바른 이메일 형식이 아닙니다.";
    if (!name.trim()) return "이름을 입력해주세요.";
    if (name.trim().length < 2) return "이름은 2글자 이상이어야 합니다.";
    if (!password) return "비밀번호를 입력해주세요.";
    if (password.length < 6) return "비밀번호는 6글자 이상이어야 합니다.";
    if (password !== confirmPassword) return "비밀번호가 일치하지 않습니다.";

    return null;
  };

  const getPasswordStrengthText = (strength) => {
    switch (strength) {
      case 0:
      case 1: return "매우 약함";
      case 2: return "약함";
      case 3: return "보통";
      case 4: return "강함";
      case 5: return "매우 강함";
      default: return "";
    }
  };

  const getPasswordStrengthColor = (strength) => {
    switch (strength) {
      case 0:
      case 1: return "#ff4757";
      case 2: return "#ffa502";
      case 3: return "#ffda79";
      case 4: return "#2ed573";
      case 5: return "#1e90ff";
      default: return "#e9ecef";
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("http://43.202.10.147:3001/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email.trim(),
          name: formData.name.trim(),
          password: formData.password
        }),
      });

      const data = await res.json();
      
      if (res.ok) {
        setSuccess("회원가입이 완료되었습니다! 관리자 승인 후 로그인 가능합니다.");
        setTimeout(() => navigate("/admin/auth"), 2000);
      } else {
        setError(data.message || "회원가입에 실패했습니다.");
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
          {/* 헤더 */}
          <div className="auth-header">
            <div className="auth-logo">
              <img src="/images/Recyclean.png" alt="리사이클린" className="auth-logo-img" />
            </div>
            <h1>계정 생성</h1>
            <p>리사이클린 관리자 계정을 생성하세요</p>
          </div>

          {/* 회원가입 폼 */}
          <form onSubmit={handleRegister} className="auth-form">
            {error && (
              <div className="error-alert">
                <span className="error-icon">⚠️</span>
                <span className="error-message">{error}</span>
              </div>
            )}

            {success && (
              <div className="success-alert">
                <span className="success-icon">✅</span>
                <span className="success-message">{success}</span>
              </div>
            )}

            <div className="input-group">
              <label htmlFor="email">이메일</label>
              <div className="input-wrapper">
                <span className="input-icon">📧</span>
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="이메일을 입력하세요"
                  value={formData.email}
                  onChange={handleInputChange}
                  disabled={isLoading}
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="input-group">
              <label htmlFor="name">이름</label>
              <div className="input-wrapper">
                <span className="input-icon">👤</span>
                <input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="이름을 입력하세요"
                  value={formData.name}
                  onChange={handleInputChange}
                  disabled={isLoading}
                  autoComplete="name"
                />
              </div>
            </div>

            <div className="input-group">
              <label htmlFor="password">비밀번호</label>
              <div className="input-wrapper">
                <span className="input-icon">🔒</span>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="비밀번호를 입력하세요"
                  value={formData.password}
                  onChange={handleInputChange}
                  disabled={isLoading}
                  autoComplete="new-password"
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
              {formData.password && (
                <div className="password-strength">
                  <div className="strength-bar">
                    <div 
                      className="strength-fill"
                      style={{
                        width: `${(passwordStrength / 5) * 100}%`,
                        backgroundColor: getPasswordStrengthColor(passwordStrength)
                      }}
                    />
                  </div>
                  <span 
                    className="strength-text"
                    style={{ color: getPasswordStrengthColor(passwordStrength) }}
                  >
                    {getPasswordStrengthText(passwordStrength)}
                  </span>
                </div>
              )}
            </div>

            <div className="input-group">
              <label htmlFor="confirmPassword">비밀번호 확인</label>
              <div className="input-wrapper">
                <span className="input-icon">🔐</span>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="비밀번호를 다시 입력하세요"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  disabled={isLoading}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={isLoading}
                >
                  {showConfirmPassword ? "🙈" : "👁️"}
                </button>
              </div>
              {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                <div className="password-match-error">
                  ❌ 비밀번호가 일치하지 않습니다
                </div>
              )}
              {formData.confirmPassword && formData.password === formData.confirmPassword && formData.password && (
                <div className="password-match-success">
                  ✅ 비밀번호가 일치합니다
                </div>
              )}
            </div>

            <button 
              type="submit" 
              className={`submit-btn ${isLoading ? 'loading' : ''}`}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="loading-spinner"></span>
                  <span>계정 생성 중...</span>
                </>
              ) : (
                <>
                  <span>📝</span>
                  <span>계정 생성</span>
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
                className="link-btn login-link"
                onClick={() => navigate("/admin/auth")}
                disabled={isLoading}
              >
                <span>🔑</span>
                <span>기존 계정으로 로그인</span>
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
              <p>📋 회원가입 안내</p>
              <ul>
                <li>관리자 승인 후 시스템 이용 가능</li>
                <li>승인 완료시 이메일로 안내</li>
                <li>문의: monde@recyclean.kr</li>
              </ul>
            </div>
          </div>
        </div>

        {/* 사이드 정보 패널 */}
        <div className="auth-side-panel">
          <div className="side-content">
            <h3>🚀 회원가입 혜택</h3>
            <div className="benefit-list">
              <div className="benefit-item">
                <span className="benefit-icon">📊</span>
                <div className="benefit-text">
                  <strong>실시간 대시보드</strong>
                  <p>시스템 현황을 한눈에 확인</p>
                </div>
              </div>
              <div className="benefit-item">
                <span className="benefit-icon">📈</span>
                <div className="benefit-text">
                  <strong>상세 통계 분석</strong>
                  <p>데이터 기반 효율적 관리</p>
                </div>
              </div>
              <div className="benefit-item">
                <span className="benefit-icon">🔔</span>
                <div className="benefit-text">
                  <strong>알림 시스템</strong>
                  <p>중요 이벤트 즉시 알림</p>
                </div>
              </div>
              <div className="benefit-item">
                <span className="benefit-icon">⚙️</span>
                <div className="benefit-text">
                  <strong>시스템 관리</strong>
                  <p>전체 시스템 제어 권한</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;