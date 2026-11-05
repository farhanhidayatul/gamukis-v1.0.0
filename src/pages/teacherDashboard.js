import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getManualUser } from "../database/manualAuth";
import {
  getTeacherClassResults,
  getTeacherClasses,
  isApprovedGuruUser,
  publishTeacherClass,
  rotateTeacherJoinCode,
  syncCurrentAccountRole,
  updateTeacherClass
} from "../database/teacherClassApi";
import TeacherClasses from "../component/component_teacher_classes/TeacherClasses";
import gamukisLogo from "../images/Gamukis.png";

const getUserRole = (user) => {
  if (isApprovedGuruUser(user)) return "guru";
  return String(user?.role || user?.userRole || user?.profile?.role || "").toLowerCase();
};

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(() => getManualUser());
  const [isCheckingAuth, setIsCheckingAuth] = useState(() => !isApprovedGuruUser(getManualUser()));
  const [classes, setClasses] = useState([]);
  const [quota, setQuota] = useState({ activeCount: 0, maxClasses: 3, remaining: 3 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedResults, setSelectedResults] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const role = getUserRole(user);

  const loadDashboard = async () => {
    setIsLoading(true);
    setError("");
    try {
      const data = await getTeacherClasses();
      setClasses(data.classes || []);
      setQuota(data.quota || { activeCount: 0, maxClasses: 3, remaining: 3 });
    } catch (loadError) {
      setError(loadError.message || "Gagal memuat data dashboard Guru.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isCurrent = true;

    const verifyAndLoad = async () => {
      let currentUser = user;
      if (!isApprovedGuruUser(currentUser) && typeof syncCurrentAccountRole === "function") {
        const synced = await syncCurrentAccountRole();
        if (!isCurrent) return;
        if (synced) {
          currentUser = synced;
          setUser(synced);
        }
      }
      if (!isCurrent) return;
      setIsCheckingAuth(false);

      if (isApprovedGuruUser(currentUser)) {
        await loadDashboard();
      } else {
        setIsLoading(false);
      }
    };

    verifyAndLoad();
    return () => {
      isCurrent = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isCheckingAuth) {
    return (
      <main className="teacher-dashboard-message">
        <p>Memverifikasi akses akun Guru...</p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="teacher-dashboard-message">
        <h1>Masuk untuk mengakses Dashboard Guru</h1>
        <p>Silakan masuk menggunakan akun Guru yang telah disetujui.</p>
        <button type="button" className="teacher-btn teacher-btn-primary" onClick={() => navigate("/login")}>
          Ke halaman masuk
        </button>
      </main>
    );
  }

  if (role !== "guru") {
    return (
      <main className="teacher-dashboard-message">
        <h1>Akses khusus Guru yang disetujui</h1>
        <p>Akun Anda belum memiliki peran Guru aktif. Periksa status pengajuan atau pilih peran terlebih dahulu.</p>
        <button
          type="button"
          className="teacher-btn teacher-btn-primary"
          onClick={() => navigate(role === "siswa" ? "/siswa/dashboard" : "/complete-profile")}
        >
          Lanjutkan
        </button>
      </main>
    );
  }

  const handlePublish = async (classId) => {
    setError("");
    try {
      await publishTeacherClass(classId);
      await loadDashboard();
    } catch (pubError) {
      setError(pubError.message || "Gagal mempublikasikan kelas.");
    }
  };

  const handleRotateCode = async (classId) => {
    setError("");
    try {
      await rotateTeacherJoinCode(classId);
      await loadDashboard();
    } catch (rotError) {
      setError(rotError.message || "Gagal memutar kode join.");
    }
  };

  const handleArchive = async (classId) => {
    setError("");
    try {
      await updateTeacherClass(classId, { status: "archived" });
      await loadDashboard();
    } catch (arcError) {
      setError(arcError.message || "Gagal mengarsipkan kelas.");
    }
  };

  const handleInspectResults = async (classItem) => {
    setError("");
    try {
      const res = await getTeacherClassResults(classItem.id);
      setSelectedResults({
        classItem,
        summary: res.summary || res.aggregates || { totalAttempts: 0, submittedCount: 0, averageScore: 0 },
        items: res.items || res.results || []
      });
    } catch (resError) {
      setError(resError.message || "Gagal memuat hasil kuis siswa.");
    }
  };

  const publishedCount = classes.filter((item) => item.status === "published").length;
  const totalEnrolled = classes.reduce(
    (sum, item) => sum + Number(item.enrolledCount ?? item.enrollmentCount ?? 0),
    0
  );

  return (
    <div className="app-teacher-dashboard teacher-dashboard-layout" data-testid="teacher-dashboard-root">
      <aside
        className={`teacher-admin-aside ${isSidebarOpen ? "is-open" : "min"}`}
        aria-label="Navigasi Guru"
      >
        <div className="teacher-admin-aside-top">
          <button
            type="button"
            className="teacher-admin-tg"
            aria-label="Tampilkan atau sembunyikan sidebar"
            aria-expanded={isSidebarOpen}
            onClick={() => setIsSidebarOpen((open) => !open)}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#292929"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <div className="teacher-admin-ws">WORKSPACE</div>
        </div>

        <svg className="teacher-admin-icons-svg" aria-hidden="true">
          <defs>
            <symbol id="t-ic-cls" viewBox="0 0 24 24">
              <rect x="3" y="3" width="7" height="9" rx="2" />
              <rect x="14" y="3" width="7" height="5" rx="2" />
              <rect x="14" y="12" width="7" height="9" rx="2" />
              <rect x="3" y="16" width="7" height="5" rx="2" />
            </symbol>
            <symbol id="t-ic-new" viewBox="0 0 24 24">
              <rect x="3" y="3" width="18" height="18" rx="4" />
              <path d="M12 8v8M8 12h8" />
            </symbol>
            <symbol id="t-ic-prof" viewBox="0 0 24 24">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 21a8 8 0 0116 0" />
            </symbol>
            <symbol id="t-ic-mem" viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </symbol>
            <symbol id="t-ic-home" viewBox="0 0 24 24">
              <path d="M3 10.5L12 3l9 7.5V20a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1v-9.5z" />
            </symbol>
          </defs>
        </svg>

        <nav className="teacher-admin-nav-list" aria-label="Menu Ruang Kerja Guru">
          <button
            type="button"
            className="teacher-admin-nav on"
            onClick={() => setSelectedResults(null)}
            title="Kelas & Kuis Saya"
          >
            <svg>
              <use href="#t-ic-cls" />
            </svg>
            <span>Kelas &amp; Kuis Saya</span>
          </button>
          <button
            type="button"
            className="teacher-admin-nav"
            onClick={() => navigate("/guru/classes/new")}
            title="Buat Kelas Baru"
          >
            <svg>
              <use href="#t-ic-new" />
            </svg>
            <span>+ Buat Kelas Baru</span>
          </button>
          <button
            type="button"
            className="teacher-admin-nav"
            onClick={() => navigate("/profile")}
            title="Profil Saya"
          >
            <svg>
              <use href="#t-ic-prof" />
            </svg>
            <span>Profil Saya</span>
          </button>
          <button
            type="button"
            className="teacher-admin-nav"
            onClick={() => navigate("/membership")}
            title="Membership Saya"
          >
            <svg>
              <use href="#t-ic-mem" />
            </svg>
            <span>Membership Saya</span>
          </button>
          <button
            type="button"
            className="teacher-admin-nav"
            onClick={() => navigate("/home")}
            title="Beranda Game"
          >
            <svg>
              <use href="#t-ic-home" />
            </svg>
            <span>Beranda Game</span>
          </button>
        </nav>
      </aside>

      <main className="teacher-admin-main">
        <header className="teacher-admin-topbar teacher-dashboard-header">
          <div className="teacher-admin-logo">
            <img src={gamukisLogo} alt="Gamukis Logo" className="teacher-admin-logo-img" />
            <small>PANEL GURU</small>
          </div>
          <div className="teacher-admin-spacer" />
          <div className="teacher-dashboard-nav">
            <button
              type="button"
              className="teacher-admin-btn teacher-admin-btn-y"
              onClick={() => navigate("/guru/classes/new")}
            >
              + Buat Kelas Baru
            </button>
            <button
              type="button"
              className="teacher-admin-btn teacher-admin-btn-b"
              onClick={() => navigate("/home")}
            >
              Kembali ke beranda
            </button>
          </div>
        </header>

        <section className="teacher-admin-view">
          <div className="teacher-admin-hero teacher-dashboard-title-group">
            <small>Gamukis / Panel Guru</small>
            <h1>Dashboard Guru</h1>
            <p>
              Kelola kelas pembelajaran, susun soal kuis interaktif (Pilihan Ganda, Drag &amp; Drop, Isian Tulisan), dan pantau capaian nilai siswa dari satu ruang kerja.
            </p>
          </div>

          <div className="teacher-admin-stats" aria-label="Ringkasan Statistik Kelas Guru">
            <div className="teacher-admin-stat">
              <small>KUOTA KELAS AKTIF</small>
              <b>
                {quota.activeCount || 0} / {quota.maxClasses || 3}
              </b>
              <span>Sisa kuota pembuatan kelas: {quota.remaining ?? 3} kelas</span>
            </div>
            <div className="teacher-admin-stat g">
              <small>KELAS DIPUBLIKASIKAN</small>
              <b>{publishedCount}</b>
              <span>Kelas aktif yang siap diakses siswa dengan kode join</span>
            </div>
            <div className="teacher-admin-stat b">
              <small>TOTAL SISWA TERDAFTAR</small>
              <b>{totalEnrolled}</b>
              <span>Akumulasi siswa yang bergabung di seluruh kelas Anda</span>
            </div>
          </div>

          <TeacherClasses
            classes={classes}
            quota={quota}
            isLoading={isLoading}
            error={error}
            onCreateNew={() => navigate("/guru/classes/new")}
            onEditClass={(item) => navigate(`/guru/classes/${item.id}/edit`)}
            onPublishClass={handlePublish}
            onRotateCode={handleRotateCode}
            onArchiveClass={handleArchive}
            onInspectResults={handleInspectResults}
          />

          {selectedResults ? (
            <section
              aria-label="Hasil Kuis Kelas"
              data-testid="teacher-results-panel"
              className="teacher-results-panel"
            >
              <div className="teacher-results-header">
                <h3>Hasil Kuis: {selectedResults.classItem.title}</h3>
                <button
                  type="button"
                  className="teacher-btn teacher-btn-outline"
                  onClick={() => setSelectedResults(null)}
                >
                  Tutup Hasil
                </button>
              </div>
              <p className="teacher-results-summary">
                Total Percobaan: <strong>{selectedResults.summary.totalAttempts}</strong> | Selesai:{" "}
                <strong>{selectedResults.summary.submittedCount}</strong> | Rata-rata Skor:{" "}
                <strong>{selectedResults.summary.averageScore}</strong>
              </p>
            </section>
          ) : null}
        </section>
      </main>
    </div>
  );
};

export default TeacherDashboard;
