import React, { useState, useEffect } from "react";
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

const reverseTranslateClassName = (korean) => {
  switch (korean) {
    case "일반쓰레기": return "general trash";
    case "플라스틱": return "plastic";
    case "금속": return "metal";
    case "유리": return "glass";
    default: return korean;
  }
};

const getTypeIcon = (type) => {
  switch (type) {
    case "general trash": return "🗑️";
    case "plastic": return "♻️";
    case "metal": return "🔧";
    case "glass": return "🍾";
    default: return "📄";
  }
};

const TrashLogTable = () => {
  const years = Array.from({ length: 2025 - 1900 + 1 }, (_, i) => 1900 + i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const [mode, setMode] = useState("all");
  const [year, setYear] = useState(2025);
  const [month, setMonth] = useState(4);
  const [day, setDay] = useState(1);
  const [startDate, setStartDate] = useState({ year: 2025, month: 4, day: 1 });
  const [endDate, setEndDate] = useState({ year: 2025, month: 4, day: 2 });
  const [typeFilter, setTypeFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const [currentPage, setCurrentPage] = useState(0);
  const [selectedImage, setSelectedImage] = useState(null);
  const itemsPerPage = 12;

  useEffect(() => {
    setLoading(true);
    fetch(`${SERVER_URL}/api/logs`)
      .then((res) => res.json())
      .then((data) => {
        setLogs(data);
        setFilteredLogs(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("로그 데이터 로딩 실패:", err);
        setLoading(false);
      });
  }, []);

  const handleFilter = () => {
    let filtered = [];
    const ymd = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const ym = `${year}-${String(month).padStart(2, "0")}`;
    const y = `${year}`;

    if (mode === "all") {
      filtered = logs;
    } else if (mode === "year") {
      filtered = logs.filter((log) => log.time?.startsWith(y));
    } else if (mode === "month") {
      filtered = logs.filter((log) => log.time?.startsWith(ym));
    } else if (mode === "day") {
      filtered = logs.filter((log) => log.time?.startsWith(ymd));
    } else if (mode === "custom") {
      const start = new Date(`${startDate.year}-${String(startDate.month).padStart(2, "0")}-${String(startDate.day).padStart(2, "0")}`);
      const end = new Date(`${endDate.year}-${String(endDate.month).padStart(2, "0")}-${String(endDate.day).padStart(2, "0")}`);
      filtered = logs.filter((log) => {
        const logDate = new Date(log.time);
        return logDate >= start && logDate <= end;
      });
    }

    if (typeFilter !== "") {
      const engType = reverseTranslateClassName(typeFilter);
      filtered = filtered.filter((log) => log.result?.startsWith(engType));
    }

    if (searchQuery.trim() !== "") {
      filtered = filtered.filter((log) => 
        log.filename?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        translateClassName(log.result)?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredLogs(filtered);
    setCurrentPage(0);
  };

  const handleDelete = async (filename) => {
    if (!window.confirm(`${filename} 로그를 삭제하시겠습니까?`)) return;
    try {
      const res = await fetch(`${SERVER_URL}/api/logs/delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename }),
      });
      if (res.ok) {
        alert("삭제되었습니다.");
        setLogs(prev => prev.filter(log => log.filename !== filename));
        setFilteredLogs(prev => prev.filter(log => log.filename !== filename));
      } else {
        const err = await res.json();
        alert(`삭제 실패: ${err.message}`);
      }
    } catch (err) {
      alert("요청 실패");
      console.error(err);
    }
  };

  const days = Array.from({ length: getDaysInMonth(year, month) }, (_, i) => i + 1);
  const pageCount = Math.ceil(filteredLogs.length / itemsPerPage);
  const currentItems = filteredLogs.slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage);

  const renderPagination = () => {
    const visiblePages = 5;
    let start = Math.max(0, currentPage - Math.floor(visiblePages / 2));
    let end = Math.min(pageCount, start + visiblePages);
    if (end - start < visiblePages) start = Math.max(0, end - visiblePages);

    const pages = [];

    if (currentPage > 0) {
      pages.push(<button key="first" onClick={() => setCurrentPage(0)} className="page-button">⏪</button>);
      pages.push(<button key="prev" onClick={() => setCurrentPage(currentPage - 1)} className="page-button">◀</button>);
    }

    if (start > 0) pages.push(<span key="dots-start" className="page-dots">...</span>);

    for (let i = start; i < end; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => setCurrentPage(i)}
          className={`page-button ${i === currentPage ? "active" : ""}`}
        >
          {i + 1}
        </button>
      );
    }

    if (end < pageCount) pages.push(<span key="dots-end" className="page-dots">...</span>);

    if (currentPage < pageCount - 1) {
      pages.push(<button key="next" onClick={() => setCurrentPage(currentPage + 1)} className="page-button">▶</button>);
      pages.push(<button key="last" onClick={() => setCurrentPage(pageCount - 1)} className="page-button">⏩</button>);
    }

    return <div className="pagination">{pages}</div>;
  };

  return (
    <div className="log-table-page">
      <div className="log-table-container">
        {/* 헤더 */}
        <div className="log-table-header">
          <h1>배출 로그</h1>
          <p>쓰레기 분류 이력을 조회하고 관리하세요</p>
        </div>

        {/* 필터 및 검색 카드 */}
        <div className="filter-card">
          {/* 검색바 */}
          <div className="search-section">
            <div className="search-group">
              <input
                type="text"
                placeholder="파일명 또는 분류 결과로 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
              <button onClick={handleFilter} className="search-btn">🔍</button>
            </div>
          </div>

          {/* 필터 섹션 */}
          <div className="filter-section">
            <div className="filter-row">
              <div className="filter-group">
                <label>기간</label>
                <select value={mode} onChange={(e) => setMode(e.target.value)} className="modern-select">
                  <option value="all">전체</option>
                  <option value="year">연도별</option>
                  <option value="month">월별</option>
                  <option value="day">일별</option>
                  <option value="custom">사용자 지정</option>
                </select>
              </div>

              {(mode === "year" || mode === "month" || mode === "day") && (
                <>
                  <div className="filter-group">
                    <label>연도</label>
                    <select value={year} onChange={(e) => setYear(+e.target.value)} className="modern-select">
                      {years.map((y) => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                  {(mode === "month" || mode === "day") && (
                    <div className="filter-group">
                      <label>월</label>
                      <select value={month} onChange={(e) => setMonth(+e.target.value)} className="modern-select">
                        {months.map((m) => <option key={m} value={m}>{m}</option>)}
                      </select>
                    </div>
                  )}
                  {mode === "day" && (
                    <div className="filter-group">
                      <label>일</label>
                      <select value={day} onChange={(e) => setDay(+e.target.value)} className="modern-select">
                        {days.map((d) => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                  )}
                </>
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

              <div className="filter-group">
                <label>분류</label>
                <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="modern-select">
                  <option value="">전체</option>
                  <option value="일반쓰레기">🗑️ 일반쓰레기</option>
                  <option value="플라스틱">♻️ 플라스틱</option>
                  <option value="금속">🔧 금속</option>
                  <option value="유리">🍾 유리</option>
                </select>
              </div>

              <button onClick={handleFilter} className="filter-btn">
                🔍 조회
              </button>
            </div>
          </div>
        </div>

        {/* 결과 요약 */}
        {!loading && (
          <div className="results-summary">
            <div className="summary-info">
              <span className="total-count">총 {filteredLogs.length}건</span>
              {filteredLogs.length !== logs.length && (
                <span className="filtered-info">(전체 {logs.length}건 중)</span>
              )}
            </div>
          </div>
        )}

        {/* 테이블 카드 */}
        <div className="table-card">
          {loading ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>데이터를 불러오는 중...</p>
            </div>
          ) : currentItems.length > 0 ? (
            <div className="table-container">
              <table className="modern-table">
                <thead>
                  <tr>
                    <th>분류</th>
                    <th>파일명</th>
                    <th>회전각도</th>
                    <th>수집 시간</th>
                    <th>액션</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.map((log, idx) => (
                    <tr key={idx} className="table-row">
                      <td>
                        <div className="type-cell">
                          <span className="type-icon">{getTypeIcon(log.result)}</span>
                          <span className="type-name">{translateClassName(log.result)}</span>
                        </div>
                      </td>
                      <td className="filename-cell">{log.filename}</td>
                      <td className="angle-cell">{log.angle}°</td>
                      <td className="time-cell">
                        {new Date(log.time).toLocaleString("ko-KR", {
                          year: "numeric",
                          month: "2-digit",
                          day: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: false,
                          timeZone: "Asia/Seoul"
                        })}
                      </td>
                      <td className="action-cell">
                        <button 
                          className="view-btn" 
                          onClick={() => setSelectedImage(`/images/${log.filename}`)}
                          title="이미지 보기"
                        >
                          👁️
                        </button>
                        <button
                          className="delete-btn"
                          onClick={() => handleDelete(log.filename)}
                          title="삭제"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">📋</div>
              <h3>데이터가 없습니다</h3>
              <p>조건에 맞는 배출 로그가 없습니다.<br/>필터 조건을 변경해보세요.</p>
            </div>
          )}
        </div>

        {/* 페이지네이션 */}
        {pageCount > 1 && renderPagination()}
      </div>

      {/* 이미지 모달 */}
      {selectedImage && (
        <div className="image-modal" onClick={() => setSelectedImage(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>이미지 상세보기</h3>
              <button className="close-btn" onClick={() => setSelectedImage(null)}>✕</button>
            </div>
            <div className="modal-body">
              <img src={`${SERVER_URL}${selectedImage}`} alt="배출 이미지" className="modal-image" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrashLogTable;