import React from "react";
import "./TeacherTable.css";
import TeacherRow from "../atoms/TeacherRow";

const getTeacherId = (t) => t.id || t._id || t.userId;
const getTeacherName = (t) => t.name || t.fullName || t.username || "Nama belum tersedia";
const getTeacherSubject = (t) => t.subject || t.mataPelajaran || t.profile?.subject || "Belum diisi";

const formatDate = (value) => {
  if (!value) return "Tanggal belum tersedia";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric" }).format(date);
};

const TeacherTable = ({ teachers, processingId, onApproval }) => (
  <div className="teacher-table-wrap">
    <table className="teacher-table">
      <thead>
        <tr>
          <th>Nama</th>
          <th>Email</th>
          <th>Mata pelajaran</th>
          <th>Tanggal pengajuan</th>
          <th><span className="sr-only">Aksi</span></th>
        </tr>
      </thead>
      <tbody>
        {teachers.map((teacher) => {
          const id = getTeacherId(teacher);
          const rawDate = teacher.createdAt || teacher.created_at || teacher.registeredAt || teacher.createdDate;
          return (
            <TeacherRow
              key={id || getTeacherName(teacher)}
              teacher={teacher}
              teacherId={id}
              teacherName={getTeacherName(teacher)}
              teacherEmail={teacher.email}
              teacherSubject={getTeacherSubject(teacher)}
              teacherDate={formatDate(rawDate)}
              isProcessing={processingId === id}
              onApprove={() => onApproval(teacher, "approved")}
              onReject={() => onApproval(teacher, "rejected")}
            />
          );
        })}
      </tbody>
    </table>
  </div>
);

export default TeacherTable;
