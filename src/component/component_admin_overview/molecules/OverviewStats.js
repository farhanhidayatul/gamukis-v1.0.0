import React from "react";
import "./OverviewStats.css";
import StatCard from "../atoms/StatCard";

const OverviewStats = ({ teacherCount, roomCount, historyCount, isLoading }) => (
  <div className="overview-stats">
    <StatCard
      label="Guru menunggu persetujuan"
      value={isLoading ? "—" : teacherCount}
      sub="pengajuan aktif"
      accent="#f8cf45"
    />
    <StatCard
      label="Room aktif"
      value={isLoading ? "—" : roomCount}
      sub="room berjalan"
      accent="#176b68"
    />
    <StatCard
      label="Total sesi tercatat"
      value={isLoading ? "—" : historyCount}
      sub="sesi permainan"
      accent="#5b86f5"
    />
  </div>
);

export default OverviewStats;
