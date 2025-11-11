import React, { useEffect, useState } from "react";
import { SERVER_URL } from "../config";

// 날짜 포맷 함수
const formatDate = (dateString) => {
  const d = new Date(dateString);
  return d.toLocaleString("ko-KR", {
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
    hour12: false, timeZone: "Asia/Seoul"
  });
};

// 한글 변환
const translateClassName = (name) => {
  switch (name) {
    case "plastic": return "플라스틱";
    case "metal": return "금속";
    case "glass": return "유리";
    case "general trash": return "일반쓰레기";
    default: return name;
  }
};
const reverseTranslateClassName = (kor) => {
  switch (kor) {
    case "일반쓰레기": return "general trash";
    case "플라스틱": return "plastic";
    case "금속": return "metal";
    case "유리": return "glass";
    default: return kor;
  }
};

const getDaysInMonth = (year, month) => new Date(year, month, 0).getDate();

const LevelLogTable = () => {
  const years = Array.from({ length: 2025 - 1900 + 1 }, (_, i) => 1900 + i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);

  const [mode, setMode] = useState("all");
  const [year, setYear] = useState(2025);
  const [month, setMonth] = useState(4);
  const [day, setDay] = useState(1);
  const [startDate, setStartDate] = useState({ year: 2025, month: 4, day: 1 });
  const [endDate, setEndDate] = useState({ year: 2025, month: 4, day: 2 });
  const [typeFilter, setTypeFilter] = useState("");

  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 10;

  useEffect(() => {
    fetch(`${SERVER_URL}/api/levels/logs`)
      .then(res => res.json())
      .then(data => {
        setLogs(data);
        setFilteredLogs(data);
      })
      .catch(err => alert("채움률 로그 데이터 로딩 실패"));
  }, []);

  const handleFilter = () => {
    let filtered = [];
    const ymd = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const ym = `${year}-${String(month).padStart(2, "0")}`;
    const y = `${year}`;

    if (mode === "all") {
      filtered = logs;
    } else if (mode === "year") {
      filtered = logs.filter((log) => log.measured_at?.startsWith(y));
    } else if (mode === "month") {
      filtered = logs.filter((log) => log.measured_at?.startsWith(ym));
    } else if (mode === "day") {
      filtered = logs.filter((log) => log.measured_at?.startsWith(ymd));
    } else if (mode === "custom") {
      const start = new Date(`${startDate.year}-${String(startDate.month).padStart(2, "0")}-${String(startDate.day).padStart(2, "0")}`);
      const end = new Date(`${endDate.year}-${String(endDate.month).padStart(2, "0")}-${String(endDate.day).padStart(2, "0")}`);
      filtered = logs.filter((log) => {
        const logDate = new Date(log.measured_at);
        return logDate >= start && logDate <= end;
      });
    }

    if (typeFilter !== "") {
      const engType = reverseTranslateClassName(typeFilter);
      filtered = filtered.filter((log) => log.class === engType);
    }

    setFilteredLogs(filtered);
    setCurrentPage(0);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("해당 로그를 삭제하시겠습니까?")) return;
    try {
      const res = await fetch(`${SERVER_URL}/api/levels/delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        alert("삭제되었습니다.");
        setLogs(prev => prev.filter(log => log.id !== id));
        setFilteredLogs(prev => prev.filter(log => log.id !== id));
      } else {
        alert("삭제 실패");
      }
    } catch (err) {
      alert("요청 실패");
    }
  };

  const days = Array.from({ length: getDaysInMonth(year, month) }, (_, i) => i + 1);
  const pageCount = Math.ceil(filteredLogs.length / itemsPerPage);
  const currentItems = filteredLogs.slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage);

  // 페이지네이션
  const renderPagination = () => {
    const visiblePages = 3;
    let start = Math.max(0, currentPage - Math.floor(visiblePages / 2));
    let end = Math.min(pageCount, start + visiblePages);
    if (end - start < visiblePages) start = Math.max(0, end - visiblePages);
    const pages = [];
    if (currentPage > 0) {
      pages.push(<button key="first" onClick={() => setCurrentPage(0)} className="page-button">⏪ 처음</button>);
      pages.push(<button key="prev" onClick={() => setCurrentPage(currentPage - 1)} className="page-button">◀ 이전</button>);
    }
    if (start > 0) pages.push(<span key="dots-start">...</span>);
    for (let i = start; i < end; i++) {
      pages.push(
        <button key={i} onClick={() => setCurrentPage(i)} className={`page-button ${i === currentPage ? "active" : ""}`}>
          {i + 1}
        </button>
      );
    }
    if (end < pageCount) pages.push(<span key="dots-end">...</span>);
    if (currentPage < pageCount - 1) {
      pages.push(<button key="next" onClick={() => setCurrentPage(currentPage + 1)} className="page-button">다음 ▶</button>);
      pages.push(<button key="last" onClick={() => setCurrentPage(pageCount - 1)} className="page-button">마지막 ⏩</button>);
    }
    return <div className="pagination">{pages}</div>;
  };

  return (
    <div className="table-page-container">
      <h2 className="TrashLogTable-title">채움률 측정 로그</h2>
      <div className="filter-bar">
        <div className="filter-row">
          <select value={mode} onChange={(e) => setMode(e.target.value)} className="custom-select">
            <option value="all">전체</option>
            <option value="year">연도별</option>
            <option value="month">월별</option>
            <option value="day">일별</option>
            <option value="custom">사용자 지정</option>
          </select>
          {(mode === "year" || mode === "month" || mode === "day") && (
            <select value={year} onChange={(e) => setYear(+e.target.value)} className="custom-select">
              {years.map((y) => <option key={y} value={y}>{y}년</option>)}
            </select>
          )}
          {(mode === "month" || mode === "day") && (
            <select value={month} onChange={(e) => setMonth(+e.target.value)} className="custom-select">
              {months.map((m) => <option key={m} value={m}>{m}월</option>)}
            </select>
          )}
          {mode === "day" && (
            <select value={day} onChange={(e) => setDay(+e.target.value)} className="custom-select">
              {days.map((d) => <option key={d} value={d}>{d}일</option>)}
            </select>
          )}
          {mode === "custom" && (
            <>
              <span className="date-label">시작일</span>
              <select value={startDate.year} onChange={e => setStartDate({ ...startDate, year: +e.target.value })} className="custom-select">
                {years.map((y) => <option key={y} value={y}>{y}년</option>)}
              </select>
              <select value={startDate.month} onChange={e => setStartDate({ ...startDate, month: +e.target.value })} className="custom-select">
                {months.map((m) => <option key={m} value={m}>{m}월</option>)}
              </select>
              <select value={startDate.day} onChange={e => setStartDate({ ...startDate, day: +e.target.value })} className="custom-select">
                {Array.from({ length: getDaysInMonth(startDate.year, startDate.month) }, (_, i) => (
                  <option key={i} value={i + 1}>{i + 1}일</option>
                ))}
              </select>
              <span className="date-label">~ 종료일</span>
              <select value={endDate.year} onChange={e => setEndDate({ ...endDate, year: +e.target.value })} className="custom-select">
                {years.map((y) => <option key={y} value={y}>{y}년</option>)}
              </select>
              <select value={endDate.month} onChange={e => setEndDate({ ...endDate, month: +e.target.value })} className="custom-select">
                {months.map((m) => <option key={m} value={m}>{m}월</option>)}
              </select>
              <select value={endDate.day} onChange={e => setEndDate({ ...endDate, day: +e.target.value })} className="custom-select">
                {Array.from({ length: getDaysInMonth(endDate.year, endDate.month) }, (_, i) => (
                  <option key={i} value={i + 1}>{i + 1}일</option>
                ))}
              </select>
            </>
          )}
        </div>
        <div className="filter-actions">
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="custom-select">
            <option value="">전체 종류</option>
            <option value="일반쓰레기">일반쓰레기</option>
            <option value="플라스틱">플라스틱</option>
            <option value="금속">금속</option>
            <option value="유리">유리</option>
          </select>
          <button onClick={handleFilter} className="btn">검색</button>
        </div>
      </div>
      <div className="mt-8 w-full overflow-x-auto">
        <table className="table-style w-full text-center">
          <thead>
            <tr className="bg-gray-200">
              <th>측정 ID</th>
              <th>종류</th>
              <th>채움률(%)</th>
              <th>측정시각</th>
              <th>삭제</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.map((log, idx) => (
              <tr key={log.id}>
                <td>{log.id}</td>
                <td>{translateClassName(log.class)}</td>
                <td>{log.level}%</td>
                <td>{formatDate(log.measured_at)}</td>
                <td>
                  <button className="btn bg-red-500 text-white px-4 py-2 rounded"
                    onClick={() => handleDelete(log.id)}>삭제</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {renderPagination()}
    </div>
  );
};

export default LevelLogTable;
