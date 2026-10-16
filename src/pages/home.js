import React from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../component/Navbar";
import Banner from "../component/component_home/banner";
import KategoriMateri from "../component/component_home/category_materi";
import Stats from "../component/component_home/stats";
import "../pages/home.css";

const Home = () => {
  const navigate = useNavigate();

  return (
    <div>
      <Navbar />
      <div className="container-home">
        <Banner />
        <KategoriMateri />
        <Stats
          onLoginClick={() => navigate('/login')}
          onRegisterClick={() => navigate('/register')}
        />
      </div>
    </div>
  );
};

export default Home;
