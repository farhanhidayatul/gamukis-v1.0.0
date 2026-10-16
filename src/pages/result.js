import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { auth, onAuthStateChanged } from '../database/firebaseAuth';
import { getAnswers } from '../database/firebaseDatabase';
import { getManualUser } from '../database/manualAuth';
import AccuracySection from '../component/component_result/accuracySection';
import AnswerList from '../component/component_result/answerList';
import RankSection from '../component/component_result/rankSelection';
import ScoreBox from '../component/component_result/scoreBox';
import SubjectSection from '../component/component_result/subjectSelection';
import PerformanceSummary from '../component/component_result/molecules/PerformanceSummary';
import LeaderboardSection from '../component/component_result/LeaderboardSection';
import { fetchUserGameStats, recordGameScore } from '../database/leaderboardData';
import { calculateMatchExp } from '../utils/expRankSystem';
import './result.css';

const Result = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const backupData = (() => {
    if (typeof window === 'undefined') return {};
    try {
      return JSON.parse(window.sessionStorage.getItem('gamukis_last_game_result') || '{}');
    } catch (e) {
      return {};
    }
  })();

  const rawSessionAnswers = (Array.isArray(location.state?.sessionAnswers) && location.state.sessionAnswers.length > 0)
    ? location.state.sessionAnswers
    : (Array.isArray(backupData.sessionAnswers) ? backupData.sessionAnswers : []);

  const [correctAnswers, setCorrectAnswers] = useState(() => (
    rawSessionAnswers.filter((a) => a.correct)
  ));
  const [incorrectAnswers, setIncorrectAnswers] = useState(() => (
    rawSessionAnswers.filter((a) => !a.correct)
  ));
  const [resultUserName, setResultUserName] = useState('');

  const [activeUser, setActiveUser] = useState(() => {
    const manualUser = getManualUser();
    const fbUser = auth?.currentUser;
    return (fbUser && !fbUser.isAnonymous ? fbUser : null) || manualUser;
  });

  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    if (typeof window === 'undefined') return false;
    if (location.state?.isGuest !== undefined) {
      return !location.state.isGuest;
    }
    if (location.state?.isLoggedIn !== undefined) {
      return Boolean(location.state.isLoggedIn);
    }
    const manualUser = getManualUser();
    const fbUser = auth?.currentUser;
    return Boolean((fbUser && !fbUser.isAnonymous) || manualUser);
  });

  const coins = Math.max(0, Number(location.state?.coins ?? backupData.coins ?? 0) || 0);
  const botKills = Math.max(0, Number(location.state?.botKills ?? backupData.botKills ?? 0) || 0);
  const playerKills = Math.max(0, Number(location.state?.playerKills ?? backupData.playerKills ?? 0) || 0);
  const totalCourseQuestions = Math.max(1, Number(location.state?.allQuestion ?? backupData.allQuestion ?? 25) || 25);
  const activeSubject = location.state?.subject || location.state?.selectedCard?.title || backupData.subject || 'Biologi';

  // Purge in-game cache on mount and handle back navigation (popstate)
  useEffect(() => {
    const purgeInGameCaches = () => {
      if (typeof window === 'undefined') return;
      try {
        window.localStorage.removeItem('gamukis_anonymous_game_session');
        window.localStorage.removeItem('gamukis_registered_game_session');
        window.sessionStorage.removeItem('gamukis_game_session_id');
      } catch (e) {}
    };

    purgeInGameCaches();

    const handlePopState = () => {
      purgeInGameCaches();
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  useEffect(() => {
    let active = true;
    let requestVersion = 0;

    const updateAuthStatus = (user) => {
      const manualUser = getManualUser();
      const currentActive = (user && !user.isAnonymous ? user : null) || manualUser;
      setActiveUser(currentActive);
      if (location.state?.isGuest !== undefined) {
        setIsLoggedIn(!location.state.isGuest);
      } else if (location.state?.isLoggedIn !== undefined) {
        setIsLoggedIn(Boolean(location.state.isLoggedIn));
      } else {
        const authenticated = Boolean(currentActive);
        setIsLoggedIn(authenticated);
      }
    };

    const fetchAnswers = (user) => {
      updateAuthStatus(user);
      const manualUser = getManualUser();
      const currentActive = (user && !user.isAnonymous ? user : null) || manualUser;
      const currentPlayerId = user?.isAnonymous && manualUser?.id
        ? `manual_${manualUser.id}`
        : (user?.uid || (manualUser?.id ? `manual_${manualUser.id}` : null));
      const sessionId = sessionStorage.getItem('gamukis_game_session_id') || backupData.sessionId;
      const displayName = currentActive?.displayName?.trim()
        || currentActive?.username?.trim()
        || currentActive?.email?.split('@')[0]
        || (currentActive ? 'Pengguna' : 'Tamu');

      setResultUserName(displayName);

      if (!currentPlayerId) {
        return;
      }

      const currentRequest = ++requestVersion;
      const answersPromise = getAnswers(`${currentPlayerId}:${sessionId || 'legacy'}`);
      if (answersPromise && typeof answersPromise.then === 'function') {
        answersPromise.then((data) => {
          if (!active || currentRequest !== requestVersion) return;
          const answers = Object.values(data || {});
          if (answers.length > 0) {
            setCorrectAnswers(answers.filter((answer) => answer.correct));
            setIncorrectAnswers(answers.filter((answer) => !answer.correct));
          }
        }).catch((error) => console.error("Error fetching answers:", error));
      }
    };

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      fetchAnswers(user);
    });
    const handleManualAuthChange = () => fetchAnswers(auth.currentUser);
    window.addEventListener('gamukis-manual-auth-change', handleManualAuthChange);

    return () => {
      active = false;
      unsubscribeAuth();
      window.removeEventListener('gamukis-manual-auth-change', handleManualAuthChange);
    }; 
  }, [backupData.sessionId, location.state]);

  const totalAnswers = correctAnswers.length + incorrectAnswers.length;

  // Rumus Kotak Kuning (Nilai Akademik Kuis):
  // n = 100 : totalCourseQuestions (misal jika 25, maka n = 4)
  // hasil = (benar - salah) x n
  // jika dijawab semua dan benar semua (25 benar, 0 salah) = 25 x 4 = 100.
  const nValue = parseFloat((100 / totalCourseQuestions).toFixed(2));
  const netCorrect = correctAnswers.length - incorrectAnswers.length;
  const academicScore = Math.max(0, Math.min(100, Math.round(netCorrect * nValue)));

  // Rumus Kotak Pink (Skor Pertandingan Gamifikasi):
  // koin x 5 + kill bot x 15 + kill player x 30
  const gameScore = (coins * 5) + (botKills * 15) + (playerKills * 30);

  // Kotak Ungu Muda (Akurasi):
  // persentase akurasi jawaban benar siswa (%)
  const accuracy = totalAnswers > 0 ? (correctAnswers.length / totalAnswers) * 100 : 0;
  const clippedAccuracy = Math.max(0, Math.min(accuracy, 100));
  const badgePos = Math.max(3, Math.min(clippedAccuracy, 97));

  // Hitung perolehan EXP pertandingan dan akumulasi EXP pemain
  const earnedMatchExp = calculateMatchExp({
    coins,
    botKills,
    playerKills,
    academicScore,
    accuracy: clippedAccuracy,
    correctAnswers: correctAnswers.length
  });

  const [userExpData, setUserExpData] = useState(() => {
    if (typeof window === 'undefined') {
      return { previousExp: 1750, currentExp: 1750 + earnedMatchExp };
    }
    try {
      const manualUser = getManualUser();
      const fbUser = auth?.currentUser;
      const account = (fbUser && !fbUser.isAnonymous ? fbUser : null) || manualUser;
      const userId = account?.uid || account?.id;
      if (!userId || location.state?.isGuest) {
        return { previousExp: 1750, currentExp: 1750 + earnedMatchExp };
      }
      const expKey = `gamukis_user_exp_${userId}`;
      const stored = window.localStorage.getItem(expKey) || window.localStorage.getItem('gamukis_user_accumulated_exp');
      if (stored !== null) {
        const prev = Math.max(0, parseInt(stored, 10) || 0);
        const curr = prev + earnedMatchExp;
        window.localStorage.setItem(expKey, String(curr));
        window.localStorage.setItem('gamukis_user_accumulated_exp', String(curr));
        return { previousExp: prev, currentExp: curr };
      }
      return { previousExp: 1750, currentExp: 1750 + earnedMatchExp };
    } catch (e) {
      return { previousExp: 1750, currentExp: 1750 + earnedMatchExp };
    }
  });

  const userExpDataRef = useRef(userExpData);
  userExpDataRef.current = userExpData;

  // Sinkronisasi dengan data pencapaian yang ada di fitur Home
  const hasRecordedRef = useRef(false);

  useEffect(() => {
    let isCurrent = true;
    if (!isLoggedIn || location.state?.isGuest) return;

    const manualUser = getManualUser();
    const fbUser = auth?.currentUser;
    const account = activeUser || (fbUser && !fbUser.isAnonymous ? fbUser : null) || manualUser;

    if (!account) return;
    const userId = account.uid || account.id;
    if (!userId) return;

    // Catat hasil game dan perolehan EXP ke backend jika belum tercatat untuk sesi ini
    const sessionId = sessionStorage.getItem('gamukis_game_session_id') || backupData.sessionId;
    const recordSessionKey = `gamukis_match_recorded_${sessionId || 'default'}`;
    const alreadyRecorded = typeof window !== 'undefined' && window.sessionStorage?.getItem(recordSessionKey);

    if (!hasRecordedRef.current && !alreadyRecorded) {
      hasRecordedRef.current = true;
      if (typeof window !== 'undefined') {
        try { window.sessionStorage.setItem(recordSessionKey, 'true'); } catch (e) {}
      }
      const recordPromise = recordGameScore({
        score: gameScore,
        coins,
        accuracy: clippedAccuracy,
        timeRemaining: 0,
        userId,
        username: account.displayName || account.username || resultUserName || 'Pemain',
        exp: earnedMatchExp,
        totalExp: userExpDataRef.current.currentExp,
        botKills,
        playerKills,
        correctAnswers: correctAnswers.length
      });
      if (recordPromise && typeof recordPromise.catch === 'function') {
        recordPromise.catch((err) => console.warn('Leaderboard score record warning:', err.message));
      }
    }

    const statsPromise = fetchUserGameStats(userId);
    if (statsPromise && typeof statsPromise.then === 'function') {
      statsPromise
        .then((stats) => {
          if (!isCurrent || !stats) return;
          const rawExp = stats.totalExp !== undefined && stats.totalExp !== null
            ? Number(stats.totalExp)
            : ((Number(stats.totalScore) || 0) + (Number(stats.totalCoins) ? Number(stats.totalCoins) * 5 : 0));
          if (!isNaN(rawExp) && rawExp >= 0) {
            const expKey = `gamukis_user_exp_${userId}`;
            const prev = rawExp;
            const curr = prev + earnedMatchExp;

            setUserExpData({ previousExp: prev, currentExp: curr });
            try {
              window.localStorage.setItem(expKey, String(curr));
              window.localStorage.setItem('gamukis_user_accumulated_exp', String(curr));
              if (typeof window.dispatchEvent === 'function') {
                window.dispatchEvent(new CustomEvent('gamukis-exp-updated', { detail: { userId, exp: curr } }));
              }
            } catch (e) {}
          }
        })
        .catch(() => {});
    }

    return () => {
      isCurrent = false;
    };
  }, [activeUser, isLoggedIn, earnedMatchExp, location.state?.isGuest]);

  // Review Soal & Jawaban
  const allAnswers = [
    ...correctAnswers.map((answer) => ({ ...answer, _status: 'correct' })),
    ...incorrectAnswers.map((answer) => ({ ...answer, _status: 'incorrect' }))
  ];

  const handlePlayAgain = () => {
    if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem('gamukis_game_session_id');
      window.sessionStorage.removeItem('gamukis_last_game_result');
      try {
        window.localStorage.removeItem('gamukis_anonymous_game_session');
        window.localStorage.removeItem('gamukis_registered_game_session');
      } catch (e) {}
    }
    navigate('/gamePage', {
      replace: true,
      state: {
        resetSession: true,
        selectedCard: location.state?.selectedCard || null,
        subject: location.state?.subject || null
      }
    });
  };

  const handleGoHome = () => {
    if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem('gamukis_game_session_id');
      window.sessionStorage.removeItem('gamukis_last_game_result');
      try {
        window.localStorage.removeItem('gamukis_anonymous_game_session');
        window.localStorage.removeItem('gamukis_registered_game_session');
      } catch (e) {}
    }
    navigate('/home', { replace: true });
  };

  return (
    <div className="result-container">
      <h1>WOW GGWP!! Selamat ya</h1>
      <div className="score-pill"></div>
      <p className="subtitle">Hasil untuk <strong>{resultUserName || 'pengguna'}</strong></p>
      <div className="result-content">
        <div className="top-row">
          <RankSection
            score={academicScore}
            gameScore={gameScore}
            coins={coins}
            botKills={botKills}
            playerKills={playerKills}
            accuracy={clippedAccuracy}
            correctAnswers={correctAnswers.length}
            previousExp={userExpData.previousExp}
            currentExp={userExpData.currentExp}
            gainedExp={earnedMatchExp}
            isLoggedIn={isLoggedIn}
            isGuest={!isLoggedIn}
            onLoginClick={() => navigate('/login')}
          />
          <SubjectSection subject={activeSubject} totalQuestions={totalCourseQuestions} />
        </div>

        <AccuracySection accuracy={clippedAccuracy} badgePosition={badgePos} />

        <div className="bottom-row">
          <PerformanceSummary correct={correctAnswers.length} incorrect={incorrectAnswers.length} />
          <ScoreBox
            score={academicScore}
            totalQuestions={totalCourseQuestions}
            correct={correctAnswers.length}
            incorrect={incorrectAnswers.length}
            nValue={nValue}
          />
        </div>

        <LeaderboardSection currentUserName={resultUserName} />
      </div>

      <AnswerList answers={allAnswers} />

      <nav className="result-actions" aria-label="Navigasi hasil permainan">
        <button type="button" className="result-action result-action-home" onClick={handleGoHome}>
          Kembali ke Home &amp; Keluar dari Lobby
        </button>
        <button
          type="button"
          className="result-action result-action-replay"
          onClick={handlePlayAgain}
        >
          Bermain lagi?
        </button>
      </nav>
    </div>
  );
};

export default Result;









