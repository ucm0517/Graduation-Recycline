// src/pages/LoginPage.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        const approvedStr = data.approved === true || data.approved === 1 ? "true" : "false";

        localStorage.setItem("token", data.token);
        localStorage.setItem("name", data.name);
        localStorage.setItem("role", data.role);
        localStorage.setItem("approved", approvedStr);

        console.log("✅ 로그인 성공:", {
          token: data.token,
          name: data.name,
          role: data.role,
          approved: approvedStr,
        });

        // 승인 상태에 따라 라우팅 분기 + 강제 리렌더링
        if (approvedStr === "true") {
          navigate("/admin/dashboard");
        } else {
          navigate("/pending");
        }

        window.location.reload(); // ✅ 둘 다 무조건 리로드로 Navbar 반영
      } else if (res.status === 403) {
        alert(data.message || "승인 대기 중입니다.");
        // ✅ 승인 전 사용자도 localStorage 저장
        const approvedStr = "false";
        localStorage.setItem("token", data.token);
        localStorage.setItem("name", data.name);
        localStorage.setItem("role", data.role);
        localStorage.setItem("approved", approvedStr);

        navigate("/pending");
        window.location.reload(); // ✅ Navbar 강제 반영
      } else {
        setError(data.message || "로그인 실패");
      }
    } catch (err) {
      setError("서버 연결 실패");
    }
  };

  return (
    <div className="container">
      <form onSubmit={handleLogin} className="auth-form">
        <h2 className="text-2xl font-bold mb-6">로그인</h2>

        {error && <p className="text-red-500 mb-4">{error}</p>}

        <input
          type="email"
          placeholder="이메일"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-2 mb-4 border rounded"
          required
        />
        <input
          type="password"
          placeholder="비밀번호"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-2 mb-6 border rounded"
          required
        />

        <button type="submit" className="btn w-full">
          로그인
        </button>
      </form>
    </div>
  );
};

export default LoginPage;
