// src/pages/AIEduConstellation.jsx
import React, { useEffect, useRef } from "react";

export default function AIEduConstellation({
  density = 0.9,          // 密度（越大粒子越多）
  linkDist = 120,         // 连线距离阈值
  speed = 0.25,           // 漂移速度
  baseSize = 2.2,         // 点半径
  color = "rgba(56,189,248,0.9)",   // 点颜色（青蓝）
  linkColor = "rgba(20,184,166,0.25)" // 线颜色（青绿）
}) {
  const canvasRef = useRef(null);
  const mouse = useRef({ x: -9999, y: -9999 });

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let dpr = Math.max(1, window.devicePixelRatio || 1);
    let W = 0, H = 0, raf = 0;

    const resize = () => {
      W = canvas.clientWidth; H = canvas.clientHeight;
      canvas.width = W * dpr; canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const count = Math.floor((W * H) / (13000 / density));
    const pts = Array.from({ length: count }).map(() => ({
      x: Math.random() * W,
      y: Math.random() * H,
      vx: (Math.random() - 0.5) * speed,
      vy: (Math.random() - 0.5) * speed,
      r: baseSize * (0.6 + Math.random() * 0.8)
    }));

    const step = () => {
      ctx.clearRect(0, 0, W, H);

      // 画线
      for (let i = 0; i < pts.length; i++) {
        const a = pts[i];
        for (let j = i + 1; j < pts.length; j++) {
          const b = pts[j];
          const dx = a.x - b.x, dy = a.y - b.y;
          const dist = Math.hypot(dx, dy);
          if (dist < linkDist) {
            const alpha =
              (1 - dist / linkDist) *
              (mouse.current.x > 0
                ? Math.max(0.25, 1 - Math.hypot(a.x - mouse.current.x, a.y - mouse.current.y) / 300)
                : 1);
            ctx.strokeStyle = linkColor.replace(/[\d.]+\)$/, `${alpha})`);
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      // 画点 & 更新
      ctx.fillStyle = color;
      for (const p of pts) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();

        p.x += p.vx; p.y += p.vy;
        // 边界回弹
        if (p.x < -20) p.x = W + 20;
        if (p.x > W + 20) p.x = -20;
        if (p.y < -20) p.y = H + 20;
        if (p.y > H + 20) p.y = -20;
      }

      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);

    const move = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouse.current.x = e.clientX - rect.left;
      mouse.current.y = e.clientY - rect.top;
    };
    const leave = () => (mouse.current.x = mouse.current.y = -9999);

    canvas.addEventListener("mousemove", move);
    canvas.addEventListener("mouseleave", leave);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("mousemove", move);
      canvas.removeEventListener("mouseleave", leave);
    };
  }, [density, linkDist, speed, baseSize, color, linkColor]);

  return (
    <canvas
      className="ai-constellation"
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 0,
        opacity: 0.9,
        mixBlendMode: "screen"
      }}
      ref={canvasRef}
    />
  );
}
