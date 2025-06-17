import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";

export default function StudentPracticeList() {
  const [list, setList] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      const resp = await api.get("/student/practice/list");
      setList(resp.data);
    };
    load();
  }, []);

  return (
    <div>
      <h2>我的随练</h2>
      <ul>
        {list.map((p) => (
          <li key={p.id}>
            {p.topic} - {p.status}
            <button onClick={() => navigate(`/student/practice/${p.id}`)}>查看</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
