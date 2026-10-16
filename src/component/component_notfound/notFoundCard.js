import React from "react";

const NotFoundCard = ({ onGoHome, onGoBack }) => (
  <section className="notfound-card" aria-labelledby="notfound-title">
    <div className="notfound-code" aria-hidden="true">404</div>
    <span className="notfound-eyebrow">Halaman tidak ditemukan</span>
    <h1 id="notfound-title">Ups, halaman ini tersesat.</h1>
    <p>
      Alamat yang kamu buka tidak tersedia atau mungkin sudah dipindahkan. Mari kembali ke area belajar GAMUKIS.
    </p>
    <div className="notfound-actions">
      <button type="button" className="notfound-primary" onClick={onGoHome}>
        Kembali ke Home
      </button>
      <button type="button" className="notfound-secondary" onClick={onGoBack}>
        Halaman sebelumnya
      </button>
    </div>
  </section>
);

export default NotFoundCard;
