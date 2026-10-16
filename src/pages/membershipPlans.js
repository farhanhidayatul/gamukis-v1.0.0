import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../component/Navbar';
import {
  getAuthToken,
  getMyMembership,
  getPlans,
  subscribePlan
} from '../database/membershipApi';
import './membershipPlans.css';

const FEATURE_LABELS = {
  maxCharacters: (value) => `Kapasitas hingga ${value} Karakter`,
  extraAvatars: () => 'Akses Kostum & Avatar Eksklusif',
  progressReport: () => 'Laporan Perkembangan Belajar',
  maxClasses: (value) => `Maksimal ${value} Kelas Belajar`,
  studentAnalytics: () => 'Analitik Performa Siswa Real-time',
  exportReport: () => 'Ekspor Laporan Nilai & Riwayat (PDF/Excel)'
};

const PREVIEW_PLANS = {
  siswa: [
    {
      code: 'siswa_free',
      name: 'Siswa Gratis',
      audience: 'siswa',
      price: 0,
      durationDays: null,
      features: { maxCharacters: 5 }
    },
    {
      code: 'siswa_premium',
      name: 'Siswa Premium',
      audience: 'siswa',
      price: 29000,
      durationDays: 30,
      features: { maxCharacters: 10, extraAvatars: true, progressReport: true }
    }
  ],
  guru: [
    {
      code: 'guru_free',
      name: 'Guru Gratis',
      audience: 'guru',
      price: 0,
      durationDays: null,
      features: { maxClasses: 1 }
    },
    {
      code: 'guru_pro',
      name: 'Guru Pro',
      audience: 'guru',
      price: 99000,
      durationDays: 30,
      features: { maxClasses: 20, studentAnalytics: true, exportReport: true }
    }
  ]
};

const formatPrice = (price) => {
  const numericPrice = Number(price);
  if (!Number.isFinite(numericPrice) || numericPrice <= 0) return 'Gratis';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(numericPrice);
};

const formatDuration = (durationDays) => {
  if (!durationDays) return '/ Selamanya';
  return `/ ${durationDays} Hari`;
};

const formatFeatureName = (name) => name
  .replace(/([A-Z])/g, ' $1')
  .replace(/^./, (letter) => letter.toUpperCase());

const getFeatureItems = (features) => {
  let parsedFeatures = features;
  if (typeof parsedFeatures === 'string') {
    try {
      parsedFeatures = JSON.parse(parsedFeatures);
    } catch (error) {
      parsedFeatures = {};
    }
  }

  if (!parsedFeatures || typeof parsedFeatures !== 'object' || Array.isArray(parsedFeatures)) return [];

  return Object.entries(parsedFeatures)
    .filter(([, value]) => value !== false && value !== null && value !== undefined)
    .map(([name, value]) => ({
      key: name,
      label: FEATURE_LABELS[name]
        ? FEATURE_LABELS[name](value)
        : (value === true ? formatFeatureName(name) : `${formatFeatureName(name)}: ${value}`)
    }));
};

