import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchSelfPracticeList } from "../api/student";
import "../index.css";

export default function SelfPracticeList() {
  const [list, setList] = useState([]);
  const [search, setSearch] = useState('');

  const filtered = list.filter((p) =>
    p.topic.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    const load = async () => {
      const data = await fetchSelfPracticeList();
      setList(data);
    };
    load();
  }, []);

  return (
    <div className="container">
      <div className="card">
        <h2>我的随练</h2>
        <input
          className="input"
          placeholder="搜索主题"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: 'auto' }}
        />
        <table>
          <thead>
            <tr>
              <th>主题</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id}>
                <td>{p.topic}</td>
                <td>
                  <Link className="button" to={`/student/self_practice/${p.id}`}>
                    查看
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
