import React, { useMemo } from "react";

/**
 * ShootingStars - 流星动画（彩色、大尺寸、方向正确）
 *
 * 用法：
 *   import ShootingStars from "./ShootingStars";
 *   ...
 *   <div className="login-bg" aria-hidden="true">
 *     <div className="bg-aurora" />
 *     <div className="bg-grid" />
 *     <ShootingStars count={16} speed={1.1} />
 *   </div>
 *
 * 可调参数：
 * - count: 数量
 * - speed: 速度倍率（>1 更快）
 * - zIndex: 层级（默认 0）
 */
export default function ShootingStars({
  count = 14,
  speed = 1,
  zIndex = 0,
}) {
  const stars = useMemo(() => {
    const rnd = (min, max) => min + Math.random() * (max - min);

    const arr = [];
    for (let i = 0; i < count; i++) {
      // 起点：允许从视口外进入
      const startTop = rnd(-15, 35);   // %
      const startLeft = rnd(-20, 70);  // %

      // 运动向量（默认右下方为主，可轻改比率获得不同斜率）
      const dx = rnd(65, 95);          // vw
      const ratio = rnd(0.5, 0.8);     // 垂直/水平比例
      const dy = dx * ratio;           // vh

      // 方向角度（度）
      const angle = Math.atan2(dy, dx) * (180 / Math.PI);

      // 尺寸更大：头、尾粗细、尾长
      const size = rnd(3.2, 5.2);      // px （核心点直径）
      const thickness = rnd(2.2, 3.2); // px （尾迹粗细）
      const len = rnd(180, 320);       // px （尾迹长度）

      // 时序
      const dur = rnd(2.2, 4.0) / Math.max(0.1, speed); // s
      const delay = rnd(0, 6); // s

      // 彩色：每颗随机色相（HSL）
      const hue = Math.floor(rnd(0, 360));
      const c1 = `hsla(${hue} 90% 60% / 0.95)`; // 头部附近颜色（亮且饱和）
      const c2 = `hsla(${hue} 90% 60% / 0)`;    // 尾部近透明

      arr.push({ startTop, startLeft, dx, dy, angle, size, thickness, len, dur, delay, c1, c2 });
    }
    return arr;
  }, [count, speed]);

  return (
    <div
      className="shooting-stars"
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        zIndex,
        overflow: "hidden",
        mixBlendMode: "screen",
      }}
      aria-hidden="true"
    >
      <style>
        {`
          .shooting-stars .meteor{
            position:absolute;
            top: var(--top);
            left: var(--left);
            width: var(--size);
            height: var(--size);
            border-radius: 50%;
            background: #fff; /* 核心亮点为白色 */
            /* 叠加品牌风格辉光，让色彩更“数码” */
            filter:
              drop-shadow(0 0 12px rgba(56,189,248,.55))  /* #38bdf8 */
              drop-shadow(0 0 24px rgba(20,184,166,.35)); /* #14b8a6 */
            transform: rotate(var(--angle)) translate3d(0,0,0);
            opacity: 0;
            will-change: transform, opacity;
            animation: meteor-fly var(--dur) linear var(--delay) infinite;
          }

          /* 尾迹在“左侧”，表示飞行方向指向右侧（与位移一致），尾巴始终在后 */
          .shooting-stars .meteor::after{
            content:"";
            position:absolute;
            top:50%;
            right:0;                 /* 关键：尾迹从右侧贴着小圆向“左”延伸 */
            transform: translateY(-50%);
            width: var(--len);
            height: var(--thickness);
            background: linear-gradient(270deg, var(--c1), var(--c2)); /* 从头部向尾部淡出 */
            border-radius: 2px;
            opacity: .98;
          }

          /* 轻微闪烁，让头部更灵动 */
          .shooting-stars .meteor::before{
            content:"";
            position:absolute;
            inset:-4px;
            border-radius:50%;
            background: radial-gradient(circle at 50% 50%, rgba(255,255,255,.55), rgba(255,255,255,0));
            filter: blur(2px);
            opacity:.0;
            animation: twinkle var(--dur) ease-in-out var(--delay) infinite;
          }

          @keyframes twinkle{
            0%,100% { opacity:.0; }
            50%     { opacity:.45; }
          }

          @keyframes meteor-fly{
            0%   { transform: rotate(var(--angle)) translate3d(0,0,0); opacity: 0; }
            8%   { opacity: 1; }
            90%  { opacity: .98; }
            100% { transform: rotate(var(--angle)) translate3d(var(--dx), var(--dy), 0); opacity: 0; }
          }

          /* 动效减少偏好 */
          @media (prefers-reduced-motion: reduce) {
            .shooting-stars .meteor{
              animation: none !important;
              opacity: .5;
            }
          }
        `}
      </style>

      {stars.map((s, i) => (
        <i
          key={i}
          className="meteor"
          style={{
            "--top": `${s.startTop}%`,
            "--left": `${s.startLeft}%`,
            "--dx": `${s.dx}vw`,
            "--dy": `${s.dy}vh`,
            "--angle": `${s.angle}deg`,
            "--size": `${s.size}px`,
            "--thickness": `${s.thickness}px`,
            "--len": `${s.len}px`,
            "--dur": `${s.dur}s`,
            "--delay": `${s.delay}s`,
            "--c1": s.c1,
            "--c2": s.c2,
          }}
        />
      ))}
    </div>
  );
}
