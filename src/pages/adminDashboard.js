import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getManualUser } from "../database/manualAuth";
import { getHistory, getPendingTeachers, getRooms } from "../database/adminApi";
import AdminOverview from "../component/component_admin_overview/AdminOverview";
import AdminRooms from "../component/component_admin_rooms/AdminRooms";
import AdminMonitoring from "../component/component_admin_monitoring/AdminMonitoring";
import AdminTeachers from "../component/component_admin_teachers/AdminTeachers";
import AdminMemberships from "../component/component_admin_memberships/AdminMemberships";
import AdminHistory from "../component/component_admin_history/AdminHistory";
import gamukisLogo from "../images/Gamukis.png";
import "./adminDashboard.css";

const getUserRole = (user) =>
  String(user?.role || user?.userRole || user?.profile?.role || "").toLowerCase();

const SECTION_META = {
  overview:   { title: "Game operations",     copy: "Pantau operasi game, room, dan akses Guru dari satu ruang kerja." },
  rooms:      { title: "Rooms",               copy: "Kelola room realtime dan kapasitas player." },
  monitoring: { title: "Monitoring",          copy: "Pantau aktivitas player dan indikasi pelanggaran." },
  teachers:   { title: "Persetujuan Guru",    copy: "Tinjau pengajuan Guru sebelum mereka mulai mendampingi perjalanan belajar." },
  memberships:{ title: "Membership",          copy: "Kelola paket membership dan berikan akses kepada akun siswa atau guru." },
  history:    { title: "History permainan",   copy: "Lihat ringkasan sesi permainan yang tersimpan." }
};

const AdminDashboard = ({ section = "overview" }) => {
  const navigate = useNavigate();
  const [user] = useState(() => getManualUser());
  const [teachers, setTeachers] = useState([]);
  const [teacherLoadError, setTeacherLoadError] = useState("");
  const [rooms, setRooms] = useState([]);
  const [histories, setHistories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeSection, setActiveSection] = useState(section);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const role = getUserRole(user);
  const isKnownNonAdmin = !["admin", "administrator"].includes(role);

  useEffect(() => { setActiveSection(section); }, [section]);

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
    navigate(target === "overview" ? "/admin/dashboard" : `/admin/${target}`);
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
    <div className="app-admin">
      <aside className={`admin-aside ${isSidebarOpen ? "" : "min"}`} id="sb" aria-label="Menu admin">
        <button 
          className="admin-tg" 
          id="tg" 
          aria-label="Tampilkan atau sembunyikan sidebar" 
          aria-expanded={isSidebarOpen}
          onClick={() => setIsSidebarOpen((o) => !o)}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={isSidebarOpen ? "#333" : "#fff"} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 5l7 7-7 7"/>
          </svg>
        </button>
        <div className="admin-ws">WORKSPACE</div>
        
        <svg className="admin-icons-svg">
          <defs>
            <symbol id="i-ov" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="9" rx="2"/><rect x="14" y="3" width="7" height="5" rx="2"/><rect x="14" y="12" width="7" height="9" rx="2"/><rect x="3" y="16" width="7" height="5" rx="2"/></symbol>
            <symbol id="i-rm" viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="11" rx="5"/><path d="M7 10v5M4.5 12.5h5M15 11h.01M18 14h.01"/></symbol>
            <symbol id="i-mo" viewBox="0 0 24 24"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></symbol>
            <symbol id="i-gu" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0116 0M9 8.5l2 2 4-4"/></symbol>
            <symbol id="i-hi" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></symbol>
          </defs>
        </svg>

        <button className={`admin-nav ${activeSection === "overview" ? "on" : ""}`} onClick={() => navigateSection("overview")} title="Overview">
          <svg><use href="#i-ov"/></svg><span>Overview</span>
        </button>
        <button className={`admin-nav ${activeSection === "rooms" ? "on" : ""}`} onClick={() => navigateSection("rooms")} title="Rooms">
          <svg><use href="#i-rm"/></svg><span>Rooms</span>
        </button>
        <button className={`admin-nav ${activeSection === "monitoring" ? "on" : ""}`} onClick={() => navigateSection("monitoring")} title="Monitoring">
          <svg><use href="#i-mo"/></svg><span>Monitoring</span>
        </button>
        <button className={`admin-nav ${activeSection === "teachers" ? "on" : ""}`} onClick={() => navigateSection("teachers")} title="Persetujuan Guru">
          <svg><use href="#i-gu"/></svg><span>Persetujuan Guru</span>
        </button>
        <button className={`admin-nav ${activeSection === "memberships" ? "on" : ""}`} onClick={() => navigateSection("memberships")} title="Membership">
          <svg><use href="#i-hi"/></svg><span>Membership</span>
        </button>
        <button className={`admin-nav ${activeSection === "history" ? "on" : ""}`} onClick={() => navigateSection("history")} title="History">
          <svg><use href="#i-hi"/></svg><span>History</span>
        </button>
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
          {activeSection === "monitoring" && (
            <AdminMonitoring rooms={rooms} isLoading={isLoading} />
          )}
          {activeSection === "teachers" && (
            <AdminTeachers teachers={teachers} setTeachers={setTeachers} isLoading={isLoading} loadError={teacherLoadError} />
          )}
          {activeSection === "memberships" && <AdminMemberships />}
          {activeSection === "history" && (
            <AdminHistory histories={histories} isLoading={isLoading} />
          )}
        </section>
      </main>
    </div>
  );
};

export default AdminDashboard;
