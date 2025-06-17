import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";

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
    <div>
      <h1>学生—作业列表</h1>
      <ul>
        {list.map((hw) => (
          <li key={hw.homework_id}>
            作业#{hw.homework_id} - {hw.status}
            {hw.status === "completed" && (
              <button onClick={() => navigate(`result/${hw.homework_id}`)}>
                查看结果
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
