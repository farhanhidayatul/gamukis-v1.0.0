import React, { useEffect, useMemo, useState } from "react";
import {
  getAccessUsers,
  getMembershipPlans,
  grantMembership,
  updateMembershipPlan
} from "../../database/adminApi";
import "./AdminMemberships.css";

const formatPrice = (price) => new Intl.NumberFormat("id-ID", {
  style: "currency", currency: "IDR", maximumFractionDigits: 0
}).format(Number(price) || 0);

const AdminMemberships = () => {
  const [plans, setPlans] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyPlanId, setBusyPlanId] = useState(null);
  const [granting, setGranting] = useState(false);
  const [role, setRole] = useState("siswa");
  const [selectedPlan, setSelectedPlan] = useState("");
  const [selectedUser, setSelectedUser] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadAdminData = async () => {
    setLoading(true);
    setError("");
    try {
      const [planList, userList] = await Promise.all([getMembershipPlans(), getAccessUsers()]);
      setPlans(planList);
      setUsers(userList);
    } catch (err) {
      setError(err.message || "Data membership gagal dimuat.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAdminData(); }, []);

  const matchingUsers = useMemo(() => users.filter((user) => user.role === role), [users, role]);
  const activePlans = useMemo(() => plans.filter((plan) => plan.audience === role && plan.isActive), [plans, role]);

  useEffect(() => {
    if (!activePlans.some((plan) => plan.code === selectedPlan)) setSelectedPlan(activePlans[0]?.code || "");
  }, [activePlans, selectedPlan]);
  useEffect(() => {
    if (!matchingUsers.some((user) => `${user.authType}:${user.id}` === selectedUser)) {
      setSelectedUser(matchingUsers[0] ? `${matchingUsers[0].authType}:${matchingUsers[0].id}` : "");
    }
  }, [matchingUsers, selectedUser]);

  const handleToggle = async (plan) => {
    setBusyPlanId(plan.id);
    setError("");
    setSuccess("");
    try {
      const response = await updateMembershipPlan(plan.id, { isActive: !plan.isActive });
      const updated = response.plan || { ...plan, isActive: !plan.isActive };
      setPlans((current) => current.map((item) => item.id === plan.id ? updated : item));
      setSuccess(`${plan.name} sekarang ${updated.isActive ? "aktif" : "nonaktif"}.`);
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
    setSuccess("");
    try {
      await grantMembership({ authType, userId, planCode: selectedPlan });
      const user = matchingUsers.find((item) => item.authType === authType && String(item.id) === userId);
      const plan = activePlans.find((item) => item.code === selectedPlan);
      setSuccess(`Paket ${plan?.name || selectedPlan} berhasil diberikan kepada ${user?.username || user?.email || userId}.`);
    } catch (err) {
      setError(err.message || "Paket gagal diberikan.");
    } finally {
      setGranting(false);
    }
  };

  return (
    <section className="admin-memberships" aria-labelledby="admin-memberships-title">
      <div className="admin-sec">
        <div><small>Langganan</small><h2 id="admin-memberships-title">Membership</h2></div>
        {!loading && <span className="admin-pill">{plans.length} Paket</span>}
      </div>

      {error && <p className="admin-alert admin-memberships__feedback" role="alert"><i>!</i><b>{error}</b></p>}
      {success && <p className="admin-memberships__success" role="status">{success}</p>}
      {loading && <p className="admin-card" role="status">Memuat paket dan pengguna…</p>}

      {!loading && <>
        <div className="admin-card">
          <h3>DAFTAR PAKET</h3>
          {plans.length === 0 ? <p className="admin-memberships__muted">Belum ada paket membership.</p> : (
            <div className="admin-card admin-tw admin-memberships__table-wrap">
              <table>
                <thead><tr><th>PAKET</th><th>ROLE</th><th>HARGA</th><th>DURASI</th><th>STATUS</th><th></th></tr></thead>
                <tbody>{plans.map((plan) => (
                  <tr key={plan.id}>
                    <td><b>{plan.name}</b><small>{plan.code}</small></td>
                    <td>{plan.audience}</td>
                    <td>{formatPrice(plan.price)}</td>
                    <td>{plan.durationDays ? `${plan.durationDays} hari` : "Tanpa batas"}</td>
                    <td><span className="admin-tag">{plan.isActive ? "aktif" : "nonaktif"}</span></td>
                    <td><button type="button" className="admin-btn admin-btn-b" onClick={() => handleToggle(plan)} disabled={busyPlanId === plan.id}>
                      {busyPlanId === plan.id ? "Menyimpan…" : plan.isActive ? "Nonaktifkan" : "Aktifkan"}
                    </button></td>
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
      </>}
    </section>
  );
};

export default AdminMemberships;
