import React, { useState } from "react";
import "./category_materi.css";
import IsiMateri from "./category_materi_isi";
import { FaBook, FaGlobe } from "react-icons/fa";
import { useNavigate } from 'react-router-dom';
import CategoryOptionButton from './atoms/CategoryOptionButton';

const KategoriMateri = () => {
  const [activeCategory, setActiveCategory] = useState("SAINTEK");
  const navigate = useNavigate();

  const saintekCards = [
    {
      title: "Biologi",
      icon: (
        <img
          className="icon icon-biologi"
          src={require("../../images/Vektor_Biologi.svg").default}
          alt="Biologi icon"
          draggable="false"
        />
      ),
      rating: 4.3,
      reviews: 112,
      description: "Placeholder text commonly used in the graphic, print, and publishing industries for previewing layouts and visual mockups.",
      subtitle: "Sains Biologi",
      features: ["Kritis", "Kreatif", "Kolaborasi", "Teknologi dan informasi"]
    },
    {
      title: "Kimia",
      icon: (
        <img
          className="icon icon-kimia"
          src={require("../../images/Vektor_Kimia.svg").default}
          alt="Kimia icon"
          draggable="false"
        />
      ),
      rating: 4.3,
      reviews: 112,
      description: "Placeholder text commonly used in the graphic, print, and publishing industries for previewing layouts and visual mockups.",
      subtitle: "Sains Kimia",
      features: ["Analitis", "Empatik", "Kolaboratif", "Inovatif"]
    },
    {
      title: "Fisika",
      icon: (
        <img
          className="icon icon-fisika"
          src={require("../../images/Vektor_Fisika.svg").default}
          alt="Fisika icon"
          draggable="false"
        />
      ),
      rating: 4.3,
      reviews: 112,
      description: "Placeholder text commonly used in the graphic, print, and publishing industries for previewing layouts and visual mockups.",
      subtitle: "Sains Fisika",
      features: ["Problem Solving", "Logical", "Scientific Thinking", "Innovative"]
    },
    {
      title: "Matematika",
      icon: (
        <img
          className="icon icon-matematika"
          src={require("../../images/Vektor_Matematika.svg").default}
          alt="Matematika icon"
          draggable="false"
        />
      ),
      rating: 4.3,
      reviews: 112,
      description: "Placeholder text commonly used in the graphic, print, and publishing industries for previewing layouts and visual mockups.",
      subtitle: "Sains Matematika",
      features: ["Analytical Thinking", "Quantitative Reasoning", "Problem Solving", "Abstract Thinking"]
    },
    {
      title: "Informatika",
      icon: (
        <img
          className="icon icon-informatika"
          src={require("../../images/Vektor_Logika_Matematika.svg").default}
          alt="Informatika icon"
          draggable="false"
        />
      ),
      rating: 4.3,
      reviews: 112,
      description: "Placeholder text commonly used in the graphic, print, and publishing industries for previewing layouts and visual mockups.",
      subtitle: "Sains Informatika",
      features: ["Computational Thinking", "Algorithmic Problem Solving", "System Design", "Technology Integration"]
    },
  ];

  const soshumCards = [
    {
      title: "Sejarah",
      icon: <FaBook />,
      rating: 4.3,
      reviews: 112,
      description: "Placeholder text commonly used in the graphic, print, and publishing industries for previewing layouts and visual mockups.",
      subtitle: "Ilmu Sejarah",
      features: ["Historical Analysis", "Critical Thinking", "Research Skills", "Contextual Understanding"]
    },
    {
      title: "Geografi",
      icon: <FaBook />,
      rating: 4.3,
      reviews: 112,
      description: "Placeholder text commonly used in the graphic, print, and publishing industries for previewing layouts and visual mockups.",
      subtitle: "Ilmu Geografi",
      features: ["Spatial Awareness", "Environmental Understanding", "Map Reading", "Data Analysis"]
    },
    {
      title: "Ekonomi",
      icon: <FaBook />,
      rating: 4.3,
      reviews: 112,
      description: "Placeholder text commonly used in the graphic, print, and publishing industries for previewing layouts and visual mockups.",
      subtitle: "Ilmu Ekonomi",
      features: ["Economic Analysis", "Financial Literacy", "Market Understanding", "Data Interpretation"]
    },
    {
      title: "Sosiologi",
      icon: <FaBook />,
      rating: 4.3,
      reviews: 112,
      description: "Placeholder text commonly used in the graphic, print, and publishing industries for previewing layouts and visual mockups.",
      subtitle: "Ilmu Sosiologi",
      features: ["Societal Analysis", "Critical Thinking", "Research Skills", "Contextual Understanding"]
    },
    {
      title: "Matematika",
      icon: <FaBook />,
      rating: 4.3,
      reviews: 112,
      description: "Placeholder text commonly used in the graphic, print, and publishing industries for previewing layouts and visual mockups.",
      subtitle: "Ilmu Matematika",
      features: ["Analytical Thinking", "Quantitative Reasoning", "Problem Solving", "Abstract Thinking"]
    },
  ];

  // 8 MATA PELAJARAN BAHASA LENGKAP
  const bahasaCards = [
    {
      title: "Bahasa Indonesia",
      icon: <FaBook />,
      rating: 4.9,
      reviews: 215,
      description: "PUEBI/EYD V, morfologi, kalimat efektif, pemahaman ragam teks, teks anekdot, dan apresiasi sastra Indonesia.",
      subtitle: "Bahasa & Sastra Indonesia",
      features: ["EYD Edisi V", "Kalimat Efektif", "Literasi Teks", "Tata Bahasa Baku"]
    },
    {
      title: "Bahasa Inggris",
      icon: <FaGlobe />,
      rating: 4.9,
      reviews: 240,
      description: "Mastering tenses, conditionals, passive voice, academic reading comprehension, and CEFR B1-C1 fluency.",
      subtitle: "English Proficiency",
      features: ["Grammar Mastery", "Conditionals", "Academic Reading", "Global Communication"]
    },
    {
      title: "Bahasa Jawa",
      icon: <FaBook />,
      rating: 4.8,
      reviews: 95,
      description: "Unggah-ungguh basa Jawa (Ngoko nganti Krama Inggil), maca lan nulis Aksara Jawa, tembang macapat, sarta paribasan.",
      subtitle: "Basa & Budaya Jawa",
      features: ["Unggah-Ungguh Basa", "Aksara Jawa", "Tembang Macapat", "Krama Inggil"]
    },
    {
      title: "Bahasa Prancis",
      icon: <FaGlobe />,
      rating: 4.8,
      reviews: 78,
      description: "Apprendre le français: salutations, articles, conjugaison des verbes être/avoir, et culture française.",
      subtitle: "Langue Française (A1-A2)",
      features: ["French Phonetics", "Conjugaison", "Salutations", "Vocabulaire Quotidien"]
    },
    {
      title: "Bahasa Jerman",
      icon: <FaGlobe />,
      rating: 4.7,
      reviews: 70,
      description: "Deutsche Grammatik: der/die/das, Kasus Akkusativ & Dativ, trennbare Verben, susunan kalimat Hauptsatz.",
      subtitle: "Deutsche Sprache (A1-A2)",
      features: ["Grammatik", "Akkusativ & Dativ", "Satzstruktur", "Komunikasi Praktis"]
    },
    {
      title: "Bahasa Mandarin",
      icon: <FaGlobe />,
      rating: 4.9,
      reviews: 154,
      description: "Sistem Pinyin, 4 nada (shēngdiào), goresan dasar aksara Hanzi (bihua), kata bantu bilangan, dan dialog HSK.",
      subtitle: "Hànyǔ Pǔtōnghuà (HSK 1-3)",
      features: ["Pinyin 4 Nada", "Goresan Hanzi", "Tata Bahasa SVO", "HSK Preparation"]
    },
    {
      title: "Bahasa Spanyol",
      icon: <FaGlobe />,
      rating: 4.8,
      reviews: 82,
      description: "Español básico: fonética vocálica, verbos regulares -ar/-er/-ir, perbedaan ser vs estar, percakapan sehari-hari.",
      subtitle: "Lengua Española (A1-A2)",
      features: ["Ser vs Estar", "Conjugación", "Conversación", "Vocabulario"]
    },
    {
      title: "Bahasa Melayu",
      icon: <FaBook />,
      rating: 4.8,
      reviews: 72,
      description: "Tatabahasa Dewan Bahasa Melayu serumpun, perbandingan kosa kata seiras, imbuhan, pantun, dan peribahasa.",
      subtitle: "Bahasa Melayu Serumpun",
      features: ["Tatabahasa Dewan", "Kosa Kata Serumpun", "Pantun Empat Kerat", "Peribahasa"]
    }
  ];

  const handleCategoryClick = (category) => {
    setActiveCategory(category);
  };

  const handleMainkan = (card) => {
    let logoIdentifier = "logo_saintek";
    let subtitleText = "Sains & Teknologi";

    if (activeCategory === "SOSHUM") {
      logoIdentifier = "logo_soshum";
      subtitleText = "Sosial & Hukum";
    } else if (activeCategory === "BAHASA") {
      logoIdentifier = "logo_bahasa";
      subtitleText = "Bahasa & Literasi";
    }

    const cardData = {
      title: card.title,
      logo: logoIdentifier,
      subtitle: card.subtitle || subtitleText,
      description: card.description,
      features: card.features,
    };
    navigate(`/gamePage`, { state: { selectedCard: cardData } });
  };

  const getBahasaLogo = () => {
    try {
      return require("../../images/logo_bahasa.svg").default;
    } catch (e) {
      return require("../../images/logo_saintek.svg").default;
    }
  };

  return (
    <div className="kategori-materi">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1>Kategori Materi</h1>
          <p>
            Pilih kategori materi untuk menjelajahi silabus kurikulum, latihan kilat, dan mode permainan interaktif.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/kelas', { state: { selectedCategory: activeCategory } })}
          style={{
            background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
            color: "#ffffff",
            border: "none",
            borderRadius: "10px",
            padding: "10px 18px",
            fontWeight: "700",
            fontSize: "14px",
            cursor: "pointer",
            marginBottom: "16px",
            boxShadow: "0 4px 12px rgba(37, 99, 235, 0.3)"
          }}
        >
          🎓 Buka Ruang Kelas Siswa Lengkap →
        </button>
      </div>

      <div className="categories">
        <CategoryOptionButton
          category="SAINTEK"
          description="Sains & Teknologi"
          icon={require("../../images/logo_saintek.svg").default}
          isActive={activeCategory === "SAINTEK"}
          onSelect={() => handleCategoryClick("SAINTEK")}
        />
        <CategoryOptionButton
          category="SOSHUM"
          description="Sosial & Hukum"
          icon={require("../../images/logo_soshum.svg").default}
          isActive={activeCategory === "SOSHUM"}
          onSelect={() => handleCategoryClick("SOSHUM")}
        />
        <CategoryOptionButton
          category="BAHASA"
          description="Bahasa & Literasi (8 Bahasa)"
          icon={getBahasaLogo()}
          isActive={activeCategory === "BAHASA"}
          onSelect={() => handleCategoryClick("BAHASA")}
        />
      </div>

      {activeCategory === "SAINTEK" && <IsiMateri cards={saintekCards} onMainkan={handleMainkan} />}
      {activeCategory === "SOSHUM" && <IsiMateri cards={soshumCards} onMainkan={handleMainkan} />}
      {activeCategory === "BAHASA" && <IsiMateri cards={bahasaCards} onMainkan={handleMainkan} />}
    </div>
  );
};

export default KategoriMateri;

