import React, { useEffect, useState } from "react";

const UserManagementPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredUsers, setFilteredUsers] = useState([]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://43.202.10.147:3001/api/admin/users", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const data = await res.json();
      setUsers(data);
      setFilteredUsers(data);
      setLoading(false);
    } catch (err) {
      console.error("유저 목록 불러오기 실패", err);
      setLoading(false);
    }
  };

  const handleAction = async (userId, approved, role) => {
    try {
      const res = await fetch("http://43.202.10.147:3001/api/admin/users/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ id: userId, approved, role }),
      });
      if (res.ok) {
        await fetchUsers();
        alert(approved ? "사용자가 승인되었습니다." : "사용자 승인이 취소되었습니다.");
      } else {
        alert("처리 실패");
      }
    } catch (err) {
      console.error(err);
      alert("요청 실패");
    }
  };

  const applyFilters = () => {
    let filtered = users;

    // 상태 필터
    if (filter === "approved") {
      filtered = filtered.filter(user => user.approved);
    } else if (filter === "pending") {
      filtered = filtered.filter(user => !user.approved);
    } else if (filter === "admin") {
      filtered = filtered.filter(user => user.role === "admin" || user.role === "superadmin");
    }

    // 검색 필터
    if (searchQuery.trim()) {
      filtered = filtered.filter(user => 
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredUsers(filtered);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [users, filter, searchQuery]);

  const getRoleDisplay = (role) => {
    switch (role) {
      case "superadmin": return "최고관리자";
      case "admin": return "관리자";
      case "pending": return "대기중";
      default: return role;
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case "superadmin": return "👑";
      case "admin": return "🛡️";
      case "pending": return "⏳";
      default: return "👤";
    }
  };

  const stats = {
    total: users.length,
    approved: users.filter(user => user.approved).length,
    pending: users.filter(user => !user.approved).length,
    admins: users.filter(user => user.role === "admin" || user.role === "superadmin").length
  };

  return (
    <div className="user-management-page">
      <div className="user-management-container">
        {/* 헤더 */}
        <div className="user-management-header">
          <h1>사용자 관리</h1>
          <p>시스템 사용자를 승인하고 권한을 관리하세요</p>
        </div>

        {/* 통계 요약 카드들 */}
        {!loading && (
          <div className="stats-summary">
            <div className="stat-card stat-total">
              <div className="stat-number">{stats.total}</div>
              <div className="stat-label">전체 사용자</div>
            </div>
            <div className="stat-card stat-approved">
              <div className="stat-number">{stats.approved}</div>
              <div className="stat-label">승인된 사용자</div>
            </div>
            <div className="stat-card stat-pending">
              <div className="stat-number">{stats.pending}</div>
              <div className="stat-label">승인 대기</div>
            </div>
            <div className="stat-card stat-admin">
              <div className="stat-number">{stats.admins}</div>
              <div className="stat-label">관리자</div>
            </div>
          </div>
        )}

        {/* 필터 및 검색 카드 */}
        <div className="filter-card">
          <div className="search-section">
            <div className="search-group">
              <input
                type="text"
                placeholder="이메일 또는 이름으로 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
              <button className="search-btn">🔍</button>
            </div>
          </div>

          <div className="filter-section">
            <div className="filter-row">
              <div className="filter-group">
                <label>사용자 상태</label>
                <select value={filter} onChange={(e) => setFilter(e.target.value)} className="modern-select">
                  <option value="all">전체</option>
                  <option value="approved">✅ 승인됨</option>
                  <option value="pending">⏳ 대기중</option>
                  <option value="admin">🛡️ 관리자</option>
                </select>
              </div>
              <button onClick={fetchUsers} className="refresh-btn">
                🔄 새로고침
              </button>
            </div>
          </div>
        </div>

        {/* 결과 요약 */}
        {!loading && (
          <div className="results-summary">
            <div className="summary-info">
              <span className="total-count">총 {filteredUsers.length}명</span>
              {filteredUsers.length !== users.length && (
                <span className="filtered-info">(전체 {users.length}명 중)</span>
              )}
            </div>
          </div>
        )}

        {/* 사용자 테이블 카드 */}
        <div className="table-card">
          {loading ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>사용자 데이터를 불러오는 중...</p>
            </div>
          ) : filteredUsers.length > 0 ? (
            <div className="table-container">
              <table className="modern-table">
                <thead>
                  <tr>
                    <th>사용자 정보</th>
                    <th>권한</th>
                    <th>승인 상태</th>
                    <th>가입일</th>
                    <th>액션</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="table-row">
                      <td>
                        <div className="user-info">
                          <div className="user-avatar">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="user-details">
                            <div className="user-name">{user.name}</div>
                            <div className="user-email">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="role-cell">
                          <span className="role-icon">{getRoleIcon(user.role)}</span>
                          <span className="role-name">{getRoleDisplay(user.role)}</span>
                        </div>
                      </td>
                      <td>
                        <span 
                          className={`status-badge ${user.approved ? "status-approved" : "status-pending"}`}
                        >
                          {user.approved ? "✅ 승인됨" : "⏳ 대기중"}
                        </span>
                      </td>
                      <td className="date-cell">
                        {user.created_at ? new Date(user.created_at).toLocaleDateString("ko-KR") : "-"}
                      </td>
                      <td className="action-cell">
                        {user.role !== "superadmin" && (
                          <div className="action-buttons">
                            {user.approved ? (
                              <button
                                onClick={() => handleAction(user.id, false, "pending")}
                                className="action-btn reject-btn"
                                title="승인 취소"
                              >
                                ❌ 거부
                              </button>
                            ) : (
                              <button
                                onClick={() => handleAction(user.id, true, "admin")}
                                className="action-btn approve-btn"
                                title="사용자 승인"
                              >
                                ✅ 승인
                              </button>
                            )}
                          </div>
                        )}
                        {user.role === "superadmin" && (
                          <span className="no-action">변경 불가</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">👥</div>
              <h3>사용자가 없습니다</h3>
              <p>조건에 맞는 사용자가 없습니다.<br/>필터 조건을 변경해보세요.</p>
            </div>
          )}
        </div>

        {/* 사용자 관리 가이드 */}
        <div className="management-guide">
          <h3>📋 사용자 관리 가이드</h3>
          <div className="guide-content">
            <div className="guide-item">
              <div className="guide-icon">👑</div>
              <div className="guide-text">
                <strong>최고관리자</strong>: 모든 권한을 가지며 다른 사용자의 권한을 변경할 수 있습니다.
              </div>
            </div>
            <div className="guide-item">
              <div className="guide-icon">🛡️</div>
              <div className="guide-text">
                <strong>관리자</strong>: 시스템 관리 기능에 접근할 수 있습니다.
              </div>
            </div>
            <div className="guide-item">
              <div className="guide-icon">⏳</div>
              <div className="guide-text">
                <strong>대기중</strong>: 회원가입은 완료했지만 아직 승인되지 않은 상태입니다.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserManagementPage;