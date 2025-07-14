import React from "react";

export default function Stepper({ value, onChange, min = 0, max = 50 }) {
  const dec = () => onChange(Math.max(min, value - 1));
  const inc = () => onChange(Math.min(max, value + 1));
  const handleInput = (e) => {
    let val = Number(e.target.value);
    if (isNaN(val)) val = min;
    if (val > max) val = max;
    if (val < min) val = min;
    onChange(val);
  };
  return (
    <div className="stepper">
      <button type="button" className="stepper-btn" onClick={dec} disabled={value <= min}>-
      </button>
      <input
        type="number"
        className="stepper-input"
        value={value}
        onChange={handleInput}
        min={min}
        max={max}
      />
      <button type="button" className="stepper-btn" onClick={inc} disabled={value >= max}>+
      </button>
    </div>
  );
}
