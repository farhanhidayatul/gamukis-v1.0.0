import React from "react";

const ProfileField = ({ name, label, value, onChange, placeholder, inputMode, maxLength, rows, required = false, pattern, title, disabled = false, isMultiline = false, className = "" }) => {
  const fieldProps = {
    id: name,
    name,
    value,
    onChange,
    placeholder,
    ...(inputMode ? { inputMode } : {}),
    ...(maxLength ? { maxLength } : {}),
    ...(required ? { required: true } : {}),
    ...(pattern ? { pattern } : {}),
    ...(title ? { title } : {}),
    ...(disabled ? { disabled: true } : {})
  };

  return (
    <label className={className} htmlFor={name}>
      {label}
      {isMultiline ? (
        <textarea {...fieldProps} rows={rows} />
      ) : (
        <input {...fieldProps} />
      )}
    </label>
  );
};

export default ProfileField;
