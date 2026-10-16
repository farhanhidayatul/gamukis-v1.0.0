import React, { useState } from 'react';
import '../component_about/shortcard_logo.css';
import LogoOptionButton from './atoms/LogoOptionButton';
import DescAffiliate from './descAffiliate';

const partnerLogos = [
  { label: 'AMIKOM', src: require('../../images/logo-amikom.svg').default },
  { label: 'IEEE', src: require('../../images/logo-IEEE.svg').default },
  { label: 'P2MW', src: require('../../images/logo-P2MW.svg').default },
  { label: 'BITDSUL', src: require('../../images/logo-BITDSUL.svg').default }
];

const ShortcardLogo = () => {
  const [activeButton, setActiveButton] = useState("AMIKOM");

  return (
    <div className="shortcard">
      <div className="flex-container-button">
        {partnerLogos.map(({ label, src }) => (
          <LogoOptionButton
            key={label}
            label={label}
            src={src}
            isActive={activeButton === label}
            onSelect={() => setActiveButton(label)}
          />
        ))}
      </div>
      <DescAffiliate partner={activeButton} />
    </div>
  );
};

export default ShortcardLogo;
