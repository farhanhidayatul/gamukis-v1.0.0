import React, { useEffect, useState } from 'react';
import { fetchAllAchievements, fetchMyAchievements } from '../../database/achievementData';

const ProfileAchievements = ({ user }) => {
  const [allBadges, setAllBadges] = useState([]);
  const [unlockedBadges, setUnlockedBadges] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const userId = user?.id || user?.userId || user?.uid || null;

    Promise.all([
      fetchAllAchievements().catch(() => []),
      fetchMyAchievements(userId).catch(() => [])
    ]).then(([allList, myList]) => {
      if (!active) return;
      setAllBadges(allList || []);
      setUnlockedBadges(myList || []);
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [user]);

  const unlockedMap = new Map();
  unlockedBadges.forEach((b) => {
    unlockedMap.set(b.id, b);
  });

  const catalog = allBadges.length > 0 ? allBadges : [
    { id: 'first_game', name: 'Pemain Pemula', description: 'Menyelesaikan permainan pertama Anda.', icon: '🎮' },
    { id: 'coin_collector', name: 'Kolektor Koin', description: 'Mengumpulkan setidaknya 30 koin dalam satu sesi.', icon: '🪙' },
    { id: 'sharp_shooter', name: 'Penembak Jitu', description: 'Menjawab semua soal dengan akurasi 100%.', icon: '🎯' },
    { id: 'speed_demon', name: 'Iblis Kecepatan', description: 'Menyelesaikan permainan dengan sisa waktu > 60s.', icon: '⚡' },
    { id: 'high_scorer', name: 'Bintang Prestasi', description: 'Mencapai skor 100 poin atau lebih dalam satu sesi.', icon: '⭐' }
  ];

  return (
    <section className="profile-achievements profile-panel" data-testid="profile-achievements">
      <div className="profile-panel-heading">
        <div>
          <span className="profile-eyebrow">Prestasi &amp; Lencana</span>
          <h2>Lencana Pencapaian</h2>
        </div>
        <span className="profile-badge-count">
          {unlockedBadges.length} / {catalog.length} Terbuka
        </span>
      </div>

      {loading ? (
        <p className="profile-achievements-loading">Memuat lencana...</p>
      ) : (
        <div className="achievements-grid">
          {catalog.map((badge) => {
            const isUnlocked = unlockedMap.has(badge.id);
            const userBadge = unlockedMap.get(badge.id);

            return (
              <div
                key={badge.id}
                className={`achievement-card ${isUnlocked ? 'unlocked' : 'locked'}`}
                data-testid={`achievement-badge-${badge.id}`}
              >
                <div className="achievement-icon-wrapper">
                  <span className="achievement-icon" role="img" aria-label={badge.name}>
                    {badge.icon || '🏅'}
                  </span>
                </div>
                <div className="achievement-details">
                  <h4 className="achievement-title">{badge.name}</h4>
                  <p className="achievement-desc">{badge.description}</p>
                  <span className="achievement-status">
                    {isUnlocked ? (
                      userBadge?.unlocked_at
                        ? `Diraih: ${new Date(userBadge.unlocked_at).toLocaleDateString('id-ID')}`
                        : 'Sudah Diraih'
                    ) : (
                      'Terkunci'
                    )}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default ProfileAchievements;
