import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const AdminNavbar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [auth, setAuth] = useState({
    token: null,
    name: null,
    role: null,
    approved: null,
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    const name = localStorage.getItem("name");
    const role = localStorage.getItem("role");
    const approved = localStorage.getItem("approved");
    setAuth({ token, name, role, approved });
  }, [location]);

  const isLoggedIn = !!auth.token;
  const isApproved = auth.approved === "true" || auth.approved === "1";

  const handleLogout = () => {
    localStorage.clear();
    alert("로그아웃되었습니다.");
    navigate("/");
  };

  const handleClick = (path) => {
    if (!isApproved) {
      alert("관리자 승인이 필요합니다.");
    } else {
      navigate(path);
    }
  };

  return (
    <nav className="navbar">
      <div className="flex gap-4">
        {isLoggedIn ? (
          <>
            <button className="btn" onClick={() => handleClick("/admin/dashboard")}>
              대시보드
            </button>
            <button className="btn" onClick={() => handleClick("/admin/statistics")}>
              배출량 통계
            </button>
            <button className="btn" onClick={() => handleClick("/admin/logs")}>
              배출 로그
            </button>
            {auth.role === "superadmin" && (
              <button className="btn" onClick={() => handleClick("/admin/users")}>
                사용자 관리
              </button>
            )}
          </>
        ) : (
          <>
            <button className="btn" onClick={() => navigate("/admin/auth")}>
              로그인
            </button>
            <button className="btn" onClick={() => navigate("/admin/register")}>
              회원가입
            </button>
          </>
        )}
      </div>

      <div className="flex gap-2 items-center">
        {isLoggedIn && (
          <>
            {auth.name && <span className="font-semibold">{auth.name}님</span>}
            <button className="btn" onClick={handleLogout}>로그아웃</button>
          </>
        )}
      </div>
    </nav>
  );
};

export default AdminNavbar;
