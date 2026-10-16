// src/component_home/Card.js
import React from 'react';
import '../component_home/category_materi.css';
import CardActionButton from './atoms/CardActionButton';
import CardMetadata from './molecules/CardMetadata';

const Card = ({ title, icon, rating, reviews, description, onMainkan }) => {
  return (
    <div className="card">
      <div className="card-content">
        <h3>{title}</h3>
        <CardMetadata rating={rating} reviews={reviews} />
        <p>{description}</p>
        <CardActionButton onClick={onMainkan}>
          Mainkan
        </CardActionButton>
      </div>
      <div className="icon-container">
        {icon}
      </div>
    </div>
  );
};

export default Card;




