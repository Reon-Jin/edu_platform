import React from "react";

export default function Tooltip({ text }) {
  return (
    <span className="tooltip">
      <span className="tooltip-icon">?</span>
      <span className="tooltip-text">{text}</span>
    </span>
  );
}
