import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { fetchExerciseList } from "../api/teacher";
import "../index.css";

export default function ExerciseList() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await fetchExerciseList();
        setList(data);
      } catch (err) {
        console.error(err);
        setError("加载列表失败");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="container">
      <div className="card">
        <button
          className="button"
          style={{ width: "auto", marginBottom: "1rem" }}
          onClick={() => navigate(-1)}
        >
          返回
        </button>
        <h2>我的练习列表</h2>
        {error && <div className="error">{error}</div>}
        {loading ? (
          <div>加载中...</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>主题</th>
                <th>创建时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {list.map((ex) => (
                <tr key={ex.id}>
                  <td>{ex.subject}</td>
                  <td>{ex.created_at}</td>
                  <td>
                    <Link to={`/teacher/exercise/preview/${ex.id}`}>预览</Link>
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
