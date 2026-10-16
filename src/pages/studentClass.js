import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../component/Navbar';
import './studentClass.css';
import {
  fetchClassCategories,
  fetchClassesByCategory,
  fetchClassDetail,
  fetchDailyRecommendations,
  fetchStudentClassProgress,
  saveStudentClassProgress,
  FALLBACK_CLASSES,
  FALLBACK_CLASS_CATEGORIES,
  FALLBACK_DAILY_RECOMMENDATIONS
} from '../database/studentClassData';

const StudentClass = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // State management
  const [categories, setCategories] = useState(FALLBACK_CLASS_CATEGORIES);
  const [selectedCategory, setSelectedCategory] = useState('BAHASA');
  const [selectedLanguageFilter, setSelectedLanguageFilter] = useState('ALL');
  const [classesList, setClassesList] = useState(() =>
    FALLBACK_CLASSES.filter((c) => c.category === 'BAHASA')
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [activeClassDetail, setActiveClassDetail] = useState(() =>
    FALLBACK_CLASSES.find((c) => c.category === 'BAHASA') || FALLBACK_CLASSES[0]
  );
  const [activeDetailTab, setActiveDetailTab] = useState('overview'); // 'overview' | 'syllabus' | 'modules' | 'quiz'
  const [dailyRecommendations, setDailyRecommendations] = useState(FALLBACK_DAILY_RECOMMENDATIONS);
  const [studentProgress, setStudentProgress] = useState({
    completedLessons: ['bind-1-1'],
    completedChapters: [],
    overallPercent: 20,
    streakDays: 4
  });

  // Quiz state
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [collapsedChapters, setCollapsedChapters] = useState({});

  // 1. Initial data loading
  useEffect(() => {
    let isMounted = true;

    const loadInitialData = async () => {
      const cats = await fetchClassCategories();
      const recs = await fetchDailyRecommendations();
      const prog = await fetchStudentClassProgress('student_me', null);

      if (isMounted) {
        setCategories(cats);
        setDailyRecommendations(recs);
        if (prog) setStudentProgress(prog);
      }
    };

    loadInitialData();
    return () => { isMounted = false; };
  }, []);

  // 2. Load classes whenever selected category changes
  useEffect(() => {
    let isMounted = true;
    const initialForCategory = FALLBACK_CLASSES.filter((c) => c.category === selectedCategory);
    setClassesList(initialForCategory);
    if (initialForCategory.length > 0) {
      setActiveClassDetail(initialForCategory[0]);
    }

    const loadClasses = async () => {
      const items = await fetchClassesByCategory(selectedCategory);
      if (isMounted && items && items.length > 0) {
        setClassesList(items);
        setActiveClassDetail(items[0]);
      }
    };
    loadClasses();
    return () => { isMounted = false; };
  }, [selectedCategory]);

  // Handle URL query or navigation state
  useEffect(() => {
    if (location.state?.selectedSubject) {
      const targetSlug = location.state.selectedSubject.toLowerCase();
      const match = FALLBACK_CLASSES.find(
        (c) => c.title.toLowerCase().includes(targetSlug) || c.slug.toLowerCase().includes(targetSlug)
      );
      if (match) {
        setSelectedCategory(match.category);
        setActiveClassDetail(match);
      }
    }
  }, [location.state]);

  // 3. Filtered classes based on search and language filter
  const filteredClasses = useMemo(() => {
    return classesList.filter((cls) => {
      const matchesSearch =
        cls.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cls.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (cls.skillsAcquired && cls.skillsAcquired.some(s => s.toLowerCase().includes(searchQuery.toLowerCase())));

      if (selectedCategory === 'BAHASA' && selectedLanguageFilter !== 'ALL') {
        return matchesSearch && cls.title.toLowerCase().includes(selectedLanguageFilter.toLowerCase());
      }

      return matchesSearch;
    });
  }, [classesList, searchQuery, selectedCategory, selectedLanguageFilter]);

  // Open class detail modal / viewer
  const handleOpenClassDetail = async (cls) => {
    const fullDetail = await fetchClassDetail(cls.slug);
    setActiveClassDetail(fullDetail || cls);
    setActiveDetailTab('overview');
    setQuizAnswers({});
    setQuizSubmitted(false);
  };

  // Toggle chapter collapse
  const toggleChapterCollapse = (chapterNum) => {
    setCollapsedChapters((prev) => ({
      ...prev,
      [chapterNum]: !prev[chapterNum]
    }));
  };

  // Toggle chapter completion
  const handleToggleChapterCompletion = async (chapterNumber) => {
    if (!activeClassDetail) return;
    const currentCompleted = studentProgress.completedChapters || [];
    const isCompleted = currentCompleted.includes(chapterNumber);

    const updatedChapters = isCompleted
      ? currentCompleted.filter((n) => n !== chapterNumber)
      : [...currentCompleted, chapterNumber];

    const totalChapters = activeClassDetail.syllabus?.length || 1;
    const calcPercent = Math.min(100, Math.round((updatedChapters.length / totalChapters) * 100));

    const newProgress = {
      ...studentProgress,
      completedChapters: updatedChapters,
      overallPercent: calcPercent,
      classSlug: activeClassDetail.slug
    };

    setStudentProgress(newProgress);
    await saveStudentClassProgress(newProgress);
  };

  // Mini quiz handlers
  const handleSelectQuizAnswer = (questionId, option) => {
    if (quizSubmitted) return;
    setQuizAnswers((prev) => ({
      ...prev,
      [questionId]: option
    }));
  };

  const handleGradeQuiz = () => {
    setQuizSubmitted(true);
  };

  const handleResetQuiz = () => {
    setQuizAnswers({});
    setQuizSubmitted(false);
  };

  // Launch into game for practice
  const handleLaunchGame = (cls) => {
    const cardData = {
      title: cls.title,
      logo: cls.category === 'SAINTEK' ? 'logo_saintek' : 'logo_soshum',
      subtitle: cls.categoryLabel || cls.category,
      description: cls.description,
      features: cls.skillsAcquired || []
    };
    navigate('/gamePage', { state: { selectedCard: cardData } });
  };

  // 8 Languages list for quick filter chips
  const BAHASA_LANGUAGES = [
    { key: 'ALL', label: 'Semua Bahasa' },
    { key: 'Indonesia', label: '🇮🇩 Indonesia' },
    { key: 'Inggris', label: '🇬🇧 Inggris' },
    { key: 'Jawa', label: '🎭 Jawa' },
    { key: 'Prancis', label: '🇫🇷 Prancis' },
    { key: 'Jerman', label: '🇩🇪 Jerman' },
    { key: 'Mandarin', label: '🇨🇳 Mandarin' },
    { key: 'Spanyol', label: '🇪🇸 Spanyol' },
    { key: 'Melayu', label: '🇲🇾 Melayu' }
  ];

  return (
    <div className="student-class-page">
      <Navbar />

      <main className="student-class-container">
        {/* HERO SECTION */}
        <header className="class-hero-section">
          <div className="hero-content">
            <div className="hero-badge">🎓 Ruang Belajar & Kurikulum Terpadu</div>
            <h1 className="hero-title">Kelas Siswa Gamukis</h1>
            <p className="hero-description">
              Jelajahi deskripsi kurikulum komprehensif materi <strong>Saintek</strong>, <strong>Soshum</strong>, dan <strong>Bahasa</strong> lengkap.
              Pelajari silabus, target capaian belajar, modul interaktif, latihan kilat, dan pantau kemajuan belajarmu.
            </p>

            {/* Quick Metrics Bar */}
            <div className="hero-metrics">
              <div className="metric-item">
                <span className="metric-number">17+</span>
                <span className="metric-label">Mata Pelajaran</span>
              </div>
              <div className="metric-item">
                <span className="metric-number">8</span>
                <span className="metric-label">Bahasa Dunia</span>
              </div>
              <div className="metric-item">
                <span className="metric-number">250+</span>
                <span className="metric-label">Modul & Silabus</span>
              </div>
              <div className="metric-item">
                <span className="metric-number">🔥 {studentProgress.streakDays} Hari</span>
                <span className="metric-label">Streak Belajar</span>
              </div>
            </div>
          </div>
        </header>

        {/* DAILY RECOMMENDATIONS WIDGET */}
        <section className="daily-recommendations-widget" aria-label="Rekomendasi Harian">
          <div className="section-header">
            <div>
              <h2 className="section-title">💡 Rekomendasi Materi Harian</h2>
              <p className="section-subtitle">Topik unggulan yang dirancang untuk mempercepat penguasaan konsepmu hari ini</p>
            </div>
          </div>
          <div className="recommendations-grid">
            {dailyRecommendations.map((rec) => (
              <div key={rec.id} className="rec-card" onClick={() => {
                const target = FALLBACK_CLASSES.find(c => c.slug === rec.classSlug);
                if (target) {
                  setSelectedCategory(target.category);
                  handleOpenClassDetail(target);
                }
              }}>
                <div className="rec-header">
                  <span className="rec-tag">{rec.tag}</span>
                  <span className="rec-duration">⏱️ {rec.duration}</span>
                </div>
                <h3 className="rec-title">{rec.title}</h3>
                <p className="rec-reason">{rec.reason}</p>
                <div className="rec-footer">
                  <span className="rec-subject">{rec.subject}</span>
                  <button className="rec-button" type="button">Pelajari Sekarang →</button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CATEGORY SELECTOR & FILTER BAR */}
        <section className="class-navigation-section">
          <div className="category-tabs-container" role="tablist">
            {['SAINTEK', 'SOSHUM', 'BAHASA'].map((cat) => {
              const isActive = selectedCategory === cat;
              const count = cat === 'BAHASA' ? 8 : (cat === 'SAINTEK' ? 5 : 4);
              return (
                <button
                  key={cat}
                  role="tab"
                  aria-selected={isActive}
                  className={`category-tab-btn ${isActive ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedCategory(cat);
                    setSelectedLanguageFilter('ALL');
                  }}
                >
                  <span className="tab-icon">
                    {cat === 'SAINTEK' ? '⚛️' : (cat === 'SOSHUM' ? '📚' : '🌐')}
                  </span>
                  <span className="tab-title">{cat}</span>
                  <span className="tab-badge">{count} Mapel</span>
                </button>
              );
            })}
          </div>

          {/* Sub-filter for Language category */}
          {selectedCategory === 'BAHASA' && (
            <div className="language-pills-bar" aria-label="Pilihan Bahasa Lengkap">
              <span className="pills-label">Pilih Bahasa:</span>
              <div className="pills-scroll">
                {BAHASA_LANGUAGES.map((lang) => (
                  <button
                    key={lang.key}
                    type="button"
                    className={`lang-pill-btn ${selectedLanguageFilter === lang.key ? 'active' : ''}`}
                    onClick={() => setSelectedLanguageFilter(lang.key)}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Search bar */}
          <div className="search-filter-box">
            <span className="search-icon" aria-hidden="true">🔍</span>
            <input
              type="text"
              placeholder={`Cari mata pelajaran, topik, atau kata kunci ${selectedCategory}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="class-search-input"
            />
            {searchQuery && (
              <button className="clear-search-btn" onClick={() => setSearchQuery('')}>✕</button>
            )}
          </div>
        </section>

        {/* MAIN TWO-COLUMN LAYOUT: CLASS CARDS LIST + COMPREHENSIVE DETAIL VIEW */}
        <div className="class-explorer-layout">
          {/* LEFT: CLASSES GRID */}
          <div className="classes-grid-column">
            <div className="column-header">
              <h3>Daftar Kelas ({filteredClasses.length})</h3>
              <span className="category-indicator">Kategori: {selectedCategory}</span>
            </div>

            <div className="classes-cards-list">
              {filteredClasses.length === 0 ? (
                <div className="empty-classes-state">
                  <p>Tidak ada mata pelajaran yang cocok dengan pencarian <strong>"{searchQuery}"</strong>.</p>
                  <button className="btn-reset-filter" onClick={() => { setSearchQuery(''); setSelectedLanguageFilter('ALL'); }}>
                    Reset Pencarian
                  </button>
                </div>
              ) : (
                filteredClasses.map((cls) => {
                  const isSelected = activeClassDetail?.id === cls.id;
                  return (
                    <article
                      key={cls.id}
                      className={`class-card-item ${isSelected ? 'selected' : ''}`}
                      onClick={() => handleOpenClassDetail(cls)}
                    >
                      <div className="class-card-header">
                        <div className="card-badge-row">
                          <span className="badge-category">{cls.category}</span>
                          <span className="badge-rating">⭐ {cls.rating}</span>
                          <span className="badge-level">{cls.level}</span>
                        </div>
                        <h3 className="class-card-title">{cls.title}</h3>
                      </div>

                      <p className="class-card-desc">
                        {cls.description.length > 130 ? cls.description.substring(0, 130) + '...' : cls.description}
                      </p>

                      <div className="class-card-meta">
                        <span>⏱️ {cls.totalDuration}</span>
                        <span>📖 {cls.totalModules} Modul</span>
                        <span>👥 {cls.enrolledCount} Siswa</span>
                      </div>

                      <div className="class-card-actions">
                        <button
                          type="button"
                          className="btn-card-detail"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenClassDetail(cls);
                          }}
                        >
                          Lihat Silabus & Deskripsi
                        </button>
                        <button
                          type="button"
                          className="btn-card-play"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleLaunchGame(cls);
                          }}
                        >
                          ▶ Mainkan
                        </button>
                      </div>
                    </article>
                  );
                })
              )}
            </div>
          </div>

          {/* RIGHT: COMPREHENSIVE DETAIL PANEL */}
          <div className="class-detail-column">
            {activeClassDetail ? (
              <div className="class-detail-panel">
                {/* DETAIL HERO HEADER */}
                <div className="detail-panel-hero">
                  <div className="detail-hero-top">
                    <span className="badge-category-glow">{activeClassDetail.category}</span>
                    <span className="badge-level-pill">{activeClassDetail.level}</span>
                    {activeClassDetail.badge && (
                      <span className="badge-highlight">🏷️ {activeClassDetail.badge}</span>
                    )}
                  </div>
                  <h2 className="detail-panel-title">{activeClassDetail.title}</h2>
                  <p className="detail-panel-desc">{activeClassDetail.description}</p>

                  {/* Instructor badge */}
                  {activeClassDetail.instructor && (
                    <div className="instructor-card">
                      <span className="instructor-avatar">{activeClassDetail.instructor.avatar}</span>
                      <div className="instructor-info">
                        <strong>{activeClassDetail.instructor.name}</strong>
                        <span>{activeClassDetail.instructor.title}</span>
                      </div>
                    </div>
                  )}

                  {/* Quick Action Button */}
                  <div className="detail-hero-actions">
                    <button
                      type="button"
                      className="btn-hero-launch-game"
                      onClick={() => handleLaunchGame(activeClassDetail)}
                    >
                      🎮 Mulai Mode Game Latihan ({activeClassDetail.title})
                    </button>
                  </div>
                </div>

                {/* DETAIL TABS NAVIGATION */}
                <div className="detail-tabs-bar" role="tablist">
                  <button
                    className={`detail-tab-btn ${activeDetailTab === 'overview' ? 'active' : ''}`}
                    onClick={() => setActiveDetailTab('overview')}
                  >
                    🎯 Capaian Belajar
                  </button>
                  <button
                    className={`detail-tab-btn ${activeDetailTab === 'syllabus' ? 'active' : ''}`}
                    onClick={() => setActiveDetailTab('syllabus')}
                  >
                    📑 Silabus & Bab ({activeClassDetail.syllabus?.length || 0})
                  </button>
                  <button
                    className={`detail-tab-btn ${activeDetailTab === 'modules' ? 'active' : ''}`}
                    onClick={() => setActiveDetailTab('modules')}
                  >
                    💡 Ringkasan Interaktif
                  </button>
                  <button
                    className={`detail-tab-btn ${activeDetailTab === 'quiz' ? 'active' : ''}`}
                    onClick={() => setActiveDetailTab('quiz')}
                  >
                    ⚡ Latihan Kilat ({activeClassDetail.miniQuiz?.length || 0})
                  </button>
                </div>

                {/* TAB 1: OVERVIEW & LEARNING OBJECTIVES */}
                {activeDetailTab === 'overview' && (
                  <div className="detail-tab-content">
                    <div className="objectives-container">
                      <h3 className="content-heading">Target Capaian Belajar (Learning Objectives)</h3>
                      <p className="content-subtext">Setelah menyelesaikan seluruh materi di kelas ini, kamu ditargetkan mampu:</p>
                      <ul className="objectives-list">
                        {activeClassDetail.learningObjectives?.map((obj, idx) => (
                          <li key={idx} className="objective-item">
                            <span className="obj-check">✓</span>
                            <span>{obj}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="skills-container">
                      <h4 className="skills-heading">Kompetensi yang Dibangun:</h4>
                      <div className="skills-tags">
                        {activeClassDetail.skillsAcquired?.map((skill, idx) => (
                          <span key={idx} className="skill-pill">#{skill}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: SYLLABUS & LESSON CHAPTERS */}
                {activeDetailTab === 'syllabus' && (
                  <div className="detail-tab-content">
                    <div className="syllabus-header">
                      <h3 className="content-heading">Silabus & Daftar Bab</h3>
                      <div className="progress-indicator">
                        <span>Penyelesaian Bab: {studentProgress.completedChapters?.length || 0} / {activeClassDetail.syllabus?.length || 1}</span>
                      </div>
                    </div>

                    <div className="chapters-accordion">
                      {activeClassDetail.syllabus?.map((ch) => {
                        const isCollapsed = collapsedChapters[ch.chapterNumber];
                        const isDone = (studentProgress.completedChapters || []).includes(ch.chapterNumber);

                        return (
                          <div key={ch.chapterNumber} className={`chapter-card ${isDone ? 'completed' : ''}`}>
                            <div className="chapter-header" onClick={() => toggleChapterCollapse(ch.chapterNumber)}>
                              <div className="chapter-left">
                                <button
                                  type="button"
                                  className={`btn-check-chapter ${isDone ? 'checked' : ''}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleToggleChapterCompletion(ch.chapterNumber);
                                  }}
                                  aria-label={`Tandai Bab ${ch.chapterNumber} selesai`}
                                >
                                  {isDone ? '✓' : '○'}
                                </button>
                                <div>
                                  <h4 className="chapter-title">Bab {ch.chapterNumber}: {ch.title}</h4>
                                  <span className="chapter-meta">⏱️ {ch.duration} • Tingkat: {ch.difficulty}</span>
                                </div>
                              </div>
                              <span className="accordion-chevron">{isCollapsed ? '▼' : '▲'}</span>
                            </div>

                            {!isCollapsed && (
                              <div className="chapter-body">
                                <p className="chapter-summary">{ch.summary}</p>
                                <div className="lessons-list">
                                  {ch.lessons?.map((ls) => (
                                    <div key={ls.id} className="lesson-item">
                                      <span className="lesson-type-badge">
                                        {ls.type === 'interactive' ? '🧩 Interaktif' : (ls.type === 'video' ? '📺 Video' : '📝 Kuis')}
                                      </span>
                                      <span className="lesson-title">{ls.title}</span>
                                      <span className="lesson-duration">{ls.duration}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* TAB 3: INTERACTIVE MODULES & SUMMARY */}
                {activeDetailTab === 'modules' && (
                  <div className="detail-tab-content">
                    <h3 className="content-heading">Modul Interaktif & Flashcard Ringkasan</h3>
                    <p className="content-subtext">Kartu rangkuman formula dan kaidah cepat untuk memudahkan pemahamanmu:</p>
                    <div className="modules-cards-grid">
                      {activeClassDetail.interactiveModules?.map((mod) => (
                        <div key={mod.id} className="interactive-module-card">
                          <h4 className="mod-card-title">📌 {mod.title}</h4>
                          <p className="mod-card-content">{mod.content}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* TAB 4: MINI QUIZ PREVIEW */}
                {activeDetailTab === 'quiz' && (
                  <div className="detail-tab-content">
                    <div className="quiz-header">
                      <div>
                        <h3 className="content-heading">⚡ Latihan Kilat (Mini-Quiz Preview)</h3>
                        <p className="content-subtext">Uji pemahaman dasarmu langsung di halaman ini sebelum bermain game:</p>
                      </div>
                      {quizSubmitted && (
                        <button type="button" className="btn-quiz-reset" onClick={handleResetQuiz}>
                          Ulangi Kuis
                        </button>
                      )}
                    </div>

                    <div className="quiz-questions-list">
                      {activeClassDetail.miniQuiz?.map((q, qIndex) => {
                        const selectedAnswer = quizAnswers[q.id];
                        const isCorrect = selectedAnswer === q.correct;

                        return (
                          <div key={q.id} className="quiz-card">
                            <span className="question-number">Pertanyaan {qIndex + 1}</span>
                            <h4 className="question-text">{q.question}</h4>

                            <div className="quiz-options-list">
                              {q.options.map((opt, optIndex) => {
                                const isOptSelected = selectedAnswer === opt;
                                let optionClass = 'quiz-opt-btn';

                                if (isOptSelected) optionClass += ' selected';
                                if (quizSubmitted) {
                                  if (opt === q.correct) optionClass += ' correct';
                                  else if (isOptSelected) optionClass += ' incorrect';
                                }

                                return (
                                  <button
                                    key={optIndex}
                                    type="button"
                                    className={optionClass}
                                    onClick={() => handleSelectQuizAnswer(q.id, opt)}
                                    disabled={quizSubmitted}
                                  >
                                    <span className="opt-marker">{String.fromCharCode(65 + optIndex)}.</span>
                                    <span>{opt}</span>
                                  </button>
                                );
                              })}
                            </div>

                            {quizSubmitted && (
                              <div className={`quiz-feedback-box ${isCorrect ? 'feedback-correct' : 'feedback-wrong'}`}>
                                <strong>{isCorrect ? '✅ Jawaban Benar!' : '❌ Jawaban Belum Tepat'}</strong>
                                <p className="quiz-explanation">{q.explanation}</p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {!quizSubmitted && activeClassDetail.miniQuiz?.length > 0 && (
                      <div className="quiz-submit-bar">
                        <button
                          type="button"
                          className="btn-quiz-submit"
                          onClick={handleGradeQuiz}
                          disabled={Object.keys(quizAnswers).length === 0}
                        >
                          Periksa Jawaban Kuis
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="detail-placeholder">
                <p>Pilih mata pelajaran di sebelah kiri untuk melihat deskripsi kurikulum lengkap.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default StudentClass;

