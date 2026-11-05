import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './gamePage.css';
import Leaderboard from '../component/component_game/leaderboard';
import Skills from '../component/component_game/skill';
import Flashcards from '../component/component_game/flashCard';
import CardMapel from '../component/component_game/cardSS';
import {
  fetchClassesByCategory,
  fetchClassDetail,
  sumLessonDurationMinutes
} from '../database/studentClassData';

const normalizeClassTitle = (title) => String(title || '').trim().toLocaleLowerCase();

const normalizeGameDurationSeconds = (value) => {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue) || numericValue <= 0) return null;
  return Math.round(numericValue);
};

const getRuntimeGameDurationSeconds = (card) => {
  if (!card) return null;
  const candidateValues = [
    card.gameDurationSeconds,
    card.durationSeconds,
    card.gameDurationMinutes !== undefined ? Number(card.gameDurationMinutes) * 60 : undefined,
    card.durationMinutes !== undefined ? Number(card.durationMinutes) * 60 : undefined
  ];

  for (const candidate of candidateValues) {
    const normalizedValue = normalizeGameDurationSeconds(candidate);
    if (normalizedValue !== null) return normalizedValue;
  }

  return null;
};

const getCurriculumGameDurationSeconds = (chapters, selectedChapter) => {
  const selectedLessons = selectedChapter
    ? selectedChapter.lessons
    : chapters.flatMap((chapter) => chapter.lessons || []);
  const durationMinutes = sumLessonDurationMinutes(selectedLessons);
  return durationMinutes === null ? null : durationMinutes * 60;
};

const GamePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { selectedCard } = location.state || {};
  const [curriculum, setCurriculum] = useState([]);
  const [selectedChapter, setSelectedChapter] = useState(() => location.state?.selectedChapter || null);
  const [isCurriculumLoading, setIsCurriculumLoading] = useState(false);

  useEffect(() => {
    let isCurrentRequest = true;
    setCurriculum([]);
    setSelectedChapter(location.state?.selectedChapter || null);

    if (!selectedCard?.title) {
      setIsCurriculumLoading(false);
      return () => { isCurrentRequest = false; };
    }

    setIsCurriculumLoading(true);
    const loadCurriculum = async () => {
      try {
        const classes = await fetchClassesByCategory();
        const matchingClass = classes.find((classItem) => (
          normalizeClassTitle(classItem.title) === normalizeClassTitle(selectedCard.title)
        ));
        if (!matchingClass) return;

        const classDetail = await fetchClassDetail(matchingClass.slug || matchingClass.id);
        const syllabus = Array.isArray(classDetail?.syllabus) ? classDetail.syllabus : [];
        const chapters = syllabus.map((chapter, index) => {
          const lessons = Array.isArray(chapter.lessons) ? chapter.lessons : [];
          const topics = lessons.map((lesson) => lesson.title).filter(Boolean);
          if (topics.length === 0 && chapter.summary) topics.push(chapter.summary);

          return {
            ...chapter,
            id: String(chapter.id || chapter.chapterNumber || index + 1),
            progress: Number.isFinite(Number(chapter.progress)) ? Number(chapter.progress) : 0,
            topics
          };
        });

        if (isCurrentRequest) setCurriculum(chapters);
      } catch {
        if (isCurrentRequest) setCurriculum([]);
      } finally {
        if (isCurrentRequest) setIsCurriculumLoading(false);
      }
    };

    loadCurriculum();
    return () => { isCurrentRequest = false; };
  }, [location.state?.selectedChapter, selectedCard?.title]);

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
    const runtimeGameDurationSeconds = getCurriculumGameDurationSeconds(curriculum, selectedChapter)
      ?? getRuntimeGameDurationSeconds(selectedCard);
    navigate('/inGame', {
      state: {
        selectedCard,
        subject: selectedCard.title,
        selectedChapter,
        resetSession: location.state?.resetSession !== undefined ? location.state.resetSession : true,
        ...(runtimeGameDurationSeconds !== null ? { gameDurationSeconds: runtimeGameDurationSeconds } : {})
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
          <Flashcards
            title={cardData.title}
            curriculum={curriculum}
            selectedChapterId={selectedChapter?.id || null}
            onSelectChapter={setSelectedChapter}
            isLoading={isCurriculumLoading}
          />
        </div>
      </div>
    </div>
  );
};

export default GamePage;
