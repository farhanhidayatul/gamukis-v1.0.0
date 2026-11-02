import React, { useMemo, useState } from "react";
import { createRoom, deleteRoom, updateRoom } from "../../database/adminApi";
import {
  ConfirmDialog,
  DataToolbar,
  EmptyState,
  FormField,
  Modal,
  ResponsiveTable,
  StatusBadge
} from "../component_admin_shared";
import "./AdminRooms.css";

const AdminRooms = ({ rooms = [], setRooms, isLoading }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Create / Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [formName, setFormName] = useState("");
  const [formCapacity, setFormCapacity] = useState(100);
  const [formErrors, setFormErrors] = useState({});

  // Delete Confirm State
  const [roomToDelete, setRoomToDelete] = useState(null);

  const filteredRooms = useMemo(() => {
    if (!searchQuery.trim()) return rooms;
    const q = searchQuery.toLowerCase();
    return rooms.filter(
      (r) =>
        (r.name && r.name.toLowerCase().includes(q)) ||
        (r.id && r.id.toLowerCase().includes(q))
    );
  }, [rooms, searchQuery]);

  const handleOpenCreate = () => {
    setEditingRoom(null);
    setFormName("");
    setFormCapacity(100);
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleOpenEdit = (room) => {
    setEditingRoom(room);
    setFormName(room.name || "");
    setFormCapacity(room.capacity || 100);
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!formName.trim()) {
      errs.name = "Nama room wajib diisi.";
    } else if (formName.trim().length > 60) {
      errs.name = "Nama room maksimal 60 karakter.";
    }

    const cap = Number(formCapacity);
    if (!Number.isInteger(cap) || cap < 2 || cap > 100) {
      errs.capacity = "Kapasitas harus bilangan bulat antara 2 dan 100.";
    }

    if (Object.keys(errs).length > 0) {
      setFormErrors(errs);
      return;
    }

    setIsProcessing(true);
    setError("");
    setSuccess("");

    try {
      if (editingRoom) {
        const response = await updateRoom(editingRoom.id, {
          name: formName.trim(),
          capacity: cap
        });
        const updated = response.room || { ...editingRoom, name: formName.trim(), capacity: cap };
        setRooms((prev) => prev.map((r) => (r.id === editingRoom.id ? updated : r)));
        setSuccess(`Room ${updated.name || updated.id} berhasil diperbarui.`);
      } else {
        const response = await createRoom({
          name: formName.trim(),
          capacity: cap
        });
        setRooms((prev) => [...prev, response.room]);
        setSuccess(`Room ${response.room.name || response.room.id} berhasil dibuat.`);
      }
      setIsModalOpen(false);
    } catch (err) {
      setError(err.message || "Gagal menyimpan room.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!roomToDelete) return;
    setIsProcessing(true);
    setError("");
    setSuccess("");
    const hasActivePlayers = (roomToDelete.playerCount ?? 0) > 0;

    try {
      await deleteRoom(roomToDelete.id, { force: hasActivePlayers });
      setRooms((prev) => prev.filter((r) => r.id !== roomToDelete.id));
      setSuccess(`Room ${roomToDelete.name || roomToDelete.id} berhasil dihapus.`);
      setRoomToDelete(null);
    } catch (err) {
      setError(err.message || "Room gagal dihapus.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <React.Fragment>
      {/* Section Header */}
      <div className="admin-sec">
        <div>
          <small>Realtime game</small>
          <h2>Room aktif</h2>
        </div>
        {!isLoading && (
          <span className="admin-pill">{rooms.length} Room</span>
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
      <div className="admin-card" style={{ padding: "12px 16px", marginBottom: "16px" }}>
        <DataToolbar
          search={{
            value: searchQuery,
            onChange: setSearchQuery,
            placeholder: "Cari room berdasarkan nama atau ID..."
          }}
          primaryAction={{
            label: "+ Buat Room Baru",
            onClick: handleOpenCreate
          }}
        />
      </div>

      {/* Loading State */}
      {isLoading && (
        <p className="admin-card" role="status">Memuat room...</p>
      )}

      {/* Empty State */}
      {!isLoading && rooms.length === 0 && (
        <EmptyState
          icon="🎮"
          title="Belum ada room aktif"
          description="Room otomatis dibuat saat player mulai bermain, atau Anda dapat membuatnya sekarang."
          action={{
            label: "+ Buat Room Pertama",
            onClick: handleOpenCreate
          }}
        />
      )}

      {/* Table State */}
      {!isLoading && rooms.length > 0 && (
        <ResponsiveTable
          caption="Daftar room aktif"
          rows={filteredRooms}
          getRowId={(room) => room.id}
          columns={[
            {
              key: "room",
              label: "Room",
              primary: true,
              render: (room) => <><b>{room.name || room.id}</b><small>{room.id}</small></>
            },
            {
              key: "players",
              label: "Player",
              render: (room) => `${room.playerCount ?? 0}/${room.capacity ?? "∞"}`
            },
            {
              key: "connections",
              label: "Koneksi",
              render: (room) => room.connections ?? room.connectedCount ?? 0
            },
            {
              key: "suspiciousCount",
              label: "Cheat flag",
              render: (room) => (
                <span style={{ color: (room.suspiciousCount ?? 0) > 0 ? "var(--red)" : undefined, fontWeight: 700 }}>
                  {room.suspiciousCount ?? 0}
                </span>
              )
            },
            {
              key: "status",
              label: "Status",
              render: () => <StatusBadge status="active" label="Aktif" />
            }
          ]}
          actions={() => [
            { label: "Edit", onClick: handleOpenEdit, disabled: isProcessing },
            { label: "Hapus", onClick: setRoomToDelete, disabled: isProcessing, danger: true }
          ]}
          emptyState={(
            <EmptyState
              title="Room tidak ditemukan"
              description={`Tidak ada room yang sesuai dengan pencarian "${searchQuery}".`}
            />
          )}
        />
      )}

      {/* Create / Edit Modal */}
      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingRoom ? `Edit Room: ${editingRoom.name || editingRoom.id}` : "Buat Room Baru"}
        footer={
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
            <button
              type="button"
              className="admin-btn admin-btn-b"
              onClick={() => setIsModalOpen(false)}
              disabled={isProcessing}
            >
              Batal
            </button>
            <button
              type="button"
              className="admin-btn admin-btn-y"
              onClick={handleModalSubmit}
              disabled={isProcessing}
            >
              {isProcessing ? "Menyimpan…" : editingRoom ? "Simpan Perubahan" : "Buat Room"}
            </button>
          </div>
        }
      >
        <form onSubmit={handleModalSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <FormField label="Nama Room" required error={formErrors.name}>
            <input
              type="text"
              className="admin-plan-modal__input"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="Contoh: Arena Belajar 1"
              maxLength={60}
            />
          </FormField>

          <FormField
            label="Kapasitas Maksimal Pemain"
            required
            error={formErrors.capacity}
            hint="Batas pemain bersamaan dalam room (2 - 100)"
          >
            <input
              type="number"
              min="2"
              max="100"
              className="admin-plan-modal__input"
              value={formCapacity}
              onChange={(e) => setFormCapacity(parseInt(e.target.value, 10) || 2)}
            />
          </FormField>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={Boolean(roomToDelete)}
        title={`Hapus Room: ${roomToDelete?.name || roomToDelete?.id}`}
        message={
          (roomToDelete?.playerCount ?? 0) > 0
            ? `PERINGATAN: Room ini memiliki ${roomToDelete.playerCount} pemain aktif yang sedang bermain. Menghapusnya akan memutuskan koneksi mereka.`
            : `Apakah Anda yakin ingin menghapus room "${roomToDelete?.name || roomToDelete?.id}"?`
        }
        confirmLabel={(roomToDelete?.playerCount ?? 0) > 0 ? "Hapus Paksa" : "Hapus"}
        danger={true}
        requireText={
          (roomToDelete?.playerCount ?? 0) > 0
            ? roomToDelete?.name || roomToDelete?.id
            : undefined
        }
        busy={isProcessing}
        onConfirm={handleConfirmDelete}
        onCancel={() => setRoomToDelete(null)}
      />
    </React.Fragment>
  );
};

export default AdminRooms;
