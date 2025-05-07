// src/components/Redirector.jsx
import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import WelcomePage from "../pages/WelcomePage";

const Redirector = () => {
  const [ready, setReady] = useState(false);
  const [token, setToken] = useState(null);
  const [approved, setApproved] = useState(null);

  useEffect(() => {
    const t = localStorage.getItem("token");
    const a = localStorage.getItem("approved");
    setToken(t);
    setApproved(a);
    setReady(true); // localStorage 로딩 완료 후 렌더링
  }, []);

  if (!ready) return null;

  if (token && approved === "true") { 
    return <Navigate to="/admin/dashboard" replace />;
  }

  if (token && approved !== "true") {
    return <Navigate to="/pending" replace />;
  }

  return <WelcomePage />;
};

export default Redirector;
