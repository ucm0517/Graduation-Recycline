// src/components/Layout.jsx
import React from "react";
import AdminNavbar from "./AdminNavbar";

const Layout = ({ children }) => {
  return (
    <>
      <AdminNavbar />
      <div className="p-8">{children}</div>
    </>
  );
};

export default Layout;


