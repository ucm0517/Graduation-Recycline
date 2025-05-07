// src/pages/PendingPage.jsx
import React from "react";
import { useNavigate } from "react-router-dom";

const PendingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-blue-100 to-blue-200">
      <div className="bg-white p-10 rounded-lg shadow-lg text-center animate-fadeIn">
        <h1 className="text-2xl font-bold mb-4">승인 대기 중입니다</h1>
        <p className="text-gray-600 mb-6">
          관리자의 승인이 완료되면 서비스를 이용하실 수 있습니다.
        </p>

        {/* 홈으로 돌아가기 버튼 추가 */}
        <button
          className="btn"
          onClick={() => navigate("/")}
        >
          홈으로 돌아가기
        </button>
      </div>
    </div>
  );
};

export default PendingPage;
