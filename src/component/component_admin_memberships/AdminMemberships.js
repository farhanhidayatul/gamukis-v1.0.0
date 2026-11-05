import React, { useEffect, useMemo, useState } from "react";
import {
  confirmAdminMembership,
  createMembershipPlan,
  downloadAdminMembershipInvoice,
  getAccessUsers,
  getAdminMembershipTransactions,
  getMembershipPlans,
  grantMembership,
  sendAdminMembershipInvoiceEmail,
  updateMembershipPlan
} from "../../database/adminApi";
import { Toast, useToast } from "../component_admin_shared";
import PlanModal from "./molecules/PlanModal";
import "./AdminMemberships.css";

const formatPrice = (price) => new Intl.NumberFormat("id-ID", {
  style: "currency", currency: "IDR", maximumFractionDigits: 0
}).format(Number(price) || 0);

const formatDateTime = (value) => {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(parsed);
};

const formatDateShort = (value) => {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(parsed);
};

const getStatusLabel = (status) => {
  if (status === "active") return "Aktif (Lunas)";
  if (status === "pending") return "Pending";
  if (status === "cancelled") return "Dibatalkan";
  return status || "—";
};

const AdminMemberships = () => {
  const [plans, setPlans] = useState([]);
  const [users, setUsers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [txSummary, setTxSummary] = useState({
    totalCount: 0,
    activeCount: 0,
    pendingCount: 0,
    cancelledCount: 0,
    totalRevenue: 0
  });
  const [txStatusFilter, setTxStatusFilter] = useState("all");
  const [txSearch, setTxSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [busyPlanId, setBusyPlanId] = useState(null);
  const [busyTxAction, setBusyTxAction] = useState("");
  const [granting, setGranting] = useState(false);
  const [role, setRole] = useState("siswa");
  const [selectedPlan, setSelectedPlan] = useState("");
  const [selectedUser, setSelectedUser] = useState("");
  const [error, setError] = useState("");
  const { toasts, showToast, dismissToast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [isModalProcessing, setIsModalProcessing] = useState(false);

  const loadTransactions = async (status = txStatusFilter, q = txSearch) => {
    if (typeof getAdminMembershipTransactions !== "function") return;
    setLoadingTransactions(true);
    try {
      const txData = await getAdminMembershipTransactions({ status, q });
      setTransactions(Array.isArray(txData?.transactions) ? txData.transactions : []);
      if (txData?.summary) setTxSummary(txData.summary);
    } catch (_err) {
      // Keep existing transaction state if endpoint is unavailable in partial mocks
    } finally {
      setLoadingTransactions(false);
    }
  };

  const loadAdminData = async () => {
    setLoading(true);
    setError("");
    try {
      const [planList, userList, txResult] = await Promise.all([
        getMembershipPlans(),
        getAccessUsers(),
        typeof getAdminMembershipTransactions === "function"
          ? getAdminMembershipTransactions({ status: txStatusFilter, q: txSearch }).catch(() => ({ transactions: [], summary: null }))
          : Promise.resolve({ transactions: [], summary: null })
      ]);
      setPlans(planList);
      setUsers(userList);
      setTransactions(Array.isArray(txResult?.transactions) ? txResult.transactions : []);
      if (txResult?.summary) setTxSummary(txResult.summary);
    } catch (err) {
      setError(err.message || "Data membership gagal dimuat.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const matchingUsers = useMemo(() => users.filter((user) => user.role === role), [users, role]);
  const activePlans = useMemo(() => plans.filter((plan) => plan.audience === role && plan.isActive), [plans, role]);

  const filteredTransactions = useMemo(() => {
    const query = txSearch.trim().toLowerCase();
    return transactions.filter((tx) => {
      if (txStatusFilter !== "all" && tx.status !== txStatusFilter) return false;
      if (!query) return true;
      return (
        String(tx.username || "").toLowerCase().includes(query) ||
        String(tx.email || "").toLowerCase().includes(query) ||
        String(tx.ownerKey || tx.owner_key || "").toLowerCase().includes(query) ||
        String(tx.name || "").toLowerCase().includes(query) ||
        String(tx.code || "").toLowerCase().includes(query) ||
        String(tx.payment_ref || "").toLowerCase().includes(query) ||
        String(tx.invoiceNumber || "").toLowerCase().includes(query)
      );
    });
  }, [transactions, txStatusFilter, txSearch]);

  useEffect(() => {
    if (!activePlans.some((plan) => plan.code === selectedPlan)) setSelectedPlan(activePlans[0]?.code || "");
  }, [activePlans, selectedPlan]);
  useEffect(() => {
    if (!matchingUsers.some((user) => `${user.authType}:${user.id}` === selectedUser)) {
      setSelectedUser(matchingUsers[0] ? `${matchingUsers[0].authType}:${matchingUsers[0].id}` : "");
    }
  }, [matchingUsers, selectedUser]);

  const handleOpenCreate = () => {
    setEditingPlan(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (plan) => {
    setEditingPlan(plan);
    setIsModalOpen(true);
  };

  const handleSavePlan = async (payload) => {
    setIsModalProcessing(true);
    setError("");
    try {
      if (editingPlan) {
        const response = await updateMembershipPlan(editingPlan.id, payload);
        const updated = response.plan || { ...editingPlan, ...payload };
        setPlans((current) => current.map((item) => (item.id === editingPlan.id ? updated : item)));
        showToast({ message: `Paket ${updated.name} berhasil diperbarui.` });
      } else {
        const response = await createMembershipPlan(payload);
        const created = response.plan || payload;
        setPlans((current) => [...current, created]);
        showToast({ message: `Paket ${created.name} berhasil dibuat.` });
      }
      setIsModalOpen(false);
    } catch (err) {
      setError(err.message || "Gagal menyimpan paket membership.");
    } finally {
      setIsModalProcessing(false);
    }
  };

  const handleToggle = async (plan) => {
    setBusyPlanId(plan.id);
    setError("");
    try {
      const response = await updateMembershipPlan(plan.id, { isActive: !plan.isActive });
      const updated = response.plan || { ...plan, isActive: !plan.isActive };
      setPlans((current) => current.map((item) => item.id === plan.id ? updated : item));
      showToast({ message: `${plan.name} sekarang ${updated.isActive ? "aktif" : "nonaktif"}.` });
    } catch (err) {
      setError(err.message || "Status paket gagal diperbarui.");
    } finally {
      setBusyPlanId(null);
    }
  };

  const handleGrant = async (event) => {
    event.preventDefault();
    const [authType, userId] = selectedUser.split(":");
    if (!authType || !userId || !activePlans.some((plan) => plan.code === selectedPlan)) {
      setError("Pilih pengguna dan paket aktif yang sesuai.");
      return;
    }
    setGranting(true);
    setError("");
    try {
      await grantMembership({ authType, userId, planCode: selectedPlan });
      const user = matchingUsers.find((item) => item.authType === authType && String(item.id) === userId);
      const plan = activePlans.find((item) => item.code === selectedPlan);
      showToast({ message: `Paket ${plan?.name || selectedPlan} berhasil diberikan kepada ${user?.username || user?.email || userId}.` });
      await loadTransactions();
    } catch (err) {
      setError(err.message || "Paket gagal diberikan.");
    } finally {
      setGranting(false);
    }
  };

  const handleDownloadInvoice = async (tx) => {
    if (!tx?.id || busyTxAction) return;
    setBusyTxAction(`pdf:${tx.id}`);
    setError("");
    try {
      const res = await downloadAdminMembershipInvoice(tx.id);
      showToast({ message: `Invoice PDF (${res.filename}) berhasil diunduh.` });
    } catch (err) {
      setError(err.message || "Gagal mengunduh invoice PDF.");
    } finally {
      setBusyTxAction("");
    }
  };

  const handleSendInvoiceEmail = async (tx) => {
    if (!tx?.id || busyTxAction) return;
    setBusyTxAction(`email:${tx.id}`);
    setError("");
    try {
      const res = await sendAdminMembershipInvoiceEmail(tx.id, tx.email);
      showToast({ message: res.message || `Invoice berhasil dikirim ke email pelanggan.` });
    } catch (err) {
      setError(err.message || "Gagal mengirim email invoice.");
    } finally {
      setBusyTxAction("");
    }
  };

  const handleConfirmPendingTx = async (tx) => {
    if (!tx?.id || busyTxAction) return;
    setBusyTxAction(`confirm:${tx.id}`);
    setError("");
    try {
      await confirmAdminMembership(tx.id);
      showToast({ message: `Transaksi #${tx.id} dikonfirmasi aktif & invoice telah disiapkan.` });
      await loadTransactions();
    } catch (err) {
      setError(err.message || "Gagal mengonfirmasi transaksi.");
    } finally {
      setBusyTxAction("");
    }
  };

  return (
    <section className="admin-memberships" aria-labelledby="admin-memberships-title">
      <div className="admin-sec">
        <div><small>Langganan & Pembayaran</small><h2 id="admin-memberships-title">Membership & Transaksi</h2></div>
        {!loading && <span className="admin-pill">{plans.length} Paket · {transactions.length} Transaksi</span>}
      </div>

      <Toast toasts={toasts} onDismiss={dismissToast} />
      {error && <p className="admin-alert admin-memberships__feedback" role="alert"><i>!</i><b>{error}</b></p>}
      {loading && <p className="admin-card" role="status">Memuat paket dan pengguna…</p>}

      {!loading && <>
        <div className="admin-card">
          <div className="admin-memberships__header-row">
            <h3>DAFTAR PAKET</h3>
            <button
              type="button"
              className="admin-btn admin-btn-y"
              onClick={handleOpenCreate}
            >
              + Tambah Paket Baru
            </button>
          </div>
          {plans.length === 0 ? <p className="admin-memberships__muted">Belum ada paket membership.</p> : (
            <div className="admin-card admin-tw admin-memberships__table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>PAKET</th>
                    <th>ROLE</th>
                    <th>HARGA</th>
                    <th>DURASI</th>
                    <th>FITUR</th>
                    <th>STATUS</th>
                    <th>AKSI</th>
                  </tr>
                </thead>
                <tbody>{plans.map((plan) => (
                  <tr key={plan.id}>
                    <td><b>{plan.name}</b><small>{plan.code}</small></td>
                    <td><span style={{ textTransform: "capitalize" }}>{plan.audience}</span></td>
                    <td>{formatPrice(plan.price)}</td>
                    <td>{plan.durationDays ? `${plan.durationDays} hari` : "Tanpa batas"}</td>
                    <td>
                      {plan.features && Object.keys(plan.features).length > 0 ? (
                        <small style={{ color: "#a0a0b0", display: "block", maxWidth: "200px", lineHeight: "1.3" }}>
                          {Object.entries(plan.features)
                            .map(([k, v]) => `${k}: ${v}`)
                            .slice(0, 2)
                            .join(", ")}
                          {Object.keys(plan.features).length > 2 && "…"}
                        </small>
                      ) : (
                        <small style={{ color: "#777" }}>Standar</small>
                      )}
                    </td>
                    <td><span className="admin-tag">{plan.isActive ? "aktif" : "nonaktif"}</span></td>
                    <td className="admin-memberships__actions-cell">
                      <button
                        type="button"
                        className="admin-btn admin-btn-b"
                        onClick={() => handleOpenEdit(plan)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="admin-btn admin-btn-b"
                        onClick={() => handleToggle(plan)}
                        disabled={busyPlanId === plan.id}
                      >
                        {busyPlanId === plan.id ? "Menyimpan…" : plan.isActive ? "Nonaktifkan" : "Aktifkan"}
                      </button>
                    </td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}
        </div>

        <div className="admin-card admin-memberships__grant">
          <h3>BERIKAN MEMBERSHIP</h3>
          <p className="admin-memberships__muted">Pilih pengguna dan paket aktif untuk role yang sama.</p>
          <form className="admin-form admin-memberships__form" onSubmit={handleGrant}>
            <div><label htmlFor="membership-role">ROLE PENGGUNA</label>
              <select id="membership-role" value={role} onChange={(event) => setRole(event.target.value)}>
                <option value="siswa">Siswa</option><option value="guru">Guru</option>
              </select>
            </div>
            <div><label htmlFor="membership-user">PENGGUNA</label>
              <select id="membership-user" value={selectedUser} onChange={(event) => setSelectedUser(event.target.value)} disabled={!matchingUsers.length}>
                {!matchingUsers.length && <option value="">Tidak ada pengguna dengan role ini</option>}
                {matchingUsers.map((user) => <option key={`${user.authType}:${user.id}`} value={`${user.authType}:${user.id}`}>
                  {user.username || user.email || user.id}{user.email && user.username ? ` · ${user.email}` : ""}
                </option>)}
              </select>
            </div>
            <div><label htmlFor="membership-plan">PAKET AKTIF</label>
              <select id="membership-plan" value={selectedPlan} onChange={(event) => setSelectedPlan(event.target.value)} disabled={!activePlans.length}>
                {!activePlans.length && <option value="">Tidak ada paket aktif untuk role ini</option>}
                {activePlans.map((plan) => <option key={plan.code} value={plan.code}>{plan.name} · {formatPrice(plan.price)}</option>)}
              </select>
            </div>
            <button type="submit" className="admin-btn admin-btn-y" disabled={granting || !matchingUsers.length || !activePlans.length}>
              {granting ? "Memberikan…" : "Berikan paket"}
            </button>
          </form>
        </div>

        <div className="admin-card admin-memberships__transactions" data-testid="admin-membership-transactions">
          <div className="admin-memberships__header-row">
            <div>
              <h3>RIWAYAT TRANSAKSI PELANGGAN</h3>
              <p className="admin-memberships__muted" style={{ marginBottom: 0 }}>
                Pantau seluruh transaksi berlangganan Midtrans, unduh invoice PDF resmi, atau kirim ulang invoice ke email pelanggan.
              </p>
            </div>
            <button
              type="button"
              className="admin-btn admin-btn-b"
              disabled={loadingTransactions}
              onClick={() => loadTransactions()}
            >
              {loadingTransactions ? "Memuat…" : "Muat Ulang Transaksi"}
            </button>
          </div>

          <div className="admin-memberships__tx-stats">
            <div className="admin-memberships__tx-stat">
              <span>TOTAL TRANSAKSI</span>
              <strong>{txSummary.totalCount || transactions.length}</strong>
            </div>
            <div className="admin-memberships__tx-stat is-active">
              <span>LANGGANAN AKTIF</span>
              <strong>{txSummary.activeCount || transactions.filter((t) => t.status === "active").length}</strong>
            </div>
            <div className="admin-memberships__tx-stat is-pending">
              <span>MENUNGGU PEMBAYARAN</span>
              <strong>{txSummary.pendingCount || transactions.filter((t) => t.status === "pending").length}</strong>
            </div>
            <div className="admin-memberships__tx-stat is-revenue">
              <span>TOTAL PENDAPATAN</span>
              <strong>{formatPrice(txSummary.totalRevenue)}</strong>
            </div>
          </div>

          <div className="admin-memberships__tx-filters">
            <input
              type="search"
              placeholder="Cari nama pelanggan, email, nomor invoice, paket, atau referensi Midtrans..."
              value={txSearch}
              onChange={(e) => setTxSearch(e.target.value)}
              aria-label="Cari transaksi membership"
            />
            <select
              value={txStatusFilter}
              onChange={(e) => setTxStatusFilter(e.target.value)}
              aria-label="Filter status transaksi"
            >
              <option value="all">Semua Status</option>
              <option value="active">Aktif (Lunas)</option>
              <option value="pending">Pending</option>
              <option value="cancelled">Dibatalkan</option>
            </select>
          </div>

          {filteredTransactions.length === 0 ? (
            <p className="admin-memberships__muted" style={{ marginTop: "14px" }}>
              Belum ada riwayat transaksi yang sesuai dengan filter.
            </p>
          ) : (
            <div className="admin-card admin-tw admin-memberships__table-wrap" style={{ marginTop: "14px" }}>
              <table>
                <thead>
                  <tr>
                    <th>NO. INVOICE / TANGGAL</th>
                    <th>PELANGGAN</th>
                    <th>PAKET & NOMINAL</th>
                    <th>MASA AKTIF</th>
                    <th>REF. MIDTRANS</th>
                    <th>STATUS</th>
                    <th>INVOICE & AKSI</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map((tx) => (
                    <tr key={tx.id}>
                      <td>
                        <b>{tx.invoiceNumber || `INV-GMK-#${tx.id}`}</b>
                        <small>{formatDateTime(tx.created_at)}</small>
                      </td>
                      <td>
                        <b>{tx.username || tx.ownerKey || tx.owner_key}</b>
                        <small>{tx.email || "Email belum tercatat"} · {String(tx.audience || "").toUpperCase()}</small>
                      </td>
                      <td>
                        <b>{tx.name || tx.code}</b>
                        <small>{formatPrice(tx.price)}</small>
                      </td>
                      <td>
                        <small>
                          {tx.started_at ? formatDateShort(tx.started_at) : "—"}
                          {tx.expires_at ? ` s/d ${formatDateShort(tx.expires_at)}` : (tx.status === "active" ? " (Selamanya)" : "")}
                        </small>
                      </td>
                      <td>
                        <small style={{ fontFamily: "monospace" }}>{tx.payment_ref || `gamukis-membership-${tx.id}`}</small>
                      </td>
                      <td>
                        <span className={`admin-tag admin-memberships__tx-status is-${tx.status}`}>
                          {getStatusLabel(tx.status)}
                        </span>
                      </td>
                      <td className="admin-memberships__actions-cell">
                        <button
                          type="button"
                          data-testid={`admin-invoice-pdf-${tx.id}`}
                          className="admin-btn admin-btn-b"
                          disabled={Boolean(busyTxAction)}
                          onClick={() => handleDownloadInvoice(tx)}
                        >
                          {busyTxAction === `pdf:${tx.id}` ? "Mengunduh…" : "Unduh PDF"}
                        </button>
                        <button
                          type="button"
                          data-testid={`admin-invoice-email-${tx.id}`}
                          className="admin-btn admin-btn-y"
                          disabled={Boolean(busyTxAction)}
                          onClick={() => handleSendInvoiceEmail(tx)}
                        >
                          {busyTxAction === `email:${tx.id}` ? "Mengirim…" : "Kirim Email"}
                        </button>
                        {tx.status === "pending" && (
                          <button
                            type="button"
                            data-testid={`admin-confirm-tx-${tx.id}`}
                            className="admin-btn admin-btn-y"
                            disabled={Boolean(busyTxAction)}
                            onClick={() => handleConfirmPendingTx(tx)}
                          >
                            {busyTxAction === `confirm:${tx.id}` ? "Memproses…" : "Konfirmasi"}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </>}

      <PlanModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSavePlan}
        plan={editingPlan}
        isProcessing={isModalProcessing}
      />
    </section>
  );
};

export default AdminMemberships;
