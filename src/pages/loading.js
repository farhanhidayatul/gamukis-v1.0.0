import React from "react";
import Progressbar from "../component/component_loading/progressbar";
import Foto from "../component/photo";
import "../component/component_loading/progressbar.css";

const Loading = () => {
  return (
    <main className="loading-screen">
      <Foto />
      <Progressbar />
    </main>
  );
};

export default Loading;
