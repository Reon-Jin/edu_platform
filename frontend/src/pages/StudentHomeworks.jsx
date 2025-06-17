import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import "../index.css";

export default function StudentHomeworks() {
  const navigate = useNavigate();
  const [list, setList] = useState([]);

  useEffect(() => {
    const load = async () => {
      const resp = await api.get("/student/homeworks");
      setList(resp.data);
    };
    load();
  }, []);

  return (
    <div className="container">
      <div className="card">
        <h2>我的作业</h2>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {list.map((hw) => (
              <tr key={hw.homework_id}>
                <td>{hw.homework_id}</td>
                <td>{hw.status}</td>
                <td>
                  {hw.status === "completed" && (
                    <button
                      className="button"
                      onClick={() => navigate(`result/${hw.homework_id}`)}
                    >
                      查看结果
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
