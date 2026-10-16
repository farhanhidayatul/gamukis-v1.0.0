import React from "react";

const AdminOverview = ({ teacherCount, roomCount, historyCount, isLoading }) => (
  <React.Fragment>
    <div className="admin-stats">
      <div className="admin-stat">
        <small>GURU MENUNGGU PERSETUJUAN</small>
        <b>{isLoading ? "—" : teacherCount}</b>
        <span>pengajuan aktif</span>
      </div>
      <div className="admin-stat g">
        <small>ROOM AKTIF</small>
        <b>{isLoading ? "—" : roomCount}</b>
        <span>room berjalan</span>
      </div>
      <div className="admin-stat b">
        <small>TOTAL SESI TERCATAT</small>
        <b>{isLoading ? "—" : historyCount}</b>
        <span>sesi permainan</span>
      </div>
    </div>
    <div className="admin-note">
      <span className="admin-dot"></span>Dashboard aktif. Gunakan menu di samping untuk mengelola room, memantau aktivitas player, dan meninjau pengajuan Guru.
    </div>
  </React.Fragment>
);

export default AdminOverview;
