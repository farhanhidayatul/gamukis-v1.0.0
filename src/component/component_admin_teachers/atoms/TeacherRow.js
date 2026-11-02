import React from "react";
import { StatusBadge } from "../../component_admin_shared";
import "./TeacherRow.css";

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

const TeacherRow = ({
  teacher,
  teacherName,
  teacherEmail,
  teacherSubject,
  teacherStatus = "pending",
  teacherDate,
  isProcessing,
  onApprove,
  onReject,
  onDetail,
  onRevoke,
  onDelete
}) => (
  <tr className="teacher-row">
    <td data-label="Nama"><strong>{teacherName}</strong></td>
    <td data-label="Email">{teacherEmail || "Email belum tersedia"}</td>
    <td data-label="Mata pelajaran">{teacherSubject}</td>
    <td data-label="Status">
      <StatusBadge
        status={teacherStatus}
        label={getStatusLabel(teacherStatus)}
      />
    </td>
    <td data-label="Tanggal pengajuan">{teacherDate}</td>
    <td className="teacher-row__actions" data-label="Aksi">
      {onDetail && (
        <button
          type="button"
          className="admin-shared-button"
          style={{ minHeight: "36px", padding: "6px 12px", fontSize: "13px", marginRight: "6px" }}
          onClick={() => onDetail(teacher)}
          aria-label={`Detail pengajuan ${teacherName}`}
        >
          Detail
        </button>
      )}
      {teacherStatus === "pending" && (
        <>
          <button
            type="button"
            className="teacher-row__approve"
            onClick={onApprove}
            disabled={isProcessing}
          >
            Setujui
          </button>
          <button
            type="button"
            className="teacher-row__reject"
            onClick={onReject}
            disabled={isProcessing}
          >
            Tolak
          </button>
        </>
      )}
      {teacherStatus === "approved" && onRevoke && (
        <button
          type="button"
          className="teacher-row__reject"
          onClick={() => onRevoke(teacher)}
          disabled={isProcessing}
          style={{ marginLeft: 0 }}
        >
          Cabut Akses
        </button>
      )}
      {(teacherStatus === "rejected" || teacherStatus === "revoked" || teacherStatus === "withdrawn") && onDelete && (
        <button
          type="button"
          className="teacher-row__reject"
          onClick={() => onDelete(teacher)}
          disabled={isProcessing}
          style={{ marginLeft: 0 }}
        >
          Hapus
        </button>
      )}
    </td>
  </tr>
);

export default TeacherRow;
