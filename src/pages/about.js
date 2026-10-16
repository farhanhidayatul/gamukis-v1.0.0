import React from "react";
import Navbar from "../component/Navbar"
import Banner from "../component/component_about/banner"
import ShortcardLogo from "../component/component_about/shortcard_logo";
import "./about.css";

const About = () => {
  return (
    <main className="about-page">
      <Navbar/>
      <div className="about-content">
        <Banner />
        <ShortcardLogo />
      </div>
    </main>
  );
}

export default About;
