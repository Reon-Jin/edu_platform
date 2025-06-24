import React from "react";
import { useNavigate } from "react-router-dom";
import "../index.css";

export default function TeacherDashboard() {
  const navigate = useNavigate();

  const items = [
    { label: "课程", onClick: () => navigate("/teacher/lesson/list") },
    { label: "作业", onClick: () => navigate("/teacher/exercise/list") },
    { label: "学情", onClick: () => navigate("/teacher/students") },
  ];

  return (
    <div className="container">
      <div className="card" style={{ width: "100%" }}>
        <h2>教师工作台</h2>
        <div className="dashboard-grid">
          {items.map((item) => (
            <div
              key={item.label}
              className="dashboard-tile"
              onClick={item.onClick}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter") item.onClick();
              }}
            >
              {item.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