const MembershipPlans = () => {
  const navigate = useNavigate();
  const [reloadKey, setReloadKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [previewRole, setPreviewRole] = useState('siswa');
  const [plans, setPlans] = useState([]);
  const [membership, setMembership] = useState(null);
  const [pending, setPending] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [membershipError, setMembershipError] = useState('');
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [modalError, setModalError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const modalCloseRef = useRef(null);
  const navigationTimer = useRef(null);

  useEffect(() => {
    let isCurrent = true;

    const loadPlansPage = async () => {
      setLoading(true);
      setLoadError('');
      setMembershipError('');

      try {
        const token = await getAuthToken();
        if (!isCurrent) return;
        setAuthenticated(Boolean(token));

        if (!token) {
          setPlans([]);
          setMembership(null);
          setPending(null);
          setLoading(false);
          return;
        }

        const [plansResult, membershipResult] = await Promise.allSettled([
          getPlans(),
          getMyMembership()
        ]);
        if (!isCurrent) return;

        if (plansResult.status === 'fulfilled') {
          const plansData = plansResult.value?.plans || plansResult.value || [];
          setPlans(Array.isArray(plansData) ? plansData : []);
        } else {
          setLoadError(plansResult.reason?.message || 'Gagal memuat paket membership.');
        }

        if (membershipResult.status === 'fulfilled') {
          setMembership(membershipResult.value?.membership || null);
          setPending(membershipResult.value?.pending || null);
        } else {
          setMembershipError(membershipResult.reason?.message || 'Status membership belum dapat dimuat.');
        }
      } catch (error) {
        if (isCurrent) {
          setLoadError(error.message || 'Gagal memuat paket membership.');
        }
      } finally {
        if (isCurrent) setLoading(false);
      }
    };

    loadPlansPage();
    return () => {
      isCurrent = false;
    };
  }, [reloadKey]);

  useEffect(() => {
    if (selectedPlan) {
      modalCloseRef.current?.focus();
    }
  }, [selectedPlan]);

  useEffect(() => () => {
    if (navigationTimer.current) window.clearTimeout(navigationTimer.current);
  }, []);

  useEffect(() => {
    if (!selectedPlan) return undefined;
    const handleEscape = (event) => {
      if (event.key === 'Escape' && !submitting) setSelectedPlan(null);
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [selectedPlan, submitting]);

  const isAdministrator = membership?.source === 'administrator';
  const currentPlanCode = membership?.plan?.code;
  const visiblePlans = authenticated ? plans : PREVIEW_PLANS[previewRole];

  const openPlanAction = (plan) => {
    if (!authenticated) {
      navigate('/login');
      return;
    }
    if (pending?.plan?.code === plan.code) {
      navigate('/membership/dashboard');
      return;
    }
    if (isAdministrator || currentPlanCode === plan.code || loading || membershipError) return;
    setModalError('');
    setSelectedPlan(plan);
  };

  const confirmSubscription = async () => {
    if (!selectedPlan || submitting) return;
    setSubmitting(true);
    setModalError('');

    try {
      const result = await subscribePlan(selectedPlan.code);
      const isPending = result.status === 'pending';
      const planName = selectedPlan.name;
      if (isPending && result.paymentUrl) {
        window.location.assign(result.paymentUrl);
        return;
      }
      setSelectedPlan(null);
      setFeedback({
        type: isPending ? 'pending' : 'success',
        message: isPending
          ? 'Pesanan dibuat, tetapi tautan pembayaran belum tersedia. Periksa dashboard atau coba lagi.'
          : `Paket ${planName} berhasil diaktifkan!`
      });
      navigationTimer.current = window.setTimeout(() => {
        navigate('/membership/dashboard');
      }, 1500);
    } catch (error) {
      setModalError(error.message || 'Langganan belum dapat diproses. Silakan coba lagi.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="membership-plans-page">
      <Navbar />
      <main className="membership-plans-main">
        <div className="membership-plans-shell">
          <header className="membership-plans-heading">
            <p className="membership-eyebrow">GAMUKIS MEMBERSHIP</p>
            <h1>Pilih Paket Belajarmu</h1>
            <p className="membership-intro">Temukan fitur dan petualangan terbaik yang sesuai untuk kebutuhan belajar dan mengajarmu.</p>
          </header>

          {!authenticated && (
            <section className="membership-login-notice" aria-label="Masuk untuk berlangganan">
              <div>
                <h2>Lihat paket untuk peranmu</h2>
                <p>Masuk untuk memilih paket yang sesuai dengan akun Anda.</p>
              </div>
              <button
                className="membership-button membership-button-primary"
                type="button"
                onClick={() => navigate('/login')}
              >
                Masuk untuk berlangganan
              </button>
            </section>
          )}

          {!authenticated && (
            <div className="membership-role-tabs" role="group" aria-label="Pratinjau paket berdasarkan peran">
              {[
                { id: 'siswa', label: 'Untuk Siswa' },
                { id: 'guru', label: 'Untuk Guru' }
              ].map((role) => (
                <button
                  key={role.id}
                  type="button"
                  className={previewRole === role.id ? 'selected' : ''}
                  aria-pressed={previewRole === role.id}
                  onClick={() => setPreviewRole(role.id)}
                >
                  {role.label}
                </button>
              ))}
            </div>
          )}

          {isAdministrator && (
            <aside className="membership-admin-notice" role="status">
              <strong>Akses administrator tanpa batas.</strong> Akun administrator tidak memerlukan membership.
            </aside>
          )}

          {membershipError && authenticated && (
            <div className="membership-inline-notice membership-inline-notice-warning" role="status">
              {membershipError} Status paket tidak dapat dipastikan; coba muat ulang sebelum memilih paket.
            </div>
          )}

          {feedback && (
            <div className={`membership-toast membership-toast-${feedback.type}`} role="status" aria-live="polite">
              <div className="membership-toast-content">
                <span className="membership-toast-icon" aria-hidden="true">
                  {feedback.type === 'success' ? '✓' : '⏱'}
                </span>
                <span className="membership-toast-message">{feedback.message}</span>
                <button
                  type="button"
                  className="membership-toast-link"
                  onClick={() => {
                    if (navigationTimer.current) window.clearTimeout(navigationTimer.current);
                    navigate('/membership/dashboard');
                  }}
                >
                  Lihat Dashboard →
                </button>
              </div>
              <button
                type="button"
                className="membership-toast-close"
                aria-label="Tutup pemberitahuan"
                onClick={() => {
                  if (navigationTimer.current) window.clearTimeout(navigationTimer.current);
                  setFeedback(null);
                }}
              >
                ×
              </button>
            </div>
          )}

          {loading && authenticated ? (
            <div className="membership-loading" role="status">Memuat paket membership...</div>
          ) : loadError ? (
            <div className="membership-error-state" role="alert">
              <p>{loadError}</p>
              <button
                type="button"
                className="membership-button membership-button-secondary"
                onClick={() => setReloadKey((value) => value + 1)}
              >
                Coba lagi
              </button>
            </div>
          ) : (
            <section className="membership-plan-grid" aria-label="Daftar paket membership">
              {visiblePlans.map((plan) => {
                const isCurrentPlan = authenticated && currentPlanCode === plan.code;
                const isPendingPlan = authenticated && pending?.plan?.code === plan.code;
                const featureItems = getFeatureItems(plan.features);

                return (
                  <article
                    className={`membership-plan-card ${plan.price > 0 ? 'membership-plan-card-featured' : ''}`}
                    key={plan.code}
                  >
                    <div className="membership-plan-card-topline">
                      <span className="membership-audience-badge">
                        {plan.audience === 'guru' ? 'Guru' : 'Siswa'}
                      </span>
                      {plan.price > 0 && (
                        <span className="membership-popular-badge">POPULER</span>
                      )}
                    </div>
                    <h2>{plan.name}</h2>
                    <div className="membership-price">
                      <strong>{formatPrice(plan.price)}</strong>
                      <span>{formatDuration(plan.durationDays)}</span>
                    </div>
                    <ul className="membership-feature-list">
                      {featureItems.length ? featureItems.map((feature) => (
                        <li key={feature.key}>
                          <span className="membership-feature-check" aria-hidden="true">✓</span>
                          <span>{feature.label}</span>
                        </li>
                      )) : (
                        <li>
                          <span className="membership-feature-check" aria-hidden="true">✓</span>
                          <span>Fitur belajar dasar</span>
                        </li>
                      )}
                    </ul>
                    {isCurrentPlan && (
                      <span className="membership-current-badge">● Paket Aktif</span>
                    )}
                    {isPendingPlan && (
                      <span className="membership-pending-badge">● Menunggu Pembayaran</span>
                    )}
                    <button
                      type="button"
                      className={`membership-button ${
                        isCurrentPlan
                          ? 'membership-button-current'
                          : plan.price > 0
                            ? 'membership-button-primary'
                            : 'membership-button-secondary'
                      }`}
                      disabled={isCurrentPlan || isAdministrator || (authenticated && (loading || Boolean(membershipError)))}
                      onClick={() => openPlanAction(plan)}
                    >
                      {isCurrentPlan
                        ? 'Paket Aktif Saat Ini'
                        : isAdministrator
                          ? 'Akses Administrator'
                          : isPendingPlan
                            ? 'Menunggu Pembayaran'
                            : !authenticated
                              ? 'Masuk untuk memilih'
                              : plan.price > 0 && membership?.plan?.price === 0
                                ? 'Tingkatkan'
                                : 'Pilih Paket'}
                    </button>
                  </article>
                );
              })}
              {!visiblePlans.length && (
                <div className="membership-empty-state">Belum ada paket yang tersedia.</div>
              )}
            </section>
          )}
        </div>

        {selectedPlan && (
          <div
            className="membership-modal-backdrop"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget && !submitting) setSelectedPlan(null);
            }}
          >
            <section
              className="membership-confirmation-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="membership-confirmation-title"
              aria-describedby="membership-confirmation-description"
            >
              <button
                ref={modalCloseRef}
                className="membership-modal-close"
                type="button"
                aria-label="Tutup dialog"
                disabled={submitting}
                onClick={() => setSelectedPlan(null)}
              >
                ×
              </button>
              <p className="membership-eyebrow">KONFIRMASI PILIHAN</p>
              <h2 id="membership-confirmation-title">Konfirmasi Berlangganan</h2>
              <p id="membership-confirmation-description">Pastikan detail paket pilihanmu sudah sesuai sebelum melanjutkan.</p>
              <div className="membership-modal-summary">
                <div>
                  <strong>{selectedPlan.name}</strong>
                  <span className="membership-modal-audience">
                    ({selectedPlan.audience === 'guru' ? 'Paket Guru' : 'Paket Siswa'})
                  </span>
                </div>
                <div className="membership-modal-pricing">
                  <span className="membership-modal-price">{formatPrice(selectedPlan.price)}</span>
                  <span className="membership-modal-duration">{formatDuration(selectedPlan.durationDays)}</span>
                </div>
              </div>
              {selectedPlan.price === 0 && membership?.plan?.price > 0 && (
                <p className="membership-downgrade-warning">
                  Paket berbayar Anda saat ini akan dibatalkan dan akun kembali ke paket gratis.
                </p>
              )}
              {selectedPlan.price > 0 && (
                <p className="membership-upgrade-note">
                  Anda akan diarahkan ke halaman pembayaran Midtrans. Membership aktif setelah pembayaran terverifikasi.
                </p>
              )}
              {modalError && (
                <p className="membership-modal-error" role="alert">{modalError}</p>
              )}
              <div className="membership-modal-actions">
                <button
                  type="button"
                  className="membership-button membership-button-secondary"
                  disabled={submitting}
                  onClick={() => setSelectedPlan(null)}
                >
                  Batal
                </button>
                <button
                  type="button"
                  className="membership-button membership-button-primary"
                  disabled={submitting}
                  onClick={confirmSubscription}
                >
                  {submitting ? 'Memproses...' : 'Konfirmasi & Lanjutkan'}
                </button>
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
};

export default MembershipPlans;
