import React from "react";
import "./descMateri.css";
import FeatureChecklist from "./molecules/FeatureChecklist";
import ShareButton from "./atoms/ShareButton";

const DescMateri = () => {
    return (
      <div className="container">
            <div className='categoryMateri'>
                <img src={require("../../images/logo_saintek.svg").default} alt="logo" draggable="false"/>
                <h3>SAINTEK</h3>
                <p>(Sains & Teknologi)</p>
            </div>
            <div className="isiContent">
                <p>Lorem Ipsum is simply dummy text of the printing and typesetting.</p>
            </div>
            <FeatureChecklist features={["Kritis", "Kolaborasi"]} />
            <FeatureChecklist features={["Kreatif", "Teknologi dan informasi"]} />
            <ShareButton />
        </div>
    );
  };
  
    export default DescMateri;

