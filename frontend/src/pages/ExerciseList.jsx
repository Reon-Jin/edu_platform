import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { IconButton } from '@chakra-ui/react';
import { ViewIcon } from '@chakra-ui/icons';
import { fetchExerciseList, deleteExercise } from "../api/teacher";
import { formatDateTime } from "../utils";
import "../index.css";

export default function ExerciseList() {
  const navigate = useNavigate();
  const [list, setList] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const filtered = list.filter((ex) =>
    ex.subject.toLowerCase().includes(search.toLowerCase())
  );

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

  const handleDelete = async (id) => {
    if (!window.confirm('确定删除?')) return;
    try {
      await deleteExercise(id);
      setList(list.filter((e) => e.id !== id));
    } catch (err) {
      console.error(err);
      setError('删除失败');
    }
  };

  return (
    <div className="container">
      <div className="card">
        <h2>我的练习列表</h2>
        <input
          className="input"
          placeholder="搜索练习"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: 'auto' }}
        />
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
              {filtered.map((ex) => (
                <tr key={ex.id}>
                  <td>{ex.subject}</td>
                  <td>{formatDateTime(ex.created_at)}</td>
                  <td className="actions-cell">
                    <IconButton
                      size="sm"
                      mr={1}
                      icon={<ViewIcon />}
                      aria-label="预览"
                      onClick={() => navigate(`/teacher/exercise/preview/${ex.id}`)}
                    />
                    <button
                      className="icon-button tooltip"
                      onClick={() => handleDelete(ex.id)}
                      aria-label="删除"
                    >
                      🗑️<span className="tooltip-text">删除</span>
                    </button>
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
