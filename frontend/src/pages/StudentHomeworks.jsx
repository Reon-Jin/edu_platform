import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchHomeworkList } from "../api/student";
import "../index.css";

export default function StudentHomeworks() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await fetchHomeworkList();
        setList(data);
      } catch (err) {
        console.error(err);
        setError("加载作业失败");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="container">
      <div className="card">
        <h2>我的作业</h2>
        {error && <div className="error">{error}</div>}
        {loading ? (
          <div>加载中...</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>作业ID</th>
                <th>练习ID</th>
                <th>布置时间</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {list.map((hw) => (
                <tr key={hw.homework_id}>
                  <td>{hw.homework_id}</td>
                  <td>{hw.exercise_id}</td>
                  <td>{hw.assigned_at}</td>
                  <td>{hw.status}</td>
                  <td>
                    {hw.status === "not_submitted" && (
                      <Link to={`homeworks/${hw.homework_id}/submit`}>提交</Link>
                    )}
                    {hw.status === "grading" && <span>批改中</span>}
                    {hw.status === "completed" && (
                      <Link to={`homeworks/${hw.homework_id}/result`}>查看结果</Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
