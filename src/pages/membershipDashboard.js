import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../component/Navbar';
import {
  cancelMembership,
  getAuthToken,
  getMembershipHistory,
  getMyMembership,
  retryPendingMembership
} from '../database/membershipApi';
import { auth, observeAuthState } from '../database/firebaseAuth';
import { getManualUser } from '../database/manualAuth';
import './membershipDashboard.css';

const FEATURE_LABELS = {
  extraAvatars: 'Kostum & avatar eksklusif',
  progressReport: 'Laporan perkembangan belajar',
  studentAnalytics: 'Analitik performa siswa',
  exportReport: 'Ekspor laporan nilai dan riwayat'
};

const readManualUser = () => {
  try {
    return getManualUser();
  } catch (error) {
    return null;
  }
};

const formatDate = (value, options = { dateStyle: 'long' }) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('id-ID', options).format(date);
};

const formatPrice = (value) => {
  const price = Number(value);
  if (!Number.isFinite(price) || price <= 0) return 'Gratis';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(price);
};

const formatRole = (role) => {
  const normalizedRole = String(role || '').toLowerCase();
  if (normalizedRole === 'guru') return 'Guru';
  if (normalizedRole === 'siswa') return 'Siswa';
  if (['admin', 'administrator'].includes(normalizedRole)) return 'Administrator';
  return role || 'Pengguna';
};

const getDaysRemaining = (expiresAt) => {
  if (!expiresAt) return null;
  const timestamp = new Date(expiresAt).getTime();
  if (Number.isNaN(timestamp)) return null;
  return Math.ceil((timestamp - Date.now()) / (24 * 60 * 60 * 1000));
};

const getFeatureItems = (features = {}) => {
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
    .map(([key, value]) => {
      if (key === 'maxCharacters') return { key, label: 'Slot karakter', value: `Hingga ${value} karakter` };
      if (key === 'maxClasses') return { key, label: 'Kapasitas kelas', value: `${value} kelas` };
      if (key === 'unlimited' && value === true) return { key, label: 'Akses platform', value: 'Tanpa batas' };
      return {
        key,
        label: FEATURE_LABELS[key] || key.replace(/([A-Z])/g, ' $1'),
        value: value === true ? 'Termasuk' : String(value)
      };
    });
};

const getStatusLabel = (status) => {
  if (status === 'active') return 'Aktif';
  if (status === 'pending') return 'Menunggu Pembayaran';
  if (status === 'cancelled') return 'Dibatalkan';
  return status || 'Tidak diketahui';
};

const MembershipDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [reloadKey, setReloadKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [membership, setMembership] = useState(null);
  const [pending, setPending] = useState(null);
  const [loadedAccountSignature, setLoadedAccountSignature] = useState('');
  const [history, setHistory] = useState([]);
  const [membershipError, setMembershipError] = useState('');
  const [historyError, setHistoryError] = useState('');
  const [notice, setNotice] = useState(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelError, setCancelError] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [retryingPayment, setRetryingPayment] = useState(false);
  const [paymentRetryError, setPaymentRetryError] = useState('');
  const cancelButtonRef = useRef(null);
  const accountSignature = [
    auth?.currentUser?.uid || auth?.currentUser?.email || 'anonymous',
    readManualUser()?.id || readManualUser()?.email || 'manual'
  ].join(':');
  const accountSignatureRef = useRef(accountSignature);
  accountSignatureRef.current = accountSignature;
  const firebaseAccountRef = useRef(auth?.currentUser?.uid || auth?.currentUser?.email || null);

  useEffect(() => {
    let isCurrent = true;

    const loadDashboard = async () => {
      setLoading(true);
      setMembershipError('');
      setHistoryError('');
      setPaymentRetryError('');
      setCancelError('');
      const requestAccountSignature = accountSignatureRef.current;

      try {
        const token = await getAuthToken();
        if (!isCurrent) return;
        setAuthenticated(Boolean(token));

        if (!token) {
          setMembership(null);
          setPending(null);
          setHistory([]);
          setLoadedAccountSignature(requestAccountSignature);
          setLoading(false);
          return;
        }

        const [membershipResult, historyResult] = await Promise.allSettled([
          getMyMembership(),
          getMembershipHistory()
        ]);
        if (!isCurrent || accountSignatureRef.current !== requestAccountSignature) return;

        if (membershipResult.status === 'fulfilled') {
          setMembership(membershipResult.value?.membership || null);
          setPending(membershipResult.value?.pending || null);
        } else {
          setMembershipError(membershipResult.reason?.message || 'Status membership gagal dimuat.');
        }

        if (historyResult.status === 'fulfilled') {
          setHistory(Array.isArray(historyResult.value?.history) ? historyResult.value.history : []);
        } else {
          setHistoryError(historyResult.reason?.message || 'Riwayat membership gagal dimuat.');
        }
        setLoadedAccountSignature(requestAccountSignature);
      } catch (error) {
        if (isCurrent) setMembershipError(error.message || 'Status membership gagal dimuat.');
      } finally {
        if (isCurrent) setLoading(false);
      }
    };

    loadDashboard();
    return () => {
      isCurrent = false;
    };
  }, [reloadKey]);

  useEffect(() => {
    if (new URLSearchParams(location.search).get('payment') !== 'returned') return;
    setNotice('Terima kasih. Status pembayaran sedang diperbarui dari Midtrans.');
    setReloadKey((value) => value + 1);
  }, [location.search]);

  useEffect(() => {
    const refreshForAccountChange = () => {
      setAuthenticated(false);
      setMembership(null);
      setPending(null);
      setHistory([]);
      setLoadedAccountSignature('');
      setNotice(null);
      setPaymentRetryError('');
      setMembershipError('');
      setHistoryError('');
      setLoading(true);
      setReloadKey((value) => value + 1);
    };

    window.addEventListener('gamukis-manual-auth-change', refreshForAccountChange);
    const unsubscribe = observeAuthState((user) => {
      const nextFirebaseAccount = user?.uid || user?.email || null;
      if (firebaseAccountRef.current === nextFirebaseAccount) return;
      firebaseAccountRef.current = nextFirebaseAccount;
      refreshForAccountChange();
    });
    return () => {
      window.removeEventListener('gamukis-manual-auth-change', refreshForAccountChange);
      unsubscribe?.();
    };
  }, []);

  useEffect(() => {
    if (showCancelDialog) cancelButtonRef.current?.focus();
  }, [showCancelDialog]);

  useEffect(() => {
    if (!showCancelDialog) return undefined;
    const handleEscape = (event) => {
      if (event.key === 'Escape' && !cancelling) setShowCancelDialog(false);
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [showCancelDialog, cancelling]);

  const activeUser = auth.currentUser && !auth.currentUser.isAnonymous
    ? auth.currentUser
    : readManualUser();
  const plan = membership?.plan;
  const source = membership?.source;
  const isAdministrator = source === 'administrator';
  const isPaidMembership = source === 'membership' && Number(plan?.price) > 0;
  const role = formatRole(plan?.audience || activeUser?.role);
  const displayName = activeUser?.displayName
    || activeUser?.username
    || activeUser?.email?.split('@')[0]
    || 'Pengguna';
  const features = getFeatureItems(membership?.features);
  const daysRemaining = getDaysRemaining(membership?.expiresAt);
  const planName = isAdministrator ? 'Administrator' : (plan?.name || 'Paket Gratis');

  const confirmCancellation = async () => {
    if (cancelling) return;
    setCancelling(true);
    setCancelError('');
    try {
      await cancelMembership();
      setShowCancelDialog(false);
      setNotice('Langganan berhasil dibatalkan. Akun Anda telah kembali ke paket gratis.');
      setReloadKey((value) => value + 1);
    } catch (error) {
      setCancelError(error.message || 'Pembatalan gagal. Silakan coba lagi.');
    } finally {
      setCancelling(false);
    }
  };

  const redirectToPaymentUrl = (paymentUrl) => {
    if (!paymentUrl || typeof window === 'undefined') return;
    try {
      if (typeof window.open === 'function') {
        window.open(paymentUrl, '_blank', 'noopener,noreferrer');
        return;
      }
      window.location.href = paymentUrl;
    } catch (error) {
      // Ignore navigation errors in test-only environments.
    }
  };

  const retryMembership = () => setReloadKey((value) => value + 1);

  const handlePendingRetry = async () => {
    if (retryingPayment || !pendingForCurrentAccount) return;
    const requestAccountSignature = accountSignatureRef.current;
    setRetryingPayment(true);
    setPaymentRetryError('');

    try {
      const response = await retryPendingMembership();
      if (accountSignatureRef.current !== requestAccountSignature) return;
      const paymentUrl = response?.paymentUrl || response?.payment_url;

      if (paymentUrl) {
        redirectToPaymentUrl(paymentUrl);
        setNotice('Anda dialihkan ke halaman pembayaran. Setelah selesai, status akan diperbarui secara otomatis.');
        return;
      }

      if (response?.status === 'pending') {
        setNotice('Pembayaran Anda masih menunggu konfirmasi. Silakan periksa status secara berkala.');
        setReloadKey((value) => value + 1);
        return;
      }

      throw new Error('URL pembayaran tidak tersedia untuk saat ini.');
    } catch (error) {
      if (accountSignatureRef.current !== requestAccountSignature) return;
      const message = error.message || 'Gagal melanjutkan pembayaran. Silakan coba lagi.';
      setPaymentRetryError(message);
      setNotice(null);
    } finally {
      setRetryingPayment(false);
    }
  };

  const pendingForCurrentAccount = loadedAccountSignature === accountSignature ? pending : null;

  return (
    <div className="membership-dashboard-page">
      <Navbar />
      <main className="membership-dashboard-main">
        {!authenticated && !loading ? (
          <section className="membership-dashboard-auth" aria-labelledby="membership-dashboard-auth-title">
            <span className="membership-dashboard-eyebrow">GAMUKIS MEMBERSHIP</span>
            <h1 id="membership-dashboard-auth-title">Membership belum tersedia</h1>
            <p>Masuk ke akun Gamukis untuk melihat status paket dan riwayat langganan Anda.</p>
            <button className="membership-dashboard-button membership-dashboard-button-primary" type="button" onClick={() => navigate('/login')}>
              Masuk ke akun
            </button>
          </section>
        ) : (
          <>
            <header className="membership-dashboard-hero">
              <div className="membership-dashboard-avatar" aria-hidden="true">
                {displayName.slice(0, 1).toUpperCase()}
              </div>
              <div className="membership-dashboard-hero-copy">
                <span className="membership-dashboard-eyebrow">Membership {role}</span>
                <h1>{loading ? 'Memuat membership...' : planName}</h1>
                <p>{displayName}</p>
                {!loading && (
                  <span className={`membership-status-pill ${isAdministrator ? 'membership-status-admin' : source === 'default' ? 'membership-status-default' : 'membership-status-active'}`}>
                    {isAdministrator ? 'Administrator' : source === 'default' ? 'Paket Dasar' : 'Aktif'}
                  </span>
                )}
              </div>
              <div className="membership-dashboard-hero-actions">
                {!isAdministrator && (
                  <button className="membership-dashboard-button membership-dashboard-button-light" type="button" onClick={() => navigate('/membership/plans')}>
                    Pilih Paket
                  </button>
                )}
                {isPaidMembership && (
                  <button className="membership-dashboard-button membership-dashboard-button-danger" type="button" onClick={() => {
                    setCancelError('');
                    setShowCancelDialog(true);
                  }}>
                    Batalkan Langganan
                  </button>
                )}
              </div>
              {!loading && (
                <div className="membership-dashboard-expiry">
                  {isAdministrator ? 'Akses administrator tanpa batas'
                    : membership?.expiresAt
                      ? `Berlaku hingga ${formatDate(membership.expiresAt)}`
                      : 'Masa aktif: Selamanya (Gratis)'}
                  {daysRemaining !== null && daysRemaining >= 0 && daysRemaining < 5 && (
                    <strong>Segera berakhir dalam {daysRemaining} hari</strong>
                  )}
                </div>
              )}
            </header>

            {notice && (
              <div className="membership-dashboard-toast" role="status" aria-live="polite">
                {notice}
                <button type="button" aria-label="Tutup pemberitahuan" onClick={() => setNotice(null)}>×</button>
              </div>
            )}

            {membershipError && (
              <div className="membership-dashboard-alert membership-dashboard-alert-error" role="alert">
                <span>{membershipError}</span>
                <button type="button" className="membership-dashboard-button membership-dashboard-button-secondary" onClick={retryMembership}>Coba lagi</button>
              </div>
            )}

            {paymentRetryError && (
              <div className="membership-dashboard-alert membership-dashboard-alert-error" role="alert">
                <span>{paymentRetryError}</span>
              </div>
            )}

            {pendingForCurrentAccount && (
              <aside className="membership-pending-notice" aria-labelledby="membership-pending-title">
                <div>
                  <span className="membership-dashboard-eyebrow">PEMBAYARAN</span>
                  <h2 id="membership-pending-title">Menunggu Konfirmasi Pembayaran</h2>
                  <p>
                    Anda memiliki pengajuan paket {pendingForCurrentAccount.plan?.name || 'membership'} pada {formatDate(pendingForCurrentAccount.createdAt)}.
                    {' '}Paket akan aktif otomatis setelah notifikasi pembayaran Midtrans berhasil diverifikasi.
                  </p>
                </div>
                <div className="membership-pending-actions">
                  <strong>ID Langganan: #{pendingForCurrentAccount.membershipId}</strong>
                  <button type="button" className="membership-dashboard-button membership-dashboard-button-secondary" onClick={handlePendingRetry} disabled={loading || retryingPayment || loadedAccountSignature !== accountSignature}>
                    {retryingPayment ? 'Mengalihkan…' : 'Lanjutkan pembayaran'}
                  </button>
                  <button type="button" className="membership-dashboard-button membership-dashboard-button-secondary" onClick={retryMembership} disabled={loading}>
                    {loading ? 'Memeriksa…' : 'Periksa status'}
                  </button>
                </div>
              </aside>
            )}

            <div className="membership-dashboard-content">
              <section className="membership-dashboard-panel" aria-labelledby="membership-benefits-title">
                <div className="membership-dashboard-panel-heading">
                  <div>
                    <span className="membership-dashboard-eyebrow">AKSES AKTIF</span>
                    <h2 id="membership-benefits-title">Fitur Paket Anda</h2>
                  </div>
                  {plan?.price > 0 && <span className="membership-dashboard-price">{formatPrice(plan.price)}</span>}
                </div>
                {loading ? (
                  <p className="membership-dashboard-muted">Memuat fitur paket...</p>
                ) : features.length ? (
                  <ul className="membership-feature-grid">
                    {features.map((feature) => (
                      <li key={feature.key}>
                        <span className="membership-feature-mark" aria-hidden="true">✓</span>
                        <span>{feature.label}</span>
                        <strong>{feature.value}</strong>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="membership-dashboard-muted">Informasi fitur paket belum tersedia.</p>
                )}
              </section>

              <section className="membership-dashboard-panel membership-history-panel" aria-labelledby="membership-history-title">
                <div className="membership-dashboard-panel-heading">
                  <div>
                    <span className="membership-dashboard-eyebrow">AKTIVITAS AKUN</span>
                    <h2 id="membership-history-title">Riwayat Membership</h2>
                  </div>
                  <button type="button" className="membership-dashboard-button membership-dashboard-button-secondary" onClick={retryMembership} disabled={loading}>
                    Muat ulang
                  </button>
                </div>
                {historyError ? (
                  <div className="membership-dashboard-alert membership-dashboard-alert-error" role="alert">
                    <span>{historyError}</span>
                    <button type="button" className="membership-dashboard-button membership-dashboard-button-secondary" onClick={retryMembership}>Coba lagi</button>
                  </div>
                ) : loading ? (
                  <p className="membership-dashboard-muted" role="status">Memuat riwayat...</p>
                ) : history.length === 0 ? (
                  <div className="membership-history-empty">
                    <span className="membership-history-empty-mark" aria-hidden="true">▤</span>
                    <h3>Belum Ada Riwayat</h3>
                    <p>Semua transaksi dan perubahan paket Anda akan tercatat di sini.</p>
                  </div>
                ) : (
                  <div className="membership-history-table-wrap">
                    <table className="membership-history-table">
                      <thead>
                        <tr>
                          <th scope="col">Tanggal Pengajuan</th>
                          <th scope="col">Paket</th>
                          <th scope="col">Harga</th>
                          <th scope="col">Masa Aktif</th>
                          <th scope="col">Status</th>
                          <th scope="col">No. Referensi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {history.map((item) => (
                          <tr key={item.id}>
                            <td data-label="Tanggal Pengajuan">{formatDate(item.created_at, { dateStyle: 'medium' })}</td>
                            <td data-label="Paket">{item.name || item.code}</td>
                            <td data-label="Harga">{formatPrice(item.price)}</td>
                            <td data-label="Masa Aktif">
                              {item.started_at ? formatDate(item.started_at, { dateStyle: 'medium' }) : '—'}
                              {item.expires_at ? ` – ${formatDate(item.expires_at, { dateStyle: 'medium' })}` : ''}
                            </td>
                            <td data-label="Status">
                              <span className={`membership-history-status membership-history-status-${item.status}`}>
                                {getStatusLabel(item.status)}
                              </span>
                            </td>
                            <td data-label="No. Referensi">{item.payment_ref || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </div>
          </>
        )}
      </main>

      {showCancelDialog && (
        <div
          className="membership-dashboard-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !cancelling) setShowCancelDialog(false);
          }}
        >
          <section
            className="membership-dashboard-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="membership-cancel-title"
            aria-describedby="membership-cancel-description"
          >
            <button
              ref={cancelButtonRef}
              type="button"
              className="membership-dashboard-modal-close"
              aria-label="Tutup dialog"
              disabled={cancelling}
              onClick={() => setShowCancelDialog(false)}
            >×</button>
            <span className="membership-dashboard-eyebrow">KONFIRMASI</span>
            <h2 id="membership-cancel-title">Batalkan Langganan?</h2>
            <p id="membership-cancel-description">
              Apakah Anda yakin ingin membatalkan langganan {plan?.name || 'ini'}? Akses ke fitur premium akan langsung dihentikan dan akun Anda akan kembali ke paket gratis.
            </p>
            {cancelError && <p className="membership-dashboard-modal-error" role="alert">{cancelError}</p>}
            <div className="membership-dashboard-modal-actions">
              <button type="button" className="membership-dashboard-button membership-dashboard-button-secondary" disabled={cancelling} onClick={() => setShowCancelDialog(false)}>
                Kembali
              </button>
              <button type="button" className="membership-dashboard-button membership-dashboard-button-danger-solid" disabled={cancelling} onClick={confirmCancellation}>
                {cancelling ? 'Memproses...' : 'Ya, Batalkan Langganan'}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

export default MembershipDashboard;
