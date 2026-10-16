import React from "react";
import { useNavigate } from "react-router-dom";
import NotFoundCard from "../component/component_notfound/notFoundCard";
import "./notfound.css";

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <main className="notfound-page">
      <NotFoundCard
        onGoHome={() => navigate("/home")}
        onGoBack={() => navigate(-1)}
      />
    </main>
  );
};

export default NotFound;