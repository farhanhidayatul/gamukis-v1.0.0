import React from 'react';
import '../component_about/banner.css';
import TeamBannerCopy from './molecules/TeamBannerCopy';

const PromoBanner = () => {
  return (
    <div className="promo-banner-2">
      <div className='background-interior-2'></div>
      <div className='banner-background-2'>
        <div className="promo-content">
            <TeamBannerCopy />
        </div>
      </div>
      <div className="promo-images-2">
      </div>
    </div>
  );
};

export default PromoBanner;