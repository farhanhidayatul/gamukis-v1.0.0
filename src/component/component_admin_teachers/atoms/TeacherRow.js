import React from "react";
import "./TeacherRow.css";

const TeacherRow = ({
  teacherName,
  teacherEmail,
  teacherSubject,
  teacherDate,
  isProcessing,
  onApprove,
  onReject
}) => (
  <tr className="teacher-row">
    <td data-label="Nama"><strong>{teacherName}</strong></td>
    <td data-label="Email">{teacherEmail || "Email belum tersedia"}</td>
    <td data-label="Mata pelajaran">{teacherSubject}</td>
    <td data-label="Tanggal pengajuan">{teacherDate}</td>
    <td className="teacher-row__actions" data-label="Aksi">
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
    </td>
  </tr>
);

export default TeacherRow;
