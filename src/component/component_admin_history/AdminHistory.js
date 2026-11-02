import React, { useMemo, useState } from "react";
import { deleteHistory } from "../../database/adminApi";
import { ConfirmDialog, DataToolbar, EmptyState, ResponsiveTable } from "../component_admin_shared";
import HistorySummary from "./molecules/HistorySummary";
import "./AdminHistory.css";

const formatDate = (value) => {
  if (!value) return "Tanggal belum tersedia";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
};

const AdminHistory = ({ histories = [], setHistories, isLoading }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [historyToDelete, setHistoryToDelete] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const filteredHistories = useMemo(() => {
    if (!searchQuery.trim()) return histories;
    const q = searchQuery.toLowerCase();
    return histories.filter((h) => {
      const idMatch = String(h.id_history || "").toLowerCase().includes(q);
      const dateMatch = String(h.created_at || "").toLowerCase().includes(q);
      const descMatch = (h.desc_answer_true || "").toLowerCase().includes(q) ||
        (h.desc_answer_false || "").toLowerCase().includes(q);
      return idMatch || dateMatch || descMatch;
    });
  }, [histories, searchQuery]);

  const totalSesi = filteredHistories.length;
  const totalBenar = filteredHistories.reduce((s, h) => s + (Number(h.answer_true) || 0), 0);
  const totalSalah = filteredHistories.reduce((s, h) => s + (Number(h.answer_false) || 0), 0);
  const totalCoin = filteredHistories.reduce((s, h) => s + (Number(h.coin) || 0), 0);

  const handleDelete = async () => {
    if (!historyToDelete) return;
    setIsProcessing(true);
    setError("");
    setSuccess("");
    try {
      await deleteHistory(historyToDelete.id_history);
      if (setHistories) {
        setHistories((prev) => prev.filter((h) => h.id_history !== historyToDelete.id_history));
      }
      setSuccess(`Sesi #${historyToDelete.id_history} berhasil dihapus.`);
      setHistoryToDelete(null);
    } catch (err) {
      setError(err.message || "History gagal dihapus.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <React.Fragment>
      <div className="admin-sec">
        <div>
          <small>Analytics</small>
          <h2>History permainan</h2>
        </div>
        {!isLoading && histories.length > 0 && (
          <span className="admin-pill">{totalSesi} sesi</span>
        )}
      </div>

      {error && (
        <div className="admin-alert" style={{ marginBottom: "18px" }}>
          <i>!</i>
          <div><b>{error}</b></div>
        </div>
      )}

      {success && (
        <div className="admin-memberships__success" style={{ marginBottom: "18px" }}>
          <b>{success}</b>
        </div>
      )}

      {/* Toolbar */}
      {!isLoading && histories.length > 0 && (
        <div className="admin-card" style={{ padding: "12px 16px", marginBottom: "16px" }}>
          <DataToolbar
            search={{
              value: searchQuery,
              onChange: setSearchQuery,
              placeholder: "Cari riwayat berdasarkan ID atau tanggal..."
            }}
          />
        </div>
      )}

      {isLoading && (
        <p className="admin-history__state" role="status">Memuat history semua pengguna...</p>
      )}

      {!isLoading && histories.length === 0 && (
        <EmptyState
          icon="🕘"
          title="Belum ada history permainan"
          description="History sesi permainan player akan otomatis tercatat di sini setelah player menyelesaikan permainan."
        />
      )}

      {!isLoading && histories.length > 0 && (
        <>
          <HistorySummary
            totalSesi={totalSesi}
            totalBenar={totalBenar}
            totalSalah={totalSalah}
            totalCoin={totalCoin}
          />
          <ResponsiveTable
            caption="Riwayat permainan"
            rows={filteredHistories}
            getRowId={(history) => history.id_history}
            columns={[
              {
                key: "id_history",
                label: "ID",
                primary: true,
                render: (history) => <b>#{history.id_history}</b>
              },
              { key: "time_playing", label: "Waktu main", render: (history) => history.time_playing ?? "—" },
              {
                key: "answer_true",
                label: "Benar",
                render: (history) => <strong style={{ color: "#10b981" }}>{Number(history.answer_true) || 0}</strong>
              },
              {
                key: "answer_false",
                label: "Salah",
                render: (history) => <strong style={{ color: "#ef4444" }}>{Number(history.answer_false) || 0}</strong>
              },
              { key: "all_question", label: "Total soal", render: (history) => Number(history.all_question) || 0 },
              {
                key: "coin",
                label: "Coin",
                render: (history) => <strong style={{ color: "#f59e0b" }}>🪙 {Number(history.coin) || 0}</strong>
              },
              { key: "death", label: "Death", render: (history) => Number(history.death) || 0 },
              { key: "created_at", label: "Tanggal", render: (history) => <small>{formatDate(history.created_at)}</small> }
            ]}
            actions={() => [
              { label: "Hapus", onClick: setHistoryToDelete, disabled: isProcessing, danger: true }
            ]}
            emptyState={(
              <EmptyState
                title="Riwayat tidak ditemukan"
                description={`Tidak ada riwayat permainan yang sesuai dengan "${searchQuery}".`}
              />
            )}
          />
        </>
      )}

      <ConfirmDialog
        open={Boolean(historyToDelete)}
        title={`Hapus Riwayat Sesi #${historyToDelete?.id_history}`}
        message={`Apakah Anda yakin ingin menghapus data sesi permainan #${historyToDelete?.id_history}? Tindakan ini permanen.`}
        confirmLabel="Hapus Permanen"
        danger={true}
        busy={isProcessing}
        onConfirm={handleDelete}
        onCancel={() => setHistoryToDelete(null)}
      />
    </React.Fragment>
  );
};

export default AdminHistory;
