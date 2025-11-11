// src/pages/AdminDashboard.jsx
import React, { useEffect, useState } from "react";
import TrashLogTable from "./TrashLogTable";
import StatisticsChart from "./StatisticsChart";
import Dashboard from "./Dashboard";
import { SERVER_URL } from "../config";

const AdminDashboard = () => {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    fetch(`${SERVER_URL}/api/logs`)
      .then((res) => res.json())
      .then((data) => setLogs(data))
      .catch((err) => console.error("로그 가져오기 실패:", err));
  }, []);

  return (
    <>
      <Dashboard />
      <StatisticsChart data={logs} />
      <TrashLogTable data={logs} />
    </>
  );
};

export default AdminDashboard;
