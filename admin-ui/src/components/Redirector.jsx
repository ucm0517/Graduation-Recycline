import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import WelcomePage from "../pages/WelcomePage";

const Redirector = () => {
  const [ready, setReady] = useState(false);
  const [token, setToken] = useState(null);
  const [approved, setApproved] = useState(null);

  useEffect(() => {
    let t = localStorage.getItem("token");
    let a = localStorage.getItem("approved");

    // 유효하지 않은 토큰 및 승인 처리
    if (!t || t === "undefined" || t === "null") {
      t = null;
      localStorage.removeItem("token");
    }

    if (!a || a === "undefined" || a === "null") {
      a = null;
      localStorage.removeItem("approved");
    }

    setToken(t);
    setApproved(a);
    setReady(true);
  }, []);

  if (!ready) return null;

  // 승인된 사용자는 홈으로 리다이렉트
  if (token && approved === "true") {
    return <Navigate to="/admin/home" replace />;
  }

  // 승인되지 않은 사용자는 대기 페이지로
  if (token && approved !== "true") {
    return <Navigate to="/pending" replace />;
  }

  // 로그인하지 않은 사용자는 환영 페이지
  return <WelcomePage />;
};

export default Redirector;