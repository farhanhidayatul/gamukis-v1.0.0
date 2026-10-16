import React from "react";
import "./RoomFormInput.css";

const RoomFormInput = ({
  label,
  value,
  onChange,
  placeholder,
  maxLength,
  type = "text",
  min,
  max
}) => (
  <label className="room-form-input">
    <span className="room-form-input__label">{label}</span>
    <input
      className="room-form-input__field"
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      maxLength={maxLength}
      min={min}
      max={max}
    />
  </label>
);

export default RoomFormInput;
