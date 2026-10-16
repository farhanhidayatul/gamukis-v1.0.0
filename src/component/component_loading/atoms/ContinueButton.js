import React from 'react';
import { Link } from 'react-router-dom';

const ContinueButton = () => (
  <Link to="/home" className="btn">
    <b>Lanjutkan</b>
  </Link>
);

export default ContinueButton;
