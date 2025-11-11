import React, { useState, useEffect } from "react";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { SERVER_URL } from "../config";

const getDaysInMonth = (year, month) => new Date(year, month, 0).getDate();

const translateClassName = (name) => {
  switch (name) {
    case "plastic": return "플라스틱";
    case "metal": return "금속";
    case "glass": return "유리";
    case "general trash": return "일반쓰레기";
    default: return name;
  }
};

const StatisticsChart = () => {
  const [allLogs, setAllLogs] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);

  const [mode, setMode] = useState("all");
  const [year, setYear] = useState(2025);
  const [month, setMonth] = useState(4);
  const [day, setDay] = useState(1);
  const [startDate, setStartDate] = useState({ year: 2025, month: 4, day: 1 });
  const [endDate, setEndDate] = useState({ year: 2025, month: 4, day: 2 });

  const years = Array.from({ length: 2025 - 1900 + 1 }, (_, i) => 1900 + i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const days = Array.from({ length: getDaysInMonth(year, month) }, (_, i) => i + 1);

  const COLORS = ["#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FCEA2B", "#FF9F43"];

  useEffect(() => {
    setLoading(true);
    fetch(`${SERVER_URL}/api/logs`)
      .then((res) => res.json())
      .then((data) => {
        setAllLogs(data);
        applyFilter(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("로그 불러오기 실패:", err);
        setLoading(false);
      });
  }, []);

  const applyFilter = (sourceData) => {
    let filtered = [];

    const ymd = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const ym = `${year}-${String(month).padStart(2, "0")}`;
    const y = `${year}`;

    if (mode === "all") {
      filtered = sourceData;
    } else if (mode === "year") {
      filtered = sourceData.filter((log) => log.time?.startsWith(y));
    } else if (mode === "month") {
      filtered = sourceData.filter((log) => log.time?.startsWith(ym));
    } else if (mode === "day") {
      filtered = sourceData.filter((log) => log.time?.startsWith(ymd));
    } else if (mode === "custom") {
      const start = new Date(`${startDate.year}-${String(startDate.month).padStart(2, "0")}-${String(startDate.day).padStart(2, "0")}`);
      const end = new Date(`${endDate.year}-${String(endDate.month).padStart(2, "0")}-${String(endDate.day).padStart(2, "0")}`);
      filtered = sourceData.filter((log) => {
        const logDate = new Date(log.time);
        return logDate >= start && logDate <= end;
      });
    }

    const grouped = {};
    filtered.forEach((log) => {
      if (!log.result) return;
      const translatedName = translateClassName(log.result);
      grouped[translatedName] = (grouped[translatedName] || 0) + 1;
    });

    const pieData = Object.entries(grouped).map(([name, value]) => ({ name, value }));
    setChartData(pieData);
  };

  const handleFilter = () => {
    applyFilter(allLogs);
  };

  const totalCount = chartData.reduce((sum, item) => sum + item.value, 0);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const percentage = ((data.value / totalCount) * 100).toFixed(1);
      return (
        <div className="custom-tooltip">
          <p className="tooltip-label">{data.name}</p>
          <p className="tooltip-value">{data.value}건 ({percentage}%)</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="statistics-page">
      <div className="statistics-container">
        {/* 헤더 */}
        <div className="statistics-header">
          <h1>배출량 통계</h1>
          <p>기간별 쓰레기 분류 현황을 확인하세요</p>
        </div>

        {/* 필터 카드 */}
        <div className="filter-card">
          <div className="filter-row">
            <div className="filter-group">
              <label>기간 선택</label>
              <select value={mode} onChange={(e) => setMode(e.target.value)} className="modern-select">
                <option value="all">전체 기간</option>
                <option value="year">연도별</option>
                <option value="month">월별</option>
                <option value="day">일별</option>
                <option value="custom">사용자 지정</option>
              </select>
            </div>

            {(mode === "year" || mode === "month" || mode === "day") && (
              <div className="filter-group">
                <label>연도</label>
                <select value={year} onChange={(e) => setYear(+e.target.value)} className="modern-select">
                  {years.map((y) => <option key={y} value={y}>{y}년</option>)}
                </select>
              </div>
            )}

            {(mode === "month" || mode === "day") && (
              <div className="filter-group">
                <label>월</label>
                <select value={month} onChange={(e) => setMonth(+e.target.value)} className="modern-select">
                  {months.map((m) => <option key={m} value={m}>{m}월</option>)}
                </select>
              </div>
            )}

            {mode === "day" && (
              <div className="filter-group">
                <label>일</label>
                <select value={day} onChange={(e) => setDay(+e.target.value)} className="modern-select">
                  {days.map((d) => <option key={d} value={d}>{d}일</option>)}
                </select>
              </div>
            )}

            {mode === "custom" && (
              <div className="date-range-group">
                <div className="date-group">
                  <label>시작일</label>
                  <div className="date-selects">
                    <select value={startDate.year} onChange={e => setStartDate({ ...startDate, year: +e.target.value })} className="modern-select">
                      {years.map((y) => <option key={y} value={y}>{y}</option>)}
                    </select>
                    <select value={startDate.month} onChange={e => setStartDate({ ...startDate, month: +e.target.value })} className="modern-select">
                      {months.map((m) => <option key={m} value={m}>{m}</option>)}
                    </select>
                    <select value={startDate.day} onChange={e => setStartDate({ ...startDate, day: +e.target.value })} className="modern-select">
                      {Array.from({ length: getDaysInMonth(startDate.year, startDate.month) }, (_, i) => (
                        <option key={i} value={i + 1}>{i + 1}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="date-separator">~</div>
                <div className="date-group">
                  <label>종료일</label>
                  <div className="date-selects">
                    <select value={endDate.year} onChange={e => setEndDate({ ...endDate, year: +e.target.value })} className="modern-select">
                      {years.map((y) => <option key={y} value={y}>{y}</option>)}
                    </select>
                    <select value={endDate.month} onChange={e => setEndDate({ ...endDate, month: +e.target.value })} className="modern-select">
                      {months.map((m) => <option key={m} value={m}>{m}</option>)}
                    </select>
                    <select value={endDate.day} onChange={e => setEndDate({ ...endDate, day: +e.target.value })} className="modern-select">
                      {Array.from({ length: getDaysInMonth(endDate.year, endDate.month) }, (_, i) => (
                        <option key={i} value={i + 1}>{i + 1}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            <button onClick={handleFilter} className="filter-btn">
              📊 통계 조회
            </button>
          </div>
        </div>

        {/* 통계 요약 카드들 */}
        {chartData.length > 0 && (
          <div className="stats-summary">
            <div className="summary-card">
              <div className="summary-number">{totalCount}</div>
              <div className="summary-label">총 배출량</div>
            </div>
            <div className="summary-card">
              <div className="summary-number">{chartData.length}</div>
              <div className="summary-label">분류 종류</div>
            </div>
            <div className="summary-card">
              <div className="summary-number">
                {chartData.length > 0 ? Math.round(totalCount / chartData.length) : 0}
              </div>
              <div className="summary-label">평균 배출량</div>
            </div>
          </div>
        )}

        {/* 차트 영역 */}
        <div className="chart-card">
          {loading ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>데이터를 불러오는 중...</p>
            </div>
          ) : chartData.length > 0 ? (
            <div className="chart-content">
              <div className="chart-wrapper">
                <ResponsiveContainer width="100%" height={500}>
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      outerRadius={180}
                      innerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                      labelLine={false}
                    >
                      {chartData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend 
                      verticalAlign="bottom" 
                      height={36}
                      formatter={(value) => <span className="legend-text">{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              {/* 상세 통계 테이블 */}
              <div className="stats-detail">
                <h3>상세 통계</h3>
                <div className="stats-table">
                  {chartData
                    .sort((a, b) => b.value - a.value)
                    .map((item, index) => {
                      const percentage = ((item.value / totalCount) * 100).toFixed(1);
                      return (
                        <div key={index} className="stats-row">
                          <div className="stats-color" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                          <div className="stats-name">{item.name}</div>
                          <div className="stats-count">{item.value}건</div>
                          <div className="stats-percentage">{percentage}%</div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">📈</div>
              <h3>데이터가 없습니다</h3>
              <p>선택한 기간에 배출된 쓰레기가 없습니다.<br/>다른 기간을 선택해보세요.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StatisticsChart;