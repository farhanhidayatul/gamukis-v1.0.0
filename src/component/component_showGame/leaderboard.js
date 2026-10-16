import React from "react";
import "./leaderboard.css";
import FeatureChecklist from "./molecules/FeatureChecklist";
import ShareButton from "./atoms/ShareButton";

const LeaderBoard = () => {
    return (
      <div className="container">
            <div className='desc-leaderboard'>
                <h3>Score</h3>
                <p>Lorem Ipsum is simply dummy text of the printing and typesetting .</p>
            </div>
            <div className="leaderboard">
                <div className="board-number">
                    <img src={require("../../images/Checkbox.svg").default} alt="icon" draggable="false"/>
                    <div className="profile-leaderboard">
                        <img src={require("../../images/Checkbox.svg").default} alt="icon" draggable="false"/>
                    </div>
                    <div className="bar-leaderboard">
                        <p>Kritis</p>
                    </div>
                    
                </div>
                <div className="board-number">
                    <img src={require("../../images/Checkbox.svg").default} alt="icon" draggable="false"/>
                    <img src={require("../../images/Checkbox.svg").default} alt="icon" draggable="false"/>
                    <p>Kolaborasi</p>
                </div>
                <div className="board-number">
                    <img src={require("../../images/Checkbox.svg").default} alt="icon" draggable="false"/>
                    <img src={require("../../images/Checkbox.svg").default} alt="icon" draggable="false"/>
                    <p>Kritis</p>
                </div>
                <div className="board-number">
                    <h3>4</h3>
                    <img src={require("../../images/Checkbox.svg").default} alt="icon" draggable="false"/>
                    <p>Kolaborasi</p>
                </div>
                <div className="board-number">
                    <h3>5</h3>
                    <img src={require("../../images/Checkbox.svg").default} alt="icon" draggable="false"/>
                    <p>Kritis</p>
                </div>
            </div>
            <FeatureChecklist features={["Kreatif", "Teknologi dan informasi"]} />
            <ShareButton />
        </div>
    );
  };
  
  export default LeaderBoard;
