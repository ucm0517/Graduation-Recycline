// src/components/PrivateRoute.jsx
import React from "react";
import { useLocation, Navigate } from "react-router-dom";

const PrivateRoute = ({ children, roles }) => {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");
  const approved = localStorage.getItem("approved");

  const location = useLocation();

  if (!token) {
    alert("로그인이 필요합니다.");
    return <Navigate to="/admin/auth" replace />;
  }

  // 승인 안 된 사용자도 페이지는 볼 수 있도록 허용 (alert만 표시)
  if ((approved !== "true" && approved !== "1") && location.pathname.startsWith("/admin")) {
    alert("관리자 승인이 필요합니다.");
    // 페이지는 그대로 보여줌 (children 렌더링)
  }

  if (roles && !roles.includes(role)) {
    alert("접근 권한이 없습니다.");
    return <Navigate to="/" replace />;
  }

  return children;
};

export default PrivateRoute;
