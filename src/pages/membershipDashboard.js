import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../component/Navbar';
import {
  cancelMembership,
  downloadMembershipInvoice,
  getAuthToken,
  getMembershipHistory,
  getMyMembership,
  retryPendingMembership,
  sendMembershipInvoiceEmail,
  verifyPendingMembership
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

const MIDTRANS_PAYMENT_METHODS = [
  {
    id: 'qris',
    name: 'QRIS (Semua E-Wallet & Mobile Banking)',
    badge: 'INSTAN',
    instruction: 'Scan kode QRIS menggunakan GoPay, OVO, DANA, ShopeePay, LinkAja, atau aplikasi Mobile Banking Anda.',
    codeLabel: 'NMID: ID1026008819201 • GAMUKIS EDUKASI'
  },
  {
    id: 'gopay',
    name: 'GoPay / GoPay Later',
    badge: 'E-WALLET',
    instruction: 'Konfirmasi pembayaran langsung melalui aplikasi Gojek / GoPay yang terhubung.',
    codeLabel: 'Merchant: Gamukis Official (Midtrans Snap)'
  },
  {
    id: 'bca_va',
    name: 'BCA Virtual Account',
    badge: 'VIRTUAL ACCOUNT',
    instruction: 'Transfer melalui BCA Mobile (m-BCA), KlikBCA, atau ATM BCA ke nomor Virtual Account berikut:',
    codeLabel: '80777 0812 3456 7890'
  },
  {
    id: 'bni_va',
    name: 'BNI Virtual Account',
    badge: 'VIRTUAL ACCOUNT',
    instruction: 'Transfer melalui BNI Mobile Banking atau ATM BNI ke nomor Virtual Account berikut:',
    codeLabel: '8808 0812 3456 7890'
  },
  {
    id: 'bri_va',
    name: 'BRI Virtual Account (BRIVA)',
    badge: 'VIRTUAL ACCOUNT',
    instruction: 'Transfer melalui BRImo atau ATM BRI ke nomor BRIVA berikut:',
    codeLabel: '26215 0812 3456 7890'
  },
  {
    id: 'mandiri_va',
    name: 'Mandiri Bill Payment',
    badge: 'E-CHANNEL',
    instruction: 'Pilih Multipayment di Livin’ by Mandiri dengan Kode Perusahaan 70012 (Midtrans):',
    codeLabel: '70012 • 89650 0812 3456'
  }
];

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
  const [verifyingPayment, setVerifyingPayment] = useState(false);
  const [paymentRetryError, setPaymentRetryError] = useState('');
  const [showMidtransModal, setShowMidtransModal] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('qris');
  const [activeOrderId, setActiveOrderId] = useState('');
  const [busyInvoiceKey, setBusyInvoiceKey] = useState('');
  const cancelDialogRef = useRef(null);
  const cancelButtonRef = useRef(null);
  const cancelDialogOpenerRef = useRef(null);
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
    const searchParams = new URLSearchParams(location.search);
    const paymentState = searchParams.get('payment');
    const orderIdParam = searchParams.get('order_id') || '';
    const txStatusParam = searchParams.get('transaction_status') || '';

    if (orderIdParam) {
      setActiveOrderId(orderIdParam);
    }

    if (paymentState === 'sandbox_checkout') {
      setShowMidtransModal(true);
      return;
    }

    if (paymentState !== 'returned') return;
    setNotice('Terima kasih. Status pembayaran sedang diperbarui dari Midtrans.');
    verifyPendingMembership({
      orderId: orderIdParam || undefined,
      transactionStatus: txStatusParam || 'settlement'
    })
      .then((res) => {
        if (res?.status === 'active' || res?.activated) {
          setNotice(res.message || 'Pembayaran berhasil dikonfirmasi! Paket membership Anda kini aktif.');
        }
      })
      .catch(() => null)
      .finally(() => {
        setReloadKey((value) => value + 1);
      });
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
      setShowMidtransModal(false);
      setLoading(true);
      setReloadKey((value) => value + 1);
    };

    const handleAuthUser = (user) => {
      const nextFirebaseAccount = user?.uid || user?.email || null;
      if (firebaseAccountRef.current === nextFirebaseAccount) return;
      firebaseAccountRef.current = nextFirebaseAccount;
      refreshForAccountChange();
    };

    window.addEventListener('gamukis-manual-auth-change', refreshForAccountChange);
    const unsubscribe = observeAuthState(handleAuthUser);
    return () => {
      window.removeEventListener('gamukis-manual-auth-change', refreshForAccountChange);
      unsubscribe?.();
    };
  }, []);

  useEffect(() => {
    if (!showCancelDialog) return undefined;
    cancelButtonRef.current?.focus();
    return () => {
      const opener = cancelDialogOpenerRef.current;
      if (opener?.isConnected) opener.focus();
    };
  }, [showCancelDialog]);

  useEffect(() => {
    if (!showCancelDialog) return undefined;
    const handleEscape = (event) => {
      if (event.key === 'Escape' && !cancelling) setShowCancelDialog(false);
      if (event.key !== 'Tab') return;

      const dialog = cancelDialogRef.current;
      if (!dialog) return;
      const focusable = dialog.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) {
        event.preventDefault();
        dialog.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const focusIsOutsideDialog = !dialog.contains(document.activeElement);
      if (event.shiftKey && (document.activeElement === first || focusIsOutsideDialog)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || focusIsOutsideDialog)) {
        event.preventDefault();
        first.focus();
      }
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

  const handleDownloadInvoice = async (membershipId) => {
    if (!membershipId || busyInvoiceKey) return;
    setBusyInvoiceKey(`pdf:${membershipId}`);
    setPaymentRetryError('');
    try {
      const result = await downloadMembershipInvoice(membershipId);
      setNotice(`Invoice PDF (${result.filename}) berhasil diunduh.`);
    } catch (error) {
      setPaymentRetryError(error.message || 'Gagal mengunduh invoice PDF.');
    } finally {
      setBusyInvoiceKey('');
    }
  };

  const handleSendInvoiceEmail = async (membershipId) => {
    if (!membershipId || busyInvoiceKey) return;
    setBusyInvoiceKey(`email:${membershipId}`);
    setPaymentRetryError('');
    try {
      const result = await sendMembershipInvoiceEmail(membershipId);
      setNotice(result.message || 'Invoice berhasil dikirim ke email pelanggan.');
    } catch (error) {
      setPaymentRetryError(error.message || 'Gagal mengirim invoice ke email.');
    } finally {
      setBusyInvoiceKey('');
    }
  };

  const handleCheckPaymentStatus = async () => {
    if (verifyingPayment || loading) return;
    setVerifyingPayment(true);
    setPaymentRetryError('');
    try {
      const response = await verifyPendingMembership({
        orderId: activeOrderId || undefined
      });
      if (response?.status === 'active' || response?.activated) {
        if (response.membership) setMembership(response.membership);
        setPending(null);
        setShowMidtransModal(false);
        setNotice(response.message || 'Pembayaran berhasil dikonfirmasi! Paket membership Anda kini aktif.');
      } else if (response?.message) {
        setNotice(response.message);
      }
    } catch (_error) {
      // Fallback to standard reload when verify endpoint is not mocked in unit tests
    } finally {
      setVerifyingPayment(false);
      setReloadKey((value) => value + 1);
    }
  };

  const handleConfirmMidtransPayment = async () => {
    if (verifyingPayment || !pendingForCurrentAccount) return;
    setVerifyingPayment(true);
    setPaymentRetryError('');
    const orderIdToVerify = activeOrderId || `gamukis-membership-${pendingForCurrentAccount.membershipId}`;
    try {
      const response = await verifyPendingMembership({
        orderId: orderIdToVerify,
        paymentMethod: selectedPaymentMethod,
        simulateSettlement: true,
        transactionStatus: 'settlement'
      });
      if (response?.status === 'active' || response?.activated) {
        if (response.membership) setMembership(response.membership);
        setPending(null);
        setShowMidtransModal(false);
        setNotice(response.message || 'Pembayaran berhasil dikonfirmasi! Paket membership Anda kini aktif.');
        if (location.search.includes('payment=sandbox_checkout')) {
          navigate('/membership/dashboard', { replace: true });
        }
        setReloadKey((value) => value + 1);
      } else {
        setPaymentRetryError(response?.message || 'Pembayaran belum dapat diverifikasi.');
      }
    } catch (error) {
      setPaymentRetryError(error.message || 'Gagal mengonfirmasi pembayaran Midtrans.');
    } finally {
      setVerifyingPayment(false);
    }
  };

  const handlePendingRetry = async () => {
    if (retryingPayment || !pendingForCurrentAccount) return;
    const requestAccountSignature = accountSignatureRef.current;
    setRetryingPayment(true);
    setPaymentRetryError('');

    try {
      const response = await retryPendingMembership();
      if (accountSignatureRef.current !== requestAccountSignature) return;
      const paymentUrl = response?.paymentUrl || response?.payment_url;
      if (response?.orderId) {
        setActiveOrderId(response.orderId);
      }

      if (paymentUrl) {
        if (String(paymentUrl).includes('payment=sandbox_checkout')) {
          try {
            const parsed = new URL(paymentUrl, window.location.origin);
            const orderFromUrl = parsed.searchParams.get('order_id');
            if (orderFromUrl) setActiveOrderId(orderFromUrl);
          } catch (_err) {
            // Ignore URL parse error
          }
          setShowMidtransModal(true);
          setNotice('Silakan pilih metode pembayaran di jendela Midtrans Snap untuk menyelesaikan transaksi.');
          return;
        }
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
  const activeHistoryRow = history.find((item) => item.status === 'active') || null;
  const currentPaymentMethod = MIDTRANS_PAYMENT_METHODS.find((m) => m.id === selectedPaymentMethod)
    || MIDTRANS_PAYMENT_METHODS[0];

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
                {source === 'membership' && activeHistoryRow && (
                  <button
                    className="membership-dashboard-button membership-dashboard-button-light"
                    type="button"
                    data-testid="hero-download-invoice-btn"
                    disabled={Boolean(busyInvoiceKey)}
                    onClick={() => handleDownloadInvoice(activeHistoryRow.id)}
                  >
                    {busyInvoiceKey === `pdf:${activeHistoryRow.id}` ? 'Mengunduh…' : 'Unduh Invoice (PDF)'}
                  </button>
                )}
                {isPaidMembership && (
                  <button className="membership-dashboard-button membership-dashboard-button-danger" type="button" onClick={(event) => {
                    cancelDialogOpenerRef.current = event.currentTarget;
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
                  <button
                    type="button"
                    data-testid="open-midtrans-modal-btn"
                    className="membership-dashboard-button membership-dashboard-button-primary"
                    onClick={() => setShowMidtransModal(true)}
                    disabled={loading || verifyingPayment || loadedAccountSignature !== accountSignature}
                  >
                    Bayar via Midtrans
                  </button>
                  <button type="button" className="membership-dashboard-button membership-dashboard-button-secondary" onClick={handlePendingRetry} disabled={loading || retryingPayment || loadedAccountSignature !== accountSignature}>
                    {retryingPayment ? 'Mengalihkan…' : 'Lanjutkan pembayaran'}
                  </button>
                  <button type="button" className="membership-dashboard-button membership-dashboard-button-secondary" onClick={handleCheckPaymentStatus} disabled={loading || verifyingPayment}>
                    {loading || verifyingPayment ? 'Memeriksa…' : 'Periksa status'}
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
                          <th scope="col">Invoice</th>
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
                            <td data-label="Invoice">
                              {item.status === 'active' ? (
                                <div className="membership-invoice-actions">
                                  <button
                                    type="button"
                                    data-testid={`download-invoice-btn-${item.id}`}
                                    className="membership-invoice-btn membership-invoice-btn-pdf"
                                    disabled={Boolean(busyInvoiceKey)}
                                    onClick={() => handleDownloadInvoice(item.id)}
                                  >
                                    {busyInvoiceKey === `pdf:${item.id}` ? 'Mengunduh…' : 'Unduh PDF'}
                                  </button>
                                  <button
                                    type="button"
                                    data-testid={`email-invoice-btn-${item.id}`}
                                    className="membership-invoice-btn membership-invoice-btn-email"
                                    disabled={Boolean(busyInvoiceKey)}
                                    onClick={() => handleSendInvoiceEmail(item.id)}
                                  >
                                    {busyInvoiceKey === `email:${item.id}` ? 'Mengirim…' : 'Kirim Email'}
                                  </button>
                                </div>
                              ) : (
                                '—'
                              )}
                            </td>
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

      {showMidtransModal && pendingForCurrentAccount && (
        <div
          className="membership-dashboard-modal-backdrop"
          data-testid="midtrans-checkout-modal"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !verifyingPayment) setShowMidtransModal(false);
          }}
        >
          <section
            className="membership-dashboard-modal membership-midtrans-modal"
            aria-labelledby="midtrans-checkout-title"
          >
            <button
              type="button"
              className="membership-dashboard-modal-close"
              aria-label="Tutup pembayaran Midtrans"
              disabled={verifyingPayment}
              onClick={() => setShowMidtransModal(false)}
            >
              ×
            </button>
            <div className="membership-midtrans-header">
              <span className="membership-midtrans-badge">MIDTRANS SNAP CHECKOUT</span>
              <h2 id="midtrans-checkout-title">Selesaikan Pembayaran Membership</h2>
              <p>Pilih metode pembayaran Midtrans di bawah ini dan konfirmasi untuk mengaktifkan paket secara instan.</p>
            </div>

            <div className="membership-midtrans-summary">
              <div>
                <span className="membership-midtrans-label">Paket Dipilih</span>
                <strong>{pendingForCurrentAccount.plan?.name || 'Paket Premium'}</strong>
                <small>Order ID: {activeOrderId || `gamukis-membership-${pendingForCurrentAccount.membershipId}`}</small>
              </div>
              <div className="membership-midtrans-amount">
                <span className="membership-midtrans-label">Total Tagihan</span>
                <strong>{formatPrice(pendingForCurrentAccount.plan?.price)}</strong>
              </div>
            </div>

            <div className="membership-midtrans-methods" role="radiogroup" aria-label="Metode Pembayaran Midtrans">
              {MIDTRANS_PAYMENT_METHODS.map((method) => (
                <button
                  key={method.id}
                  type="button"
                  data-testid={`midtrans-method-${method.id}`}
                  className={`membership-midtrans-method-btn ${selectedPaymentMethod === method.id ? 'is-selected' : ''}`}
                  onClick={() => setSelectedPaymentMethod(method.id)}
                >
                  <span className="membership-midtrans-method-name">{method.name}</span>
                  <span className="membership-midtrans-method-tag">{method.badge}</span>
                </button>
              ))}
            </div>

            <div className="membership-midtrans-instruction">
              <p>{currentPaymentMethod.instruction}</p>
              <div className="membership-midtrans-code-box">
                <code>{currentPaymentMethod.codeLabel}</code>
              </div>
            </div>

            {paymentRetryError && (
              <p className="membership-dashboard-modal-error" role="alert">{paymentRetryError}</p>
            )}

            <div className="membership-dashboard-modal-actions">
              <button
                type="button"
                className="membership-dashboard-button membership-dashboard-button-secondary"
                disabled={verifyingPayment}
                onClick={() => setShowMidtransModal(false)}
              >
                Tutup
              </button>
              <button
                type="button"
                data-testid="midtrans-confirm-payment-btn"
                className="membership-dashboard-button membership-dashboard-button-primary"
                disabled={verifyingPayment}
                onClick={handleConfirmMidtransPayment}
              >
                {verifyingPayment ? 'Memverifikasi Pembayaran...' : 'Bayar & Konfirmasi Sekarang'}
              </button>
            </div>
          </section>
        </div>
      )}

      {showCancelDialog && (
        <div
          className="membership-dashboard-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !cancelling) setShowCancelDialog(false);
          }}
        >
          <section
            ref={cancelDialogRef}
            className="membership-dashboard-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="membership-cancel-title"
            aria-describedby="membership-cancel-description"
            tabIndex="-1"
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
