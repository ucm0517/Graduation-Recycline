// src/pages/WelcomePage.jsx
import React from "react";
import { useNavigate } from "react-router-dom";

const WelcomePage = () => {
  const navigate = useNavigate();

  return (
    <div className="welcome-container">
      <div className="welcome-box animate-fadeIn">
        <h1 className="text-3xl font-bold mb-4">환영합니다!</h1>
        <p className="text-gray-700 mb-6">
          관리자 대시보드에 오신 것을 환영합니다.<br />
          로그인 후 다양한 기능을 사용할 수 있습니다.
        </p>

        <div className="flex gap-4 justify-center">
          <button className="btn" onClick={() => navigate("/admin/auth")}>
            로그인 하기
          </button>
          <button className="btn" onClick={() => navigate("/admin/register")}>
            회원가입 하기
          </button>
        </div>
      </div>
    </div>
  );
};

export default WelcomePage;
