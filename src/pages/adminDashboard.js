import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getManualUser } from "../database/manualAuth";
import { getHistory, getPendingTeachers, getRooms } from "../database/adminApi";
import { resolveSectionFromDynamicToken, buildDynamicAdminUrl } from "../utils/adminCryptoRouter";
import AdminOverview from "../component/component_admin_overview/AdminOverview";
import AdminRooms from "../component/component_admin_rooms/AdminRooms";
import AdminMonitoring from "../component/component_admin_monitoring/AdminMonitoring";
import AdminTeachers from "../component/component_admin_teachers/AdminTeachers";
import AdminMemberships from "../component/component_admin_memberships/AdminMemberships";
import AdminHistory from "../component/component_admin_history/AdminHistory";
import AdminClasses from "../component/component_admin_classes/AdminClasses";
import AdminCurriculumPanel from "../component/component_admin_curriculum/AdminCurriculumPanel";
import AdminTutorialEditor from "../component/component_admin_tutorial/AdminTutorialEditor";
import AdminBugDetectorPanel from "../component/component_admin_monitoring/AdminBugDetectorPanel";
import AdminAiQuestionGenerator from "./adminAiQuestionGenerator";
import AdminAiQuestionResults from "./adminAiQuestionResults";
import gamukisLogo from "../images/Gamukis.png";
import "./adminDashboard.css";

const getUserRole = (user) =>
  String(user?.role || user?.userRole || user?.profile?.role || "").toLowerCase();

const SECTION_META = {
  overview:       { title: "Game operations",     copy: "Pantau operasi game, room, dan akses Guru dari satu ruang kerja." },
  rooms:          { title: "Rooms",               copy: "Kelola room realtime dan kapasitas player." },
  "bug-detector": { title: "Detector Bug In-Game", copy: "Deteksi otomatis bug in-game (freeze, NaN coords, sprite 404, ghost player) dengan tombol konfirmasi tindakan admin." },
  monitoring:     { title: "Monitoring",          copy: "Pantau aktivitas player dan indikasi pelanggaran." },
  teachers:       { title: "Persetujuan Guru",    copy: "Tinjau pengajuan Guru sebelum mereka mulai mendampingi perjalanan belajar." },
  curriculum:     { title: "Kurikulum Kelas Siswa (/kelas)", copy: "Kelola mata pelajaran, bab silabus, sub materi, serta soal kuis untuk halaman /kelas, termasuk impor soal dari AI." },
  classes:        { title: "Kelas Guru",          copy: "Pantau kelas buatan Guru, status publikasi, riwayat siklus kelas, dan ringkasan kuis secara terpisah dari history game." },
  "ai-soal":      { title: "AI Pembuat Soal",     copy: "Ekstrak draf soal pilihan ganda dari modul PDF dengan AI, tinjau kandidat, dan terbitkan ke kelas." },
  ai:             { title: "AI Pembuat Soal",     copy: "Ekstrak draf soal pilihan ganda dari modul PDF dengan AI, tinjau kandidat, dan terbitkan ke kelas." },
  "ai-results":   { title: "Hasil AI",            copy: "Lihat ringkasan proses pembuatan soal AI tanpa membuka alur generator." },
  memberships:    { title: "Membership",          copy: "Kelola paket membership dan berikan akses kepada akun siswa atau guru." },
  tutorial:       { title: "Editor Panduan Tutorial", copy: "Kelola teks langkah, deskripsi alur, badge, dan link aset gambar tutorial tanpa coding." },
  history:        { title: "History permainan",   copy: "Lihat ringkasan sesi permainan yang tersimpan." }
};

