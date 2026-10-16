import React from 'react';

const ratingIcon = require('../../../images/Rating icong.svg').default;
const personIcon = require('../../../images/Icon Person.svg').default;

const CardMetadata = ({ rating, reviews }) => (
  <div className="rating-review">
    <div className="rating">
      <img src={ratingIcon} alt="" /> {rating}
    </div>
    <div className="review">
      <img src={personIcon} alt="" /> {reviews}
    </div>
  </div>
);

export default CardMetadata;
