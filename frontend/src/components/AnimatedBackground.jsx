import React from "react";
import AIEduConstellation from "../pages/AIEduConstellation";
import "../ui/background.css";

export default function AnimatedBackground() {
  return (
    <div className="app-bg" aria-hidden="true">
      <div className="bg-aurora" />
      <div className="bg-grid" />
      <AIEduConstellation />
      <div className="bg-dots">
        {Array.from({ length: 14 }).map((_, i) => (
          <span key={i} style={{ "--i": i }} />
        ))}
      </div>
    </div>
  );
}
