import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './gamePage.css';
import Leaderboard from '../component/component_game/leaderboard';
import Skills from '../component/component_game/skill';
import Flashcards from '../component/component_game/flashCard';
import CardMapel from '../component/component_game/cardSS';

const GamePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { selectedCard } = location.state || {};

  const handleBack = () => {
    navigate(-1); // Navigate back to the previous page
  };

  const hasSelectedCard = Boolean(selectedCard);
  const defaultCardData = {
    logo: '',
    title: 'Pilih Mapel',
    subtitle: 'Buka dari kategori untuk melihat detail mapel',
    description: 'Halaman ini dibuka langsung tanpa pilihan mapel. Pilih mapel terlebih dahulu dari halaman utama agar game dapat berjalan optimal.',
    features: ['Tidak ada data mapel']
  };

  const handleStart = () => {
    if (!hasSelectedCard) return;
    navigate('/inGame', {
      state: {
        selectedCard,
        subject: selectedCard.title,
        resetSession: location.state?.resetSession || false
      }
    });
  };

  const getIcon = (icon) => {
    switch (icon) {
      case "logo_saintek":
        return <img className="icon icon-saintek" src={require("../images/logo_saintek.svg").default} alt="Saintek icon" draggable="false" />;
      case "logo_soshum":
        return <img className="icon icon-soshum" src={require("../images/logo_soshum.svg").default} alt="Soshum icon" draggable="false" />;
      default:
        return null;
    }
  };

  const getTitle = (title) => {
    switch (title) {
      case "Biologi":
      case "Kimia":
      case "Fisika":
      case "Matematika":
      case "Informatika":
        return "SAINTEK";
      case "Sejarah":
      case "Geografi":
      case "Ekonomi":
      case "Sosiologi":
        return "SOSHUM";
      default:
        return title;
    }
  };

  const cardData = selectedCard || defaultCardData;

  const curriculum = [
    { title: 'Pengantar Biologi dan Biokimia', progress: 10, topics: ['Definisi biologi, cabang-cabang biologi.', 'Struktur dan fungsi makromolekul.'] },
    { title: 'Struktur dan Fungsi Sel', progress: 15, topics: ['Struktur sel prokariotik dan eukariotik.', 'Fungsi organel seluler dan proses sel.'] },
    { title: 'Genetika Dasar', progress: 20, topics: ['Konsep dasar genetika: gen, alel, kromosom.', 'Hukum Mendel dan pewarisan sifat.'] },
    { title: 'Reproduksi', progress: 15, topics: ['Reproduksi pada tumbuhan: penyerbukan dan pembuahan.', 'Reproduksi pada hewan dan manusia.'] },
    { title: 'Biologi Molekuler dan Seluler', progress: 20, topics: ['Siklus sel: interfase, mitosis, meiosis.', 'Regulasi ekspresi gen dan teknologi DNA.'] },
    { title: 'Imunitas dan Penyakit', progress: 20, topics: ['Sistem kekebalan tubuh dan respons imun.', 'Penyakit infeksi, vaksin, dan antibiotik.'] },
  ];

  const skills = ['Kritis', 'Kreatif', 'Kolaborasi', 'Teknologi', 'Analitis', 'Inovatif'];

  return (
    <div className="game-page">
      <button className="back-button" onClick={handleBack}>
        <img className="icon-back" src={require("../images/back-icon.svg").default} alt="Biologi icon" draggable="false" />
        <p>Back</p>
      </button>
      <div className="game-page-content">
        <div className="sidebar">
          <CardMapel 
            logo={getIcon(cardData.logo)}
            title={getTitle(cardData.title)}
            subtitle={cardData.subtitle}
            description={cardData.description}
            features={cardData.features}
          />
          <Leaderboard page="gamePage"/>
        </div>
        <div className="main-content">
          <div className="actions">
            <button className="action-button action-button-start" onClick={handleStart} disabled={!hasSelectedCard}>
              <span aria-hidden="true">&#9654;</span> Mulai
            </button>
            <button className="action-button action-button-flashcards" type="button">
              <span aria-hidden="true">&#10022;</span> Flashcards
            </button>
          </div>
          <Skills skills={skills} />
        </div>
        <div className="details">
          <Flashcards title={cardData.title} curriculum={curriculum} />
        </div>
      </div>
    </div>
  );
};

export default GamePage;


