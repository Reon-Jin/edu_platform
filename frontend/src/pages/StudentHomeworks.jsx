import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import "../index.css";
import NavButtons from "../components/NavButtons";

export default function StudentHomeworks() {
  const navigate = useNavigate();
  const [list, setList] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const resp = await api.get("/student/homeworks");
        setList(resp.data);
      } catch (err) {
        console.error(err);
      }
    };
    load();
  }, []);

  return (
    <div className="container">
      <div className="card">
        <h2>我的作业</h2>
        <NavButtons />
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
                  {hw.status === "not_submitted" && (
                    <button
                      className="button"
                      onClick={() => navigate(`answer/${hw.homework_id}`)}
                    >
                      答题
                    </button>
                  )}
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
