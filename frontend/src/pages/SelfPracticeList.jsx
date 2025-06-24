import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchSelfPracticeList } from "../api/student";
import "../index.css";
import NavButtons from "../components/NavButtons";

export default function SelfPracticeList() {
  const [list, setList] = useState([]);

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
        <NavButtons />
        <table>
          <thead>
            <tr>
              <th>主题</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {list.map((p) => (
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
