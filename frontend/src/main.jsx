// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";  // 确保导入 BrowserRouter
import AppRouter from "./routes/AppRouter";  // 引入 AppRouter
import "antd/dist/reset.css";
import "./index.css"; // 全局样式

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>  {/* 确保 BrowserRouter 包裹 AppRouter */}
      <AppRouter />  
    </BrowserRouter>
  </React.StrictMode>
);
