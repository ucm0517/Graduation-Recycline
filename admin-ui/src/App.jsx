// src/App.jsx
import React, { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import PrivateRoute from "./components/PrivateRoute";
import Redirector from "./components/Redirector";
import Layout from "./components/Layout";

import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import PendingPage from "./pages/PendingPage";
import Dashboard from "./pages/Dashboard";
import StatisticsChart from "./pages/StatisticsChart";
import TrashLogTable from "./pages/TrashLogTable";
import UserManagementPage from "./pages/UserManagementPage";
import allLogs from "./pages/allLogs";

const App = () => {
  const [logs] = useState(allLogs);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout><Redirector /></Layout>} />
        <Route path="/pending" element={<Layout><PendingPage /></Layout>} />

        <Route
          path="/admin/dashboard"
          element={
            <Layout>
              <PrivateRoute roles={["admin", "superadmin"]}>
                <Dashboard />
              </PrivateRoute>
            </Layout>
          }
        />
        <Route
          path="/admin/statistics"
          element={
            <Layout>
              <PrivateRoute roles={["admin", "superadmin"]}>
                <StatisticsChart data={logs} />
              </PrivateRoute>
            </Layout>
          }
        />
        <Route
          path="/admin/logs"
          element={
            <Layout>
              <PrivateRoute roles={["admin", "superadmin"]}>
                <TrashLogTable data={logs} />
              </PrivateRoute>
            </Layout>
          }
        />
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

        <Route path="/admin/auth" element={<Layout><LoginPage /></Layout>} />
        <Route path="/admin/register" element={<Layout><RegisterPage /></Layout>} />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
