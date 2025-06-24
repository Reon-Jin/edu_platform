import React from "react";
import { useNavigate, useLocation } from "react-router-dom";

export default function NavButtons() {
  const navigate = useNavigate();
  const location = useLocation();
  const role = localStorage.getItem("role");

  let home = "/";
  if (role === "teacher") home = "/teacher";
  else if (role === "student") home = "/student";
  else if (role === "admin") home = "/admin";

  const rootPaths = ["/", "/login", "/register", "/teacher", "/student", "/admin"];

  if (rootPaths.includes(location.pathname)) {
    return null;
  }

  return (
    <div className="actions" style={{ marginBottom: "1rem" }}>
      <button className="button" style={{ width: "auto" }} onClick={() => navigate(home)}>
        首页
      </button>
      <button className="button" style={{ width: "auto" }} onClick={() => navigate(-1)}>
        返回
      </button>
    </div>
  );
}
