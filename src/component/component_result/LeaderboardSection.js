import React, { useEffect, useState } from 'react';
import { fetchLeaderboard } from '../../database/leaderboardData';

const LeaderboardSection = ({ currentUserName = '' }) => {
  const [period, setPeriod] = useState('alltime');
  const [leaderboard, setLeaderboard] = useState([]);
  const [userRank, setUserRank] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');

    Promise.resolve(fetchLeaderboard(period, 10))
      .then((data) => {
        if (!active) return;
        setLeaderboard(data?.leaderboard || []);
        setUserRank(data?.userRank || null);
        setLoading(false);
      })
      .catch((err) => {
        if (!active) return;
        console.warn('Gagal mengambil leaderboard:', err.message);
        setError('Papan peringkat offline.');
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [period]);

  const getRankBadge = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  return (
    <div className="result-card leaderboard-card" data-testid="leaderboard-section">
      <div className="result-card-inner">
        <div className="leaderboard-header">
          <div>
            <h2 style={{ margin: 0 }}>🏆 Papan Peringkat Global</h2>
            <p className="leaderboard-subtitle">Pemain terbaik Gamukis</p>
          </div>
          <div className="leaderboard-tabs" role="tablist">
            <button
              type="button"
              className={`leaderboard-tab ${period === 'alltime' ? 'active' : ''}`}
              onClick={() => setPeriod('alltime')}
            >
              Sepanjang Masa
            </button>
            <button
              type="button"
              className={`leaderboard-tab ${period === 'weekly' ? 'active' : ''}`}
              onClick={() => setPeriod('weekly')}
            >
              Mingguan
            </button>
            <button
              type="button"
              className={`leaderboard-tab ${period === 'daily' ? 'active' : ''}`}
              onClick={() => setPeriod('daily')}
            >
              Harian
            </button>
          </div>
        </div>

        {userRank && (
          <div className="user-rank-highlight">
            <span>Peringkat Anda saat ini: <strong>#{userRank.rank}</strong> ({userRank.score} poin)</span>
          </div>
        )}

        {loading ? (
          <div className="leaderboard-loading">Memuat peringkat...</div>
        ) : error && leaderboard.length === 0 ? (
          <div className="leaderboard-empty">{error}</div>
        ) : leaderboard.length === 0 ? (
          <div className="leaderboard-empty">Belum ada skor tercatat untuk periode ini.</div>
        ) : (
          <div className="leaderboard-table-wrapper">
            <table className="leaderboard-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Pemain</th>
                  <th>Skor</th>
                  <th>Koin</th>
                  <th>Akurasi</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((item) => {
                  const isCurrent = currentUserName && item.username?.toLowerCase() === currentUserName.toLowerCase();
                  return (
                    <tr key={`${item.rank}-${item.userId || item.username}`} className={isCurrent ? 'row-current-user' : ''}>
                      <td className="rank-cell">
                        <span className="rank-medal">{getRankBadge(item.rank)}</span>
                      </td>
                      <td className="username-cell">
                        <strong>{item.username}</strong>
                        {isCurrent && <span className="you-pill">Anda</span>}
                      </td>
                      <td className="score-cell">{item.score}</td>
                      <td className="coins-cell">🪙 {item.coins}</td>
                      <td className="acc-cell">{Math.round(item.accuracy)}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default LeaderboardSection;
