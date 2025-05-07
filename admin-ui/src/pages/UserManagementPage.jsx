import React, { useEffect, useState } from "react";

const UserManagementPage = () => {
  const [users, setUsers] = useState([]);

  // 유저 목록 불러오기
  const fetchUsers = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/admin/users", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      console.error("유저 목록 불러오기 실패", err);
    }
  };

  // 승인/거부 처리
  const handleAction = async (userId, approved, role) => {
    try {
      const res = await fetch("http://localhost:5000/api/admin/users/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ id: userId, approved, role }),
      });
      if (res.ok) {
        fetchUsers(); // 갱신
      } else {
        alert("처리 실패");
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">사용자 관리</h2>
      <table className="w-full border text-sm">
        <thead>
          <tr className="bg-gray-200">
            <th className="p-2">이메일</th>
            <th className="p-2">이름</th>
            <th className="p-2">권한</th>
            <th className="p-2">승인 여부</th>
            <th className="p-2">조치</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} className="text-center border-b">
              <td className="p-2">{user.email}</td>
              <td className="p-2">{user.name}</td>
              <td className="p-2">{user.role}</td>
              <td className="p-2">{user.approved ? "승인됨" : "대기중"}</td>
              <td className="p-2 space-x-2">
                {!user.approved && (
                  <button
                    onClick={() => handleAction(user.id, true, "admin")}
                    className="bg-green-500 text-white px-2 py-1 rounded"
                  >
                    승인
                  </button>
                )}
                {user.approved && user.role !== "superadmin" && (
                  <button
                    onClick={() => handleAction(user.id, false, "pending")}
                    className="bg-red-500 text-white px-2 py-1 rounded"
                  >
                    거부
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default UserManagementPage;
