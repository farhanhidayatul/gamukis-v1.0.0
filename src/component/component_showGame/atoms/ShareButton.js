import React from 'react';

const shareIcon = require('../../../images/icon_share.svg').default;

const ShareButton = () => (
  <button type="button" className="btnShare" aria-label="Bagikan materi">
    <img src={shareIcon} alt="" draggable="false" />
    <span>Share</span>
  </button>
);

export default ShareButton;
