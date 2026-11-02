import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  deleteTeacher,
  listTeachers,
  updateTeacherApproval
} from "../../database/adminApi";
import {
  ConfirmDialog,
  DataToolbar,
  EmptyState,
  Modal,
  StatusBadge
} from "../component_admin_shared";
import TeacherTable from "./molecules/TeacherTable";
import "./AdminTeachers.css";

const getTeacherId = (t) => t?.id || t?._id || t?.userId;
const getTeacherName = (t) => t?.name || t?.fullName || t?.username || "Nama belum tersedia";
const getTeacherSubject = (t) => t?.subject || t?.mataPelajaran || t?.profile?.subject || "Belum diisi";

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
};

const STATUS_OPTIONS = [
  { value: "pending", label: "Menunggu (Pending)" },
  { value: "approved", label: "Disetujui (Approved)" },
  { value: "rejected", label: "Ditolak (Rejected)" },
  { value: "all", label: "Semua Pengajuan" }
];

const getStatusVariant = (status) => {
  switch (status) {
    case "approved": return "success";
    case "pending": return "warning";
    case "rejected": return "danger";
    case "revoked":
    case "withdrawn": return "neutral";
    default: return "neutral";
  }
};

const getStatusLabel = (status) => {
  switch (status) {
    case "approved": return "Disetujui";
    case "pending": return "Menunggu";
    case "rejected": return "Ditolak";
    case "revoked": return "Dicabut";
    case "withdrawn": return "Dibatalkan";
    default: return status || "-";
  }
};