const AdminDashboard = ({ section }) => {
  const navigate = useNavigate();
  const { hashSlug } = useParams();
  const [user] = useState(() => getManualUser());
  const [teachers, setTeachers] = useState([]);
  const [teacherLoadError, setTeacherLoadError] = useState("");
  const [rooms, setRooms] = useState([]);
  const [histories, setHistories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Resolve section: priority to route prop -> then URL crypto dynamic token -> default "overview"
  const resolvedInitialSection = section || (hashSlug ? resolveSectionFromDynamicToken(hashSlug) : "overview");
  const [activeSection, setActiveSection] = useState(resolvedInitialSection);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const role = getUserRole(user);
  const isKnownNonAdmin = !["admin", "administrator"].includes(role);

  useEffect(() => {
    if (section) {
      setActiveSection(section);
      // Auto-replace cleartext URL with dynamic crypto token in the browser URL bar
      navigate(buildDynamicAdminUrl(section), { replace: true });
    } else if (hashSlug) {
      setActiveSection(resolveSectionFromDynamicToken(hashSlug));
    }
  }, [section, hashSlug, navigate]);

  useEffect(() => {
    if (!user || isKnownNonAdmin) { setIsLoading(false); return undefined; }

    let isCurrent = true;
    Promise.allSettled([getPendingTeachers(), getRooms(), getHistory()])
      .then(([teacherRes, roomRes, historyRes]) => {
        if (!isCurrent) return;
        if (teacherRes.status === "fulfilled") {
          setTeachers(Array.isArray(teacherRes.value) ? teacherRes.value : []);
          setTeacherLoadError("");
        } else {
          setTeacherLoadError(teacherRes.reason?.message || "Daftar pengajuan Guru gagal dimuat.");
        }
        if (roomRes.status === "fulfilled") setRooms(Array.isArray(roomRes.value) ? roomRes.value : []);
        if (historyRes.status === "fulfilled") setHistories(Array.isArray(historyRes.value) ? historyRes.value : []);
      })
      .finally(() => { if (isCurrent) setIsLoading(false); });

    return () => { isCurrent = false; };
  }, [isKnownNonAdmin, user]);

  const navigateSection = (target) => {
    setActiveSection(target);
    setIsSidebarOpen(false);
    // Jurus 2: Gunakan Pure Dynamic Crypto Token (String berganti setiap klik!)
    navigate(buildDynamicAdminUrl(target));
  };

  if (!user) {
    return (
      <main className="admin-dashboard admin-dashboard-message">
        <section className="admin-message-panel">
          <p className="admin-eyebrow">GAMUKIS ADMIN</p>
          <h1>Masuk untuk membuka dashboard</h1>
          <p>Gunakan akun yang memiliki akses administrasi untuk melihat pengajuan Guru.</p>
          <button type="button" className="admin-primary-button" onClick={() => navigate("/login")}>
            Ke halaman masuk
          </button>
        </section>
      </main>
    );
  }

  if (isKnownNonAdmin) {
    return (
      <main className="admin-dashboard admin-dashboard-message">
        <section className="admin-message-panel">
          <p className="admin-eyebrow">GAMUKIS ADMIN</p>
          <h1>Akses dashboard tidak tersedia</h1>
          <p>Akun ini tidak memiliki role administrator pada data sesi.</p>
          <button type="button" className="admin-secondary-button" onClick={() => navigate("/home")}>
            Kembali ke beranda
          </button>
        </section>
      </main>
    );
  }

  const meta = SECTION_META[activeSection] || SECTION_META.overview;

  return (
    <div className="app-admin" data-testid="admin-dashboard-root">
      <aside className={`admin-aside ${isSidebarOpen ? "is-open" : "min"}`} id="sb" aria-label="Menu admin">
        <div className="admin-aside-top">
          <button 
            className="admin-tg" 
            id="tg" 
            aria-label="Tampilkan atau sembunyikan sidebar" 
            aria-expanded={isSidebarOpen}
            onClick={() => setIsSidebarOpen((o) => !o)}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#292929" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 5l7 7-7 7"/>
            </svg>
          </button>
          <div className="admin-ws">WORKSPACE</div>
        </div>
        
        <svg className="admin-icons-svg">
          <defs>
            <symbol id="i-ov" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="9" rx="2"/><rect x="14" y="3" width="7" height="5" rx="2"/><rect x="14" y="12" width="7" height="9" rx="2"/><rect x="3" y="16" width="7" height="5" rx="2"/></symbol>
            <symbol id="i-rm" viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="11" rx="5"/><path d="M7 10v5M4.5 12.5h5M15 11h.01M18 14h.01"/></symbol>
            <symbol id="i-mo" viewBox="0 0 24 24"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></symbol>
            <symbol id="i-gu" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0116 0M9 8.5l2 2 4-4"/></symbol>
            <symbol id="i-hi" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></symbol>
            <symbol id="i-ai" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="4"/><path d="M8 12h8M12 8v8M9 9l6 6M15 9l-6 6"/></symbol>
          </defs>
        </svg>

        <div className="admin-nav-list">
          <button className={`admin-nav ${activeSection === "overview" ? "on" : ""}`} onClick={() => navigateSection("overview")} title="Overview">
            <svg><use href="#i-ov"/></svg><span>Overview</span>
          </button>
          <button className={`admin-nav ${activeSection === "rooms" ? "on" : ""}`} onClick={() => navigateSection("rooms")} title="Rooms">
            <svg><use href="#i-rm"/></svg><span>Rooms</span>
          </button>
          <button className={`admin-nav ${activeSection === "bug-detector" ? "on" : ""}`} onClick={() => navigateSection("bug-detector")} title="Detector Bug In-Game">
            <svg><use href="#i-mo"/></svg><span>Detector Bug</span>
          </button>
          <button className={`admin-nav ${activeSection === "monitoring" ? "on" : ""}`} onClick={() => navigateSection("monitoring")} title="Monitoring">
            <svg><use href="#i-mo"/></svg><span>Monitoring</span>
          </button>
          <button className={`admin-nav ${activeSection === "teachers" ? "on" : ""}`} onClick={() => navigateSection("teachers")} title="Persetujuan Guru">
            <svg><use href="#i-gu"/></svg><span>Persetujuan Guru</span>
          </button>
          <button className={`admin-nav ${activeSection === "curriculum" ? "on" : ""}`} onClick={() => navigateSection("curriculum")} title="Kurikulum Kelas (/kelas)">
            <svg><use href="#i-gu"/></svg><span>Kurikulum (/kelas)</span>
          </button>
          <button className={`admin-nav ${activeSection === "classes" ? "on" : ""}`} onClick={() => navigateSection("classes")} title="Kelas Guru">
            <svg><use href="#i-gu"/></svg><span>Kelas Guru</span>
          </button>
          <button className={`admin-nav ${activeSection === "ai-soal" || activeSection === "ai" ? "on" : ""}`} onClick={() => navigateSection("ai-soal")} title="AI Soal">
            <svg><use href="#i-ai"/></svg><span>AI Soal</span>
          </button>
          <button className={`admin-nav ${activeSection === "ai-results" ? "on" : ""}`} onClick={() => navigateSection("ai-results")} title="Hasil AI">
            <svg><use href="#i-hi"/></svg><span>Hasil AI</span>
          </button>
          <button className={`admin-nav ${activeSection === "memberships" ? "on" : ""}`} onClick={() => navigateSection("memberships")} title="Membership">
            <svg><use href="#i-hi"/></svg><span>Membership</span>
          </button>
          <button className={`admin-nav ${activeSection === "tutorial" ? "on" : ""}`} onClick={() => navigateSection("tutorial")} title="Panduan Tutorial">
            <svg><use href="#i-gu"/></svg><span>Tutorial CMS</span>
          </button>
          <button className={`admin-nav ${activeSection === "history" ? "on" : ""}`} onClick={() => navigateSection("history")} title="History">
            <svg><use href="#i-hi"/></svg><span>History</span>
          </button>
        </div>
      </aside>

      <main className="admin-main-content">
        <div className="admin-top-bar">
          <div className="admin-logo">
            <img src={gamukisLogo} alt="Gamukis Logo" style={{ height: "38px", width: "auto" }} />
            <small>PANEL ADMIN</small>
          </div>
          <div className="admin-spacer"></div>
          <button type="button" className="admin-btn admin-btn-b" onClick={() => navigate("/home")}>
            Kembali ke beranda
          </button>
        </div>

        <section className="admin-view on">
          <div className="admin-hero">
            <small>Gamukis / Panel Admin</small>
            <h1>{meta.title}</h1>
            <p>{meta.copy}</p>
          </div>
          
          {activeSection === "overview" && (
            <AdminOverview
              teacherCount={teachers.length}
              roomCount={rooms.length}
              historyCount={histories.length}
              isLoading={isLoading}
            />
          )}
          {activeSection === "rooms" && (
            <AdminRooms rooms={rooms} setRooms={setRooms} isLoading={isLoading} />
          )}
          {activeSection === "bug-detector" && <AdminBugDetectorPanel />}
          {activeSection === "monitoring" && (
            <AdminMonitoring rooms={rooms} isLoading={isLoading} />
          )}
          {activeSection === "teachers" && (
            <AdminTeachers teachers={teachers} setTeachers={setTeachers} isLoading={isLoading} loadError={teacherLoadError} />
          )}
          {activeSection === "curriculum" && <AdminCurriculumPanel />}
          {activeSection === "classes" && <AdminClasses />}
          {(activeSection === "ai-soal" || activeSection === "ai") && <AdminAiQuestionGenerator embedded={true} />}
          {activeSection === "ai-results" && <AdminAiQuestionResults />}
          {activeSection === "memberships" && <AdminMemberships />}
          {activeSection === "tutorial" && <AdminTutorialEditor />}
          {activeSection === "history" && (
            <AdminHistory histories={histories} setHistories={setHistories} isLoading={isLoading} />
          )}
        </section>
      </main>
    </div>
  );
};

export default AdminDashboard;
