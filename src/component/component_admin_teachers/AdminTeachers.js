import React, { useState } from "react";
import { updateTeacherApproval } from "../../database/adminApi";
import TeacherTable from "./molecules/TeacherTable";
import "./AdminTeachers.css";

const getTeacherId = (t) => t.id || t._id || t.userId;

const AdminTeachers = ({ teachers, setTeachers, isLoading, loadError = "" }) => {
  const [processingId, setProcessingId] = useState(null);
  const [error, setError] = useState("");

  const handleApproval = async (teacher, status) => {
    const teacherId = getTeacherId(teacher);
    if (!teacherId) {
      setError("Guru ini tidak memiliki ID yang dapat diproses.");
      return;
    }
    setProcessingId(teacherId);
    setError("");
    try {
      await updateTeacherApproval(teacherId, status);
      setTeachers((prev) => prev.filter((t) => getTeacherId(t) !== teacherId));
    } catch (err) {
      setError(err.message || "Status Guru gagal diperbarui.");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <React.Fragment>
      <div className="admin-sec">
        <div>
          <small>Tinjauan akun</small>
          <h2>Daftar Guru pending</h2>
        </div>
        {!isLoading && (
          <span className="admin-pill">{teachers.length} Guru</span>
        )}
      </div>

      {error && <p className="admin-alert" role="alert" style={{ marginBottom: '18px' }}><i>!</i><b>{error}</b></p>}
      {loadError && <p className="admin-alert" role="alert" style={{ marginBottom: '18px' }}><i>!</i><b>{loadError}</b></p>}

      {isLoading && (
        <p className="admin-card" role="status">Memuat daftar Guru...</p>
      )}

      {!isLoading && !loadError && teachers.length === 0 && (
        <div className="admin-card admin-empty">
          <div className="e">✅</div>
          <b>Semua pengajuan sudah ditinjau.</b>
          <span>Belum ada Guru baru yang menunggu persetujuan.</span>
        </div>
      )}

      {!isLoading && !loadError && teachers.length > 0 && (
        <TeacherTable
          teachers={teachers}
          processingId={processingId}
          onApproval={handleApproval}
        />
      )}
    </React.Fragment>
  );
};

export default AdminTeachers;
