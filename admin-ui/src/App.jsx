import React from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import PrivateRoute from "./components/PrivateRoute";
import Redirector from "./components/Redirector";
import Layout from "./components/Layout";

import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import PendingPage from "./pages/PendingPage";
import AdminHome from "./pages/AdminHome";
import StatisticsChart from "./pages/StatisticsChart";
import TrashLogTable from "./pages/TrashLogTable";
import UserManagementPage from "./pages/UserManagementPage";
import LevelLogTable from "./pages/LevelLogTable";

const AppRoutes = () => {
  const location = useLocation();

  return (
    <Routes location={location} key={location.pathname}>
      <Route path="/" element={<Layout><Redirector /></Layout>} />
      <Route path="/pending" element={<Layout><PendingPage /></Layout>} />
      
      {/* 관리자 홈 페이지 */}
      <Route
        path="/admin/home"
        element={
          <Layout>
            <PrivateRoute roles={["admin", "superadmin"]}>
              <AdminHome />
            </PrivateRoute>
          </Layout>
        }
      />
      
      {/* 배출량 통계 */}
      <Route
        path="/admin/statistics"
        element={
          <Layout>
            <PrivateRoute roles={["admin", "superadmin"]}>
              <StatisticsChart />
            </PrivateRoute>
          </Layout>
        }
      />
      
      {/* 배출 로그 */}
      <Route
        path="/admin/logs"
        element={
          <Layout>
            <PrivateRoute roles={["admin", "superadmin"]}>
              <TrashLogTable />
            </PrivateRoute>
          </Layout>
        }
      />
      
      {/* 채움률 로그 */}
      <Route
        path="/admin/levels"
        element={
          <Layout>
            <PrivateRoute roles={["admin", "superadmin"]}>
              <LevelLogTable />
            </PrivateRoute>
          </Layout>
        }
      />
      
      {/* 사용자 관리 (superadmin만) */}
      <Route
        path="/admin/users"
        element={
          <Layout>
            <PrivateRoute roles={["superadmin"]}>
              <UserManagementPage />
            </PrivateRoute>
          </Layout>
        }
      />

      {/* 인증 페이지 */}
      <Route path="/admin/auth" element={<Layout><LoginPage /></Layout>} />
      <Route path="/admin/register" element={<Layout><RegisterPage /></Layout>} />
      
      {/* 기본 리다이렉트 - 홈으로 */}
      <Route path="/admin/dashboard" element={<Navigate to="/admin/home" replace />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

const App = () => {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
};

export default App;