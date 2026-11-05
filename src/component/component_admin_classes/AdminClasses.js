import React, { useEffect, useState } from "react";
import { getAdminClasses, getAdminClassHistory } from "../../database/adminApi";
import ClassHistoryPanel from "./molecules/ClassHistoryPanel";
import "./AdminClasses.css";

const AdminClasses = () => {
  const [classes, setClasses] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedHistory, setSelectedHistory] = useState(null);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);

  const loadClasses = async (filters = {}) => {
    setIsLoading(true);
    setError("");
    try {
      const response = await getAdminClasses({
        status: filters.status ?? statusFilter,
        subject: filters.subject ?? subjectFilter,
        q: filters.q ?? searchQuery
      });
      setClasses(Array.isArray(response.classes) ? response.classes : []);
    } catch (loadErr) {
      setError(loadErr.message || "Gagal memuat daftar Kelas Guru.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadClasses({ status: statusFilter, subject: subjectFilter, q: searchQuery });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, subjectFilter]);

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    loadClasses({ status: statusFilter, subject: subjectFilter, q: searchQuery });
  };

  const handleInspectHistory = async (classId) => {
    setIsHistoryLoading(true);
    setError("");
    try {
      const detail = await getAdminClassHistory(classId);
      setSelectedHistory(detail);
    } catch (histErr) {
      setError(histErr.message || "Gagal memuat riwayat aktivitas kelas.");
    } finally {
      setIsHistoryLoading(false);
    }
  };

  return (
    <section className="admin-classes-section" aria-label="Pengawasan Kelas Guru">
      <div className="admin-classes-filters">
        <form className="admin-classes-search-form" onSubmit={handleSearchSubmit}>
          <input
            type="search"
            placeholder="Cari judul kelas, mapel, atau ID guru..."
            aria-label="Cari kelas guru"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
          <button type="submit" className="admin-btn admin-btn-a">
            Cari
          </button>
        </form>

        <div className="admin-classes-select-group">
          <select
            aria-label="Filter status kelas"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="">Semua Status</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>

          <input
            type="text"
            placeholder="Filter mata pelajaran..."
            aria-label="Filter mata pelajaran"
            value={subjectFilter}
            onChange={(event) => setSubjectFilter(event.target.value)}
          />
        </div>
      </div>

      {error ? (
        <div className="admin-classes-error" role="alert">
          {error}
        </div>
      ) : null}

      <div className="admin-classes-layout">
        <div className="admin-classes-table-wrap">
          {isLoading ? (
            <p className="admin-classes-empty">Memuat inventaris Kelas Guru...</p>
          ) : classes.length === 0 ? (
            <p className="admin-classes-empty">Tidak ada kelas yang sesuai dengan filter.</p>
          ) : (
            <table className="admin-classes-table">
              <thead>
                <tr>
                  <th>Judul Kelas</th>
                  <th>Guru</th>
                  <th>Mapel</th>
                  <th>Status</th>
                  <th>Siswa</th>
                  <th>Percobaan</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {classes.map((item) => (
                  <tr key={item.id} data-testid={`admin-class-row-${item.id}`}>
                    <td>
                      <strong>{item.title}</strong>
                      <div className="admin-class-sub">Kode: {item.joinCode || "-"}</div>
                    </td>
                    <td>{item.teacherUserId}</td>
                    <td>{item.subject}</td>
                    <td>
                      <span className={`admin-status-pill status-${item.status}`}>{item.status}</span>
                    </td>
                    <td>{item.enrollmentCount || 0}</td>
                    <td>{item.attemptCount || 0}</td>
                    <td>
                      <button
                        type="button"
                        className="admin-btn admin-btn-b"
                        onClick={() => handleInspectHistory(item.id)}
                      >
                        Riwayat Kelas
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <ClassHistoryPanel
          historyData={selectedHistory}
          isLoading={isHistoryLoading}
          onClose={() => setSelectedHistory(null)}
        />
      </div>
    </section>
  );
};

export default AdminClasses;