const AdminTeachers = ({ teachers = [], setTeachers, isLoading = false, loadError = "" }) => {
  const [statusFilter, setStatusFilter] = useState("pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [items, setItems] = useState(teachers);
  const [isFetching, setIsFetching] = useState(false);
  const [processingId, setProcessingId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Modal detail & confirm dialog states
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null); // { type, teacher, title, message, confirmLabel, variant }

  // Sync initial teachers prop into local items when on pending default without search
  useEffect(() => {
    if (statusFilter === "pending" && !searchQuery.trim()) {
      setItems(teachers);
    }
  }, [teachers, statusFilter, searchQuery]);

  const fetchTeachers = useCallback(async (status, q) => {
    setIsFetching(true);
    setError("");
    try {
      const data = await listTeachers({ status, q });
      const results = Array.isArray(data) ? data : [];
      setItems(results);
      if (status === "pending" && !q && typeof setTeachers === "function") {
        setTeachers(results);
      }
    } catch (err) {
      setError(err.message || "Gagal memuat daftar pengajuan Guru.");
    } finally {
      setIsFetching(false);
    }
  }, [setTeachers]);

  const handleStatusChange = (val) => {
    setStatusFilter(val);
    fetchTeachers(val, searchQuery);
  };

  const handleSearchChange = (val) => {
    setSearchQuery(val);
  };

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTeachers(statusFilter, searchQuery);
    }, 350);
    return () => clearTimeout(timer);
  }, [statusFilter, searchQuery, fetchTeachers]);

  // Direct approve handler
  const handleApprove = async (teacher) => {
    const teacherId = getTeacherId(teacher);
    if (!teacherId) {
      setError("Guru ini tidak memiliki ID yang dapat diproses.");
      return;
    }
    setProcessingId(teacherId);
    setError("");
    setSuccess("");
    try {
      await updateTeacherApproval(teacherId, "approved");
      setSuccess(`Pengajuan Guru ${getTeacherName(teacher)} berhasil disetujui.`);
      await fetchTeachers(statusFilter, searchQuery);
    } catch (err) {
      setError(err.message || "Gagal menyetujui pengajuan Guru.");
    } finally {
      setProcessingId(null);
    }
  };

  // Open confirm reject
  const handlePromptReject = (teacher) => {
    setConfirmDialog({
      type: "reject",
      teacher,
      title: "Tolak Pengajuan Guru",
      message: `Apakah Anda yakin ingin menolak pengajuan Guru dari "${getTeacherName(teacher)}"? Akun ini tidak akan diberikan hak akses Guru.`,
      confirmLabel: "Tolak Pengajuan",
      variant: "danger"
    });
  };

  // Open confirm revoke
  const handlePromptRevoke = (teacher) => {
    setConfirmDialog({
      type: "revoke",
      teacher,
      title: "Cabut Hak Akses Guru",
      message: `Apakah Anda yakin ingin mencabut akses Guru dari "${getTeacherName(teacher)}"? Peran akun akan dicabut dan dikembalikan ke belum dipilih.`,
      confirmLabel: "Cabut Akses",
      variant: "danger"
    });
  };

  // Open confirm delete
  const handlePromptDelete = (teacher) => {
    setConfirmDialog({
      type: "delete",
      teacher,
      title: "Hapus Catatan Pengajuan",
      message: `Hapus catatan pengajuan Guru "${getTeacherName(teacher)}" secara permanen dari database? Tindakan ini tidak dapat dibatalkan.`,
      confirmLabel: "Hapus Permanen",
      variant: "danger"
    });
  };

  // Execute confirmed dialog action
  const handleConfirmAction = async () => {
    if (!confirmDialog?.teacher) return;
    const { type, teacher } = confirmDialog;
    const teacherId = getTeacherId(teacher);
    setProcessingId(teacherId);
    setError("");
    setSuccess("");
    try {
      if (type === "reject") {
        await updateTeacherApproval(teacherId, "rejected");
        setSuccess(`Pengajuan Guru ${getTeacherName(teacher)} telah ditolak.`);
      } else if (type === "revoke") {
        await deleteTeacher(teacherId, { revoke: true });
        setSuccess(`Hak akses Guru ${getTeacherName(teacher)} berhasil dicabut.`);
      } else if (type === "delete") {
        await deleteTeacher(teacherId, { revoke: false });
        setSuccess(`Catatan pengajuan Guru ${getTeacherName(teacher)} berhasil dihapus.`);
      }
      setConfirmDialog(null);
      await fetchTeachers(statusFilter, searchQuery);
    } catch (err) {
      setError(err.message || "Operasi pengajuan Guru gagal diproses.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleApproval = (teacher, status) => {
    if (status === "approved") {
      handleApprove(teacher);
    } else {
      handlePromptReject(teacher);
    }
  };

  const displayedTeachers = useMemo(() => {
    if (!items || !Array.isArray(items)) return [];
    return items;
  }, [items]);

  const activeLoading = isLoading || isFetching;

  return (
    <React.Fragment>
      <div className="admin-sec">
        <div>
          <small>Tinjauan Akun & Akses</small>
          <h2>Persetujuan & Manajemen Guru</h2>
        </div>
        {!activeLoading && (
          <span className="admin-pill">{displayedTeachers.length} Guru</span>
        )}
      </div>

      <DataToolbar
        search={{
          value: searchQuery,
          placeholder: "Cari nama, email, atau mapel...",
          onChange: handleSearchChange
        }}
        filters={[
          {
            key: "status",
            label: "Filter Status",
            value: statusFilter,
            options: STATUS_OPTIONS,
            onChange: handleStatusChange
          }
        ]}
      />

      {error && (
        <p className="admin-alert" role="alert" style={{ marginBottom: "18px" }}>
          <i>!</i><b>{error}</b>
        </p>
      )}
      {loadError && (
        <p className="admin-alert" role="alert" style={{ marginBottom: "18px" }}>
          <i>!</i><b>{loadError}</b>
        </p>
      )}
      {success && (
        <p className="admin-alert admin-alert--success" role="status" style={{ marginBottom: "18px", borderLeftColor: "#2da44e", background: "#f0fff4", color: "#1a7f37" }}>
          <i>✓</i><b>{success}</b>
        </p>
      )}

      {activeLoading && (
        <p className="admin-card" role="status">Memuat data pengajuan Guru...</p>
      )}

      {!activeLoading && !loadError && displayedTeachers.length === 0 && (
        <EmptyState
          title={statusFilter === "pending" ? "Semua pengajuan sudah ditinjau" : "Data pengajuan tidak ditemukan"}
          description={
            statusFilter === "pending"
              ? "Belum ada Guru baru yang menunggu persetujuan pada filter ini."
              : "Tidak ada pengajuan Guru yang cocok dengan kriteria pencarian dan filter aktif."
          }
          icon={statusFilter === "pending" ? "✅" : "📋"}
        />
      )}

      {!activeLoading && !loadError && displayedTeachers.length > 0 && (
        <TeacherTable
          teachers={displayedTeachers}
          processingId={processingId}
          onApproval={handleApproval}
          onDetail={setSelectedTeacher}
          onRevoke={handlePromptRevoke}
          onDelete={handlePromptDelete}
        />
      )}

      {/* Modal Detail Guru */}
      {selectedTeacher && (
        <Modal
          open={Boolean(selectedTeacher)}
          onClose={() => setSelectedTeacher(null)}
          title={`Detail Pengajuan: ${getTeacherName(selectedTeacher)}`}
          footer={
            <button
              type="button"
              className="admin-shared-button is-primary"
              onClick={() => setSelectedTeacher(null)}
            >
              Tutup
            </button>
          }
        >
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", padding: "8px 0" }}>
            <div>
              <small style={{ color: "#667085", display: "block" }}>ID Pengajuan</small>
              <strong>{getTeacherId(selectedTeacher) || "-"}</strong>
            </div>
            <div>
              <small style={{ color: "#667085", display: "block" }}>Tipe Autentikasi</small>
              <strong>{selectedTeacher.authType || selectedTeacher.auth_type || "manual"}</strong>
            </div>
            <div>
              <small style={{ color: "#667085", display: "block" }}>Nama Lengkap</small>
              <strong>{getTeacherName(selectedTeacher)}</strong>
            </div>
            <div>
              <small style={{ color: "#667085", display: "block" }}>Email</small>
              <strong>{selectedTeacher.email || "-"}</strong>
            </div>
            <div>
              <small style={{ color: "#667085", display: "block" }}>Mata Pelajaran</small>
              <strong>{getTeacherSubject(selectedTeacher)}</strong>
            </div>
            <div>
              <small style={{ color: "#667085", display: "block" }}>Status Pengajuan</small>
              <StatusBadge
                status={getStatusVariant(selectedTeacher.status || "pending")}
                label={getStatusLabel(selectedTeacher.status || "pending")}
              />
            </div>
            <div>
              <small style={{ color: "#667085", display: "block" }}>Tanggal Pengajuan</small>
              <span>{formatDate(selectedTeacher.createdAt || selectedTeacher.created_at)}</span>
            </div>
            <div>
              <small style={{ color: "#667085", display: "block" }}>Ditinjau Oleh</small>
              <span>{selectedTeacher.reviewedBy || selectedTeacher.reviewed_by || "-"}</span>
            </div>
            <div>
              <small style={{ color: "#667085", display: "block" }}>Tanggal Ditinjau</small>
              <span>{formatDate(selectedTeacher.reviewedAt || selectedTeacher.reviewed_at)}</span>
            </div>
          </div>
        </Modal>
      )}

      {/* Confirm Dialog Action */}
      {confirmDialog && (
        <ConfirmDialog
          open={Boolean(confirmDialog)}
          onCancel={() => setConfirmDialog(null)}
          onConfirm={handleConfirmAction}
          title={confirmDialog.title}
          message={confirmDialog.message}
          confirmLabel={confirmDialog.confirmLabel}
          danger={confirmDialog.danger !== false}
          busy={Boolean(processingId)}
        />
      )}
    </React.Fragment>
  );
};

export default AdminTeachers;
