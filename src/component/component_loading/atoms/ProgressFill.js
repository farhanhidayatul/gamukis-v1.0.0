import React from 'react';

const ProgressFill = ({ value, background }) => (
  <div
    className="progressbar"
    role="progressbar"
    aria-label="Memuat aplikasi"
    aria-valuemin={0}
    aria-valuemax={100}
    aria-valuenow={Math.min(value, 100)}
    style={{ width: `${Math.min(value, 100)}%`, background }}
  />
);

export default ProgressFill;
