import React, { useState, useEffect } from "react";

const getDaysInMonth = (year, month) => new Date(year, month, 0).getDate();

const TrashLogTable = ({ data = [] }) => {
  const years = Array.from({ length: 2025 - 1900 + 1 }, (_, i) => 1900 + i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  const [mode, setMode] = useState("all");
  const [year, setYear] = useState(2025);
  const [month, setMonth] = useState(4);
  const [day, setDay] = useState(1);
  const [startDate, setStartDate] = useState({ year: 2025, month: 4, day: 1 });
  const [endDate, setEndDate] = useState({ year: 2025, month: 4, day: 2 });

  const [filteredLogs, setFilteredLogs] = useState(data);
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedImage, setSelectedImage] = useState(null);

  const itemsPerPage = 5;

  useEffect(() => {
    setFilteredLogs(data);
  }, [data]);

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

    setFilteredLogs(filtered);
    setCurrentPage(0);
  };

  const days = Array.from({ length: getDaysInMonth(year, month) }, (_, i) => i + 1);
  const pageCount = Math.ceil(filteredLogs.length / itemsPerPage);
  const currentItems = filteredLogs.slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage);

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
        <button
          key={i}
          onClick={() => setCurrentPage(i)}
          className={`page-button ${i === currentPage ? "bg-blue-700" : ""}`}
        >
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
    <div className="container">
      <h2 className="text-3xl font-bold mb-4 text-center">배출 로그</h2>

      {/* 필터 UI */}
      <div className="flex gap-2 items-center justify-center flex-nowrap flex-wrap sm:flex-nowrap mb-4">
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
        <button onClick={handleFilter} className="btn px-5 py-2 text-base">검색</button>
      </div>
      
      {/* 테이블 */}
      <table className="table-style w-full text-center">
        <thead>
          <tr className="bg-gray-200">
            <th>파일명</th>
            <th>분류 결과 / 회전</th>
            <th>수집 시간</th>
            <th>보기</th>
          </tr>
        </thead>
        <tbody>
          {currentItems.map((log, idx) => (
            <tr key={idx}>
              <td>{log.filename}</td>
              <td>{log.result} / {log.angle}</td>
              <td>{log.time}</td>
              <td>
                <button className="btn rounded-full px-4 py-2" onClick={() => setSelectedImage(`/images/${log.filename}`)}>보기</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {renderPagination()}

      {/* 모달 */}
      {selectedImage && (
        <div className="modal-overlay" onClick={() => setSelectedImage(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <img src={selectedImage} alt="preview" className="modal-image" />
            <button className="btn mt-4" onClick={() => setSelectedImage(null)}>닫기</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrashLogTable;
