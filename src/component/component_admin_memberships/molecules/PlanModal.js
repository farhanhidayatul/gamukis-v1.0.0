import { useEffect, useState } from "react";
import { Modal, FormField } from "../../component_admin_shared";
import "./PlanModal.css";

const formatCurrency = (val) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0
  }).format(Number(val) || 0);

const DEFAULT_SISWA_PERKS = {
  maxCharacters: 5,
  unlimitedHeart: false,
  exclusiveSkins: false,
  extraExpMultiplier: 1.0
};

const DEFAULT_GURU_PERKS = {
  maxClasses: 5,
  maxStudentsPerRoom: 40,
  exportReports: true,
  aiQuestionGenerator: false
};

const PlanModal = ({ isOpen, onClose, onSave, plan = null, isProcessing = false }) => {
  const isEdit = Boolean(plan && plan.id);

  const [audience, setAudience] = useState("siswa");
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [price, setPrice] = useState(0);
  const [durationDays, setDurationDays] = useState(30);
  const [isUnlimitedDuration, setIsUnlimitedDuration] = useState(false);
  const [isActive, setIsActive] = useState(true);

  // Perks
  const [siswaPerks, setSiswaPerks] = useState(DEFAULT_SISWA_PERKS);
  const [guruPerks, setGuruPerks] = useState(DEFAULT_GURU_PERKS);
  const [customPerks, setCustomPerks] = useState([]);

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!isOpen) return;

    if (plan) {
      setAudience(plan.audience || "siswa");
      setCode(plan.code || "");
      setName(plan.name || "");
      setPrice(Number(plan.price) || 0);
      setIsActive(plan.isActive !== undefined ? Boolean(plan.isActive) : true);

      if (plan.durationDays == null) {
        setIsUnlimitedDuration(true);
        setDurationDays(30);
      } else {
        setIsUnlimitedDuration(false);
        setDurationDays(Number(plan.durationDays) || 30);
      }

      const rawFeatures = plan.features || {};
      if (plan.audience === "guru") {
        setGuruPerks({
          maxClasses: rawFeatures.maxClasses ?? DEFAULT_GURU_PERKS.maxClasses,
          maxStudentsPerRoom: rawFeatures.maxStudentsPerRoom ?? DEFAULT_GURU_PERKS.maxStudentsPerRoom,
          exportReports: rawFeatures.exportReports ?? DEFAULT_GURU_PERKS.exportReports,
          aiQuestionGenerator: rawFeatures.aiQuestionGenerator ?? DEFAULT_GURU_PERKS.aiQuestionGenerator
        });
      } else {
        setSiswaPerks({
          maxCharacters: rawFeatures.maxCharacters ?? DEFAULT_SISWA_PERKS.maxCharacters,
          unlimitedHeart: rawFeatures.unlimitedHeart ?? DEFAULT_SISWA_PERKS.unlimitedHeart,
          exclusiveSkins: rawFeatures.exclusiveSkins ?? DEFAULT_SISWA_PERKS.exclusiveSkins,
          extraExpMultiplier: rawFeatures.extraExpMultiplier ?? DEFAULT_SISWA_PERKS.extraExpMultiplier
        });
      }

      // Extract custom perks
      const knownKeys = [
        "maxCharacters", "unlimitedHeart", "exclusiveSkins", "extraExpMultiplier",
        "maxClasses", "maxStudentsPerRoom", "exportReports", "aiQuestionGenerator"
      ];
      const custom = Object.entries(rawFeatures)
        .filter(([k]) => !knownKeys.includes(k))
        .map(([k, v]) => ({ key: k, value: String(v) }));
      setCustomPerks(custom);
    } else {
      // Reset for create
      setAudience("siswa");
      setCode("");
      setName("");
      setPrice(0);
      setDurationDays(30);
      setIsUnlimitedDuration(false);
      setIsActive(true);
      setSiswaPerks(DEFAULT_SISWA_PERKS);
      setGuruPerks(DEFAULT_GURU_PERKS);
      setCustomPerks([]);
    }
    setErrors({});
  }, [isOpen, plan]);

  const handleAddCustomPerk = () => {
    setCustomPerks((prev) => [...prev, { key: "", value: "true" }]);
  };

  const handleCustomPerkChange = (index, field, val) => {
    setCustomPerks((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: val };
      return updated;
    });
  };

  const handleRemoveCustomPerk = (index) => {
    setCustomPerks((prev) => prev.filter((_, i) => i !== index));
  };

  const validate = () => {
    const newErrors = {};

    if (!isEdit) {
      if (!code.trim()) {
        newErrors.code = "Kode paket wajib diisi.";
      } else if (!/^[a-z0-9_]{3,50}$/.test(code.trim())) {
        newErrors.code = "Kode hanya boleh huruf kecil, angka, dan garis bawah (3-50 karakter).";
      }
    }

    if (!name.trim()) {
      newErrors.name = "Nama paket wajib diisi.";
    } else if (name.trim().length > 100) {
      newErrors.name = "Nama paket maksimal 100 karakter.";
    }

    const numPrice = Number(price);
    if (isNaN(numPrice) || numPrice < 0 || !Number.isInteger(numPrice)) {
      newErrors.price = "Harga harus berupa bilangan bulat non-negatif.";
    }

    if (numPrice > 0 && isUnlimitedDuration) {
      newErrors.durationDays = "Paket berbayar wajib memiliki durasi hari yang jelas.";
    } else if (!isUnlimitedDuration) {
      const numDuration = Number(durationDays);
      if (isNaN(numDuration) || numDuration <= 0 || !Number.isInteger(numDuration)) {
        newErrors.durationDays = "Durasi hari harus bilangan bulat lebih dari 0.";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    // Compile features
    const compiledFeatures = audience === "guru" ? { ...guruPerks } : { ...siswaPerks };
    customPerks.forEach(({ key, value }) => {
      const trimmedKey = key.trim();
      if (trimmedKey) {
        if (value.toLowerCase() === "true") compiledFeatures[trimmedKey] = true;
        else if (value.toLowerCase() === "false") compiledFeatures[trimmedKey] = false;
        else if (!isNaN(Number(value)) && value.trim() !== "") compiledFeatures[trimmedKey] = Number(value);
        else compiledFeatures[trimmedKey] = value;
      }
    });

    const payload = {
      name: name.trim(),
      price: Number(price),
      durationDays: isUnlimitedDuration ? null : Number(durationDays),
      features: compiledFeatures,
      isActive
    };

    if (!isEdit) {
      payload.code = code.trim();
      payload.audience = audience;
    }

    onSave(payload);
  };

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title={isEdit ? `Edit Paket: ${plan?.name || plan?.code}` : "Buat Paket Membership Baru"}
      maxWidth="620px"
      footer={
        <div className="admin-plan-modal__footer">
          <button
            type="button"
            className="admin-btn admin-btn-b"
            onClick={onClose}
            disabled={isProcessing}
          >
            Batal
          </button>
          <button
            type="button"
            className="admin-btn admin-btn-y"
            onClick={handleSubmit}
            disabled={isProcessing}
          >
            {isProcessing ? "Menyimpan…" : isEdit ? "Simpan Perubahan" : "Buat Paket"}
          </button>
        </div>
      }
    >
      <form className="admin-plan-modal" onSubmit={handleSubmit} noValidate>
        {/* Role Selector */}
        <FormField label="Target Role Pengguna" required>
          <div className="admin-plan-modal__role-selector">
            <button
              type="button"
              className={`admin-plan-modal__role-btn ${audience === "siswa" ? "is-active" : ""}`}
              onClick={() => !isEdit && setAudience("siswa")}
              disabled={isEdit}
            >
              🎓 Siswa
            </button>
            <button
              type="button"
              className={`admin-plan-modal__role-btn ${audience === "guru" ? "is-active" : ""}`}
              onClick={() => !isEdit && setAudience("guru")}
              disabled={isEdit}
            >
              👨‍🏫 Guru
            </button>
          </div>
        </FormField>

        {/* Code & Name */}
        <div className="admin-plan-modal__grid">
          <FormField
            label="Kode Unik Paket"
            required={!isEdit}
            error={errors.code}
            hint={isEdit ? "Kode paket tidak dapat diubah setelah dibuat." : "Contoh: siswa_vip, guru_pro"}
          >
            <input
              type="text"
              className="admin-plan-modal__input"
              value={code}
              onChange={(e) => setCode(e.target.value.toLowerCase())}
              disabled={isEdit}
              placeholder="kode_paket_unik"
            />
          </FormField>

          <FormField label="Nama Paket Tampilan" required error={errors.name}>
            <input
              type="text"
              className="admin-plan-modal__input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Paket Belajar VIP"
            />
          </FormField>
        </div>

        {/* Price & Duration */}
        <div className="admin-plan-modal__grid">
          <FormField
            label="Harga (IDR)"
            required
            error={errors.price}
            hint={`Format: ${formatCurrency(price)}`}
          >
            <input
              type="number"
              min="0"
              step="1000"
              className="admin-plan-modal__input"
              value={price}
              onChange={(e) => setPrice(Math.max(0, parseInt(e.target.value, 10) || 0))}
            />
          </FormField>

          <FormField label="Masa Aktif (Durasi)" error={errors.durationDays}>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <input
                type="number"
                min="1"
                className="admin-plan-modal__input"
                value={durationDays}
                onChange={(e) => setDurationDays(Math.max(1, parseInt(e.target.value, 10) || 1))}
                disabled={isUnlimitedDuration}
                placeholder="Hari aktif"
              />
              <label className="admin-plan-modal__checkbox-label">
                <input
                  type="checkbox"
                  checked={isUnlimitedDuration}
                  onChange={(e) => setIsUnlimitedDuration(e.target.checked)}
                />
                Tanpa Batas Waktu (Akses Selamanya)
              </label>
            </div>
          </FormField>
        </div>

        {/* Status Toggle */}
        <FormField label="Status Paket">
          <label className="admin-plan-modal__checkbox-label" style={{ marginTop: "4px" }}>
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
            />
            Paket Aktif (Dapat dipilih atau dibeli oleh pengguna)
          </label>
        </FormField>

        {/* Role-Specific Perks Box */}
        <div className="admin-plan-modal__perks-box">
          <div className="admin-plan-modal__perks-title">
            <span>Fitur yang Tersedia untuk {audience === "guru" ? "Guru" : "Siswa"}</span>
            <small style={{ color: "#9ca3af", textTransform: "none", fontWeight: 400 }}>
              Dapat disesuaikan oleh Admin
            </small>
          </div>

          {audience === "siswa" ? (
            <>
              <div className="admin-plan-modal__perk-row">
                <div className="admin-plan-modal__perk-info">
                  <span className="admin-plan-modal__perk-name">Batas Karakter / Avatar</span>
                  <span className="admin-plan-modal__perk-desc">Maksimal karakter yang bisa dibuat siswa</span>
                </div>
                <input
                  type="number"
                  min="1"
                  max="100"
                  className="admin-plan-modal__input"
                  style={{ width: "90px" }}
                  value={siswaPerks.maxCharacters}
                  onChange={(e) =>
                    setSiswaPerks((p) => ({
                      ...p,
                      maxCharacters: Math.max(1, parseInt(e.target.value, 10) || 1)
                    }))
                  }
                />
              </div>

              <div className="admin-plan-modal__perk-row">
                <div className="admin-plan-modal__perk-info">
                  <span className="admin-plan-modal__perk-name">Nyawa Tak Terbatas (Unlimited Heart)</span>
                  <span className="admin-plan-modal__perk-desc">Bebas bermain game tanpa kehabisan nyawa</span>
                </div>
                <label className="admin-plan-modal__toggle-switch">
                  <input
                    type="checkbox"
                    checked={siswaPerks.unlimitedHeart}
                    onChange={(e) =>
                      setSiswaPerks((p) => ({ ...p, unlimitedHeart: e.target.checked }))
                    }
                  />
                  <span className="admin-plan-modal__toggle-slider"></span>
                </label>
              </div>

              <div className="admin-plan-modal__perk-row">
                <div className="admin-plan-modal__perk-info">
                  <span className="admin-plan-modal__perk-name">Akses Skin & Kostum Eksklusif</span>
                  <span className="admin-plan-modal__perk-desc">Membuka kustomisasi avatar VIP</span>
                </div>
                <label className="admin-plan-modal__toggle-switch">
                  <input
                    type="checkbox"
                    checked={siswaPerks.exclusiveSkins}
                    onChange={(e) =>
                      setSiswaPerks((p) => ({ ...p, exclusiveSkins: e.target.checked }))
                    }
                  />
                  <span className="admin-plan-modal__toggle-slider"></span>
                </label>
              </div>

              <div className="admin-plan-modal__perk-row">
                <div className="admin-plan-modal__perk-info">
                  <span className="admin-plan-modal__perk-name">Pengganda EXP Game</span>
                  <span className="admin-plan-modal__perk-desc">Bonus perkalian pengalaman belajar</span>
                </div>
                <input
                  type="number"
                  min="1"
                  max="5"
                  step="0.5"
                  className="admin-plan-modal__input"
                  style={{ width: "90px" }}
                  value={siswaPerks.extraExpMultiplier}
                  onChange={(e) =>
                    setSiswaPerks((p) => ({
                      ...p,
                      extraExpMultiplier: Math.max(1, parseFloat(e.target.value) || 1)
                    }))
                  }
                />
              </div>
            </>
          ) : (
            <>
              <div className="admin-plan-modal__perk-row">
                <div className="admin-plan-modal__perk-info">
                  <span className="admin-plan-modal__perk-name">Maksimal Kelas Aktif</span>
                  <span className="admin-plan-modal__perk-desc">Jumlah kelas yang bisa dikelola guru</span>
                </div>
                <input
                  type="number"
                  min="1"
                  max="100"
                  className="admin-plan-modal__input"
                  style={{ width: "90px" }}
                  value={guruPerks.maxClasses}
                  onChange={(e) =>
                    setGuruPerks((p) => ({
                      ...p,
                      maxClasses: Math.max(1, parseInt(e.target.value, 10) || 1)
                    }))
                  }
                />
              </div>

              <div className="admin-plan-modal__perk-row">
                <div className="admin-plan-modal__perk-info">
                  <span className="admin-plan-modal__perk-name">Kapasitas Siswa per Room</span>
                  <span className="admin-plan-modal__perk-desc">Batas murid dalam room belajar bersamaan</span>
                </div>
                <input
                  type="number"
                  min="5"
                  max="500"
                  className="admin-plan-modal__input"
                  style={{ width: "90px" }}
                  value={guruPerks.maxStudentsPerRoom}
                  onChange={(e) =>
                    setGuruPerks((p) => ({
                      ...p,
                      maxStudentsPerRoom: Math.max(5, parseInt(e.target.value, 10) || 5)
                    }))
                  }
                />
              </div>

              <div className="admin-plan-modal__perk-row">
                <div className="admin-plan-modal__perk-info">
                  <span className="admin-plan-modal__perk-name">Ekspor Laporan & Analitik Nilai</span>
                  <span className="admin-plan-modal__perk-desc">Unduh berkas rekap nilai siswa (Excel/PDF)</span>
                </div>
                <label className="admin-plan-modal__toggle-switch">
                  <input
                    type="checkbox"
                    checked={guruPerks.exportReports}
                    onChange={(e) =>
                      setGuruPerks((p) => ({ ...p, exportReports: e.target.checked }))
                    }
                  />
                  <span className="admin-plan-modal__toggle-slider"></span>
                </label>
              </div>

              <div className="admin-plan-modal__perk-row">
                <div className="admin-plan-modal__perk-info">
                  <span className="admin-plan-modal__perk-name">AI Question Generator</span>
                  <span className="admin-plan-modal__perk-desc">Pembuat soal kuis instan berbasis kecerdasan buatan</span>
                </div>
                <label className="admin-plan-modal__toggle-switch">
                  <input
                    type="checkbox"
                    checked={guruPerks.aiQuestionGenerator}
                    onChange={(e) =>
                      setGuruPerks((p) => ({ ...p, aiQuestionGenerator: e.target.checked }))
                    }
                  />
                  <span className="admin-plan-modal__toggle-slider"></span>
                </label>
              </div>
            </>
          )}

          {/* Custom Extra Perks */}
          {customPerks.length > 0 && (
            <div style={{ marginTop: "10px", display: "flex", flexDirection: "column", gap: "8px" }}>
              <span style={{ fontSize: "12px", fontWeight: 700, color: "#9ca3af" }}>
                FITUR TAMBAHAN (CUSTOM PERKS):
              </span>
              {customPerks.map((cp, idx) => (
                <div key={idx} className="admin-plan-modal__custom-perk-row">
                  <input
                    type="text"
                    placeholder="Nama kunci (e.g. badgeKhusus)"
                    className="admin-plan-modal__input"
                    value={cp.key}
                    onChange={(e) => handleCustomPerkChange(idx, "key", e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Nilai (e.g. true atau 100)"
                    className="admin-plan-modal__input"
                    value={cp.value}
                    onChange={(e) => handleCustomPerkChange(idx, "value", e.target.value)}
                  />
                  <button
                    type="button"
                    className="admin-plan-modal__btn-icon-del"
                    onClick={() => handleRemoveCustomPerk(idx)}
                    title="Hapus fitur ini"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          <button
            type="button"
            className="admin-plan-modal__btn-add-perk"
            onClick={handleAddCustomPerk}
          >
            + Tambah Fitur Kustom Lainnya
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default PlanModal;
