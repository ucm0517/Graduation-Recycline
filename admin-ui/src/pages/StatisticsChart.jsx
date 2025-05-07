import React, { useState } from "react";
import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts";

const getDaysInMonth = (year, month) => new Date(year, month, 0).getDate();

const StatisticsChart = ({ data = [] }) => {
  const [mode, setMode] = useState("all");
  const [year, setYear] = useState(2025);
  const [month, setMonth] = useState(4);
  const [day, setDay] = useState(1);
  const [startDate, setStartDate] = useState({ year: 2025, month: 4, day: 1 });
  const [endDate, setEndDate] = useState({ year: 2025, month: 4, day: 2 });
  const [chartData, setChartData] = useState([]);

  const years = Array.from({ length: 2025 - 1900 + 1 }, (_, i) => 1900 + i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const days = Array.from({ length: getDaysInMonth(year, month) }, (_, i) => i + 1);

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#AA00FF"];

  const handleFilter = () => {
    let filtered = [];

    const ymd = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const ym = `${year}-${String(month).padStart(2, "0")}`;
    const y = `${year}`;

    if (mode === "all") {
      filtered = data;
    } else if (mode === "year") {
      filtered = data.filter((log) => log.time?.startsWith(y));
    } else if (mode === "month") {
      filtered = data.filter((log) => log.time?.startsWith(ym));
    } else if (mode === "day") {
      filtered = data.filter((log) => log.time?.startsWith(ymd));
    } else if (mode === "custom") {
      const start = new Date(`${startDate.year}-${String(startDate.month).padStart(2, "0")}-${String(startDate.day).padStart(2, "0")}`);
      const end = new Date(`${endDate.year}-${String(endDate.month).padStart(2, "0")}-${String(endDate.day).padStart(2, "0")}`);
      filtered = data.filter((log) => {
        const logDate = new Date(log.time);
        return logDate >= start && logDate <= end;
      });
    }

    const grouped = {};
    filtered.forEach((log) => {
      if (!log.result) return;
      grouped[log.result] = (grouped[log.result] || 0) + 1;
    });

    const pieData = Object.entries(grouped).map(([name, value]) => ({ name, value }));
    setChartData(pieData);
  };

  return (
    <div className="container">
      <h2 className="text-2xl font-bold mb-4">배출 통계</h2>
      <div className="flex gap-2 items-center justify-center flex-nowrap flex-wrap sm:flex-nowrap">
        <select className="px-4 py-2 text-base rounded border" value={mode} onChange={(e) => setMode(e.target.value)}>
          <option value="all">전체</option>
          <option value="year">연도별</option>
          <option value="month">월별</option>
          <option value="day">일별</option>
          <option value="custom">사용자 지정</option>
        </select>

        {(mode === "year" || mode === "month" || mode === "day") && (
          <select className="px-4 py-2 text-base rounded border" value={year} onChange={(e) => setYear(+e.target.value)}>
            {years.map((y) => <option key={y} value={y}>{y}년</option>)}
          </select>
        )}
        {(mode === "month" || mode === "day") && (
          <select className="px-4 py-2 text-base rounded border" value={month} onChange={(e) => setMonth(+e.target.value)}>
            {months.map((m) => <option key={m} value={m}>{m}월</option>)}
          </select>
        )}
        {mode === "day" && (
          <select className="px-4 py-2 text-base rounded border" value={day} onChange={(e) => setDay(+e.target.value)}>
            {days.map((d) => <option key={d} value={d}>{d}일</option>)}
          </select>
        )}
        {mode === "custom" && (
          <>
            <span>시작일</span>
            <select className="px-4 py-2 text-base rounded border" value={startDate.year} onChange={(e) => setStartDate({ ...startDate, year: +e.target.value })}>
              {years.map((y) => <option key={y} value={y}>{y}년</option>)}
            </select>
            <select className="px-4 py-2 text-base rounded border" value={startDate.month} onChange={(e) => setStartDate({ ...startDate, month: +e.target.value })}>
              {months.map((m) => <option key={m} value={m}>{m}월</option>)}
            </select>
            <select className="px-4 py-2 text-base rounded border" value={startDate.day} onChange={(e) => setStartDate({ ...startDate, day: +e.target.value })}>
              {Array.from({ length: getDaysInMonth(startDate.year, startDate.month) }, (_, i) => (
                <option key={i} value={i + 1}>{i + 1}일</option>
              ))}
            </select>
            <span>~ 종료일</span>
            <select className="px-4 py-2 text-base rounded border" value={endDate.year} onChange={(e) => setEndDate({ ...endDate, year: +e.target.value })}>
              {years.map((y) => <option key={y} value={y}>{y}년</option>)}
            </select>
            <select className="px-4 py-2 text-base rounded border" value={endDate.month} onChange={(e) => setEndDate({ ...endDate, month: +e.target.value })}>
              {months.map((m) => <option key={m} value={m}>{m}월</option>)}
            </select>
            <select className="px-4 py-2 text-base rounded border" value={endDate.day} onChange={(e) => setEndDate({ ...endDate, day: +e.target.value })}>
              {Array.from({ length: getDaysInMonth(endDate.year, endDate.month) }, (_, i) => (
                <option key={i} value={i + 1}>{i + 1}일</option>
              ))}
            </select>
          </>
        )}

        {/* ✅ 공통 검색 버튼: 줄바꿈 방지 */}
        <button className="btn px-5 py-2 text-base" onClick={handleFilter}>검색</button>
      </div>

      {chartData.length > 0 ? (
        <PieChart width={600} height={400}>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            outerRadius={120}
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={index} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      ) : (
        <p>선택한 조건에 맞는 데이터가 없습니다.</p>
      )}
    </div>
  );
};

export default StatisticsChart;
