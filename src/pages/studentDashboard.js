import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getManualUser } from "../database/manualAuth";
import { getStudentClassrooms, joinClassroomByCode } from "../database/studentClassroomApi";
import { syncCurrentAccountRole } from "../database/teacherClassApi";
import StudentClassList from "../component/component_student_classes/StudentClassList";

const getUserRole = (user) =>
  String(user?.role || user?.userRole || user?.profile?.role || "").toLowerCase();

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(() => getManualUser());
  const [isCheckingAuth, setIsCheckingAuth] = useState(() => getUserRole(getManualUser()) !== "siswa");
  const [classes, setClasses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [joinError, setJoinError] = useState("");
  const [joinSuccess, setJoinSuccess] = useState("");

  const role = getUserRole(user);

  const loadEnrolledClasses = async () => {
    setIsLoading(true);
    try {
      const items = await getStudentClassrooms();
      setClasses(Array.isArray(items) ? items : []);
    } catch (err) {
      setJoinError(err.message || "Gagal memuat daftar kelas.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isCurrent = true;
    const initStudentDashboard = async () => {
      let currentUser = user;
      if (getUserRole(currentUser) !== "siswa" && typeof syncCurrentAccountRole === "function") {
        try {
          const synced = await syncCurrentAccountRole();
          if (!isCurrent) return;
          if (synced) {
            currentUser = synced;
            setUser(synced);
          }
        } catch (_) {
          // ignore
        }
      }
      if (!isCurrent) return;
      setIsCheckingAuth(false);

      if (getUserRole(currentUser) === "siswa") {
        await loadEnrolledClasses();
      } else {
        setIsLoading(false);
      }
    };

    initStudentDashboard();
    return () => {
      isCurrent = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isCheckingAuth) {
    return (
      <main className="student-dashboard-message">
        <p>Memverifikasi akses Siswa...</p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="student-dashboard-message">
        <h1>Masuk untuk membuka Dashboard Siswa</h1>
        <button type="button" className="student-btn student-btn-primary" onClick={() => navigate("/login")}>
          Ke halaman masuk
        </button>
      </main>
    );
  }

  if (role !== "siswa") {
    return (
      <main className="student-dashboard-message">
        <h1>Halaman Khusus Siswa</h1>
        <p>Silakan gunakan dashboard yang sesuai dengan peran akun Anda.</p>
        <button
          type="button"
          className="student-btn student-btn-primary"
          onClick={() => navigate(role === "guru" ? "/guru/dashboard" : "/complete-profile")}
        >
          Lanjutkan
        </button>
      </main>
    );
  }

  const handleJoinByCode = async (joinCode) => {
    setJoinError("");
    setJoinSuccess("");
    const result = await joinClassroomByCode(joinCode);
    setJoinSuccess(
      result?.alreadyEnrolled
        ? `Anda sudah terdaftar di kelas ${result?.class?.title || ""}.`
        : `Berhasil bergabung ke kelas ${result?.class?.title || ""}!`
    );
    await loadEnrolledClasses();
  };

  return (
    <div className="student-dashboard-page" data-testid="student-dashboard-root">
      <header className="student-dashboard-header">
        <div className="student-dashboard-title-group">
          <p className="student-eyebrow">GAMUKIS SISWA</p>
          <h1>Dashboard Belajar Siswa</h1>
        </div>
        <nav className="student-dashboard-nav" aria-label="Navigasi Siswa">
          <button type="button" className="student-btn" onClick={() => navigate("/kelas")}>
            Materi Mandiri (/kelas)
          </button>
          <button type="button" className="student-btn student-btn-primary" onClick={() => navigate("/home")}>
            Masuk ke Beranda Game
          </button>
        </nav>
      </header>

      <StudentClassList
        classes={classes}
        isLoading={isLoading}
        joinError={joinError}
        joinSuccess={joinSuccess}
        onJoinByCode={handleJoinByCode}
        onOpenClassroom={(item) => navigate(`/siswa/classes/${item.id}`)}
      />
    </div>
  );
};

export default StudentDashboard;
