import React, { useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../component/Navbar";
import "./game.css";

// Fallback SSOT Release Changelog Data
const PATCH_RELEASES = [
  {
    version: "v1.4.0",
    date: "4 November 2026",
    isLatest: true,
    title: "Netcode High-Load Ticker & Admin Dynamic Tutorial CMS",
    summary:
      "Pembaruan performa multiplayer masif untuk menstabilkan ping di bawah lonjakan ratusan pemain sekaligus, penambahan sistem CMS tutorial di Admin Dashboard, serta implementasi URL bertanda tangan kriptografis (HMAC-SHA256).",
    changes: [
      {
        tag: "netcode",
        label: "NETCODE",
        desc: "Throttled Dirty-Check Ticker (1.5s): Pembaruan leaderboard global hanya disiarkan saat skor/koin berubah, mengurangi beban bandwidth secara signifikan."
      },
      {
        tag: "security",
        label: "KEAMANAN",
        desc: "Limiter Koneksi IP: Membatasi maksimal 20 koneksi concurrent dan 40 handshake/menit per IP untuk mencegah lag exploit dan spam bot."
      },
      {
        tag: "feature",
        label: "FITUR",
        desc: "Admin Tutorial CMS: Administrator dapat mengubah teks langkah dan link aset panduan langsung dari Dashboard Admin tanpa deploy ulang."
      },
      {
        tag: "security",
        label: "KEAMANAN",
        desc: "Signed URLs (HMAC-SHA256): Proteksi endpoint sensitif dengan URL terenkripsi dan batas waktu kadaluwarsa (expiry guard)."
      },
      {
        tag: "ui",
        label: "UI/UX",
        desc: "Perbaikan hasil tutorial (/result preview) agar tidak terpotong dan penyelarasan background login edge-to-edge."
      }
    ]
  },
  {
    version: "v1.3.0",
    date: "28 Oktober 2026",
    isLatest: false,
    title: "AI Question Generator & Teacher Classrooms",
    summary:
      "Peluncuran modul pembuatan soal otomatis berbasis AI dari dokumen PDF materi pembelajaran guru, integrasi MongoDB lifecycle, dan sistem penugasan kelas siswa.",
    changes: [
      {
        tag: "feature",
        label: "FITUR",
        desc: "AI Question Generator: Ekstraksi materi ajar PDF dan pembuatan draf soal pilihan ganda interaktif."
      },
      {
        tag: "feature",
        label: "FITUR",
        desc: "Teacher & Student Classrooms: Guru dapat membuat ruang kelas, membagikan kode kelas, dan memantau pengerjaan siswa."
      },
      {
        tag: "fix",
        label: "PERBAIKAN",
        desc: "Penanganan edge case token autentikasi dan auto-recovery sesi akun siswa."
      }
    ]
  },
  {
    version: "v1.2.0",
    date: "15 Oktober 2026",
    isLatest: false,
    title: "Audio SFX Synthesizer & Radar MiniMap HUD",
    summary:
      "Peningkatan pengalaman bermain inGame melalui Web Audio API SFX sintetis tanpa dependensi file audio eksternal dan radar minimap realtime.",
    changes: [
      {
        tag: "ui",
        label: "GAMEPLAY",
        desc: "Radar MiniMap: Visualisasi lokasi koin, posisi bot musuh, dan sesama pemain dalam arena map."
      },
      {
        tag: "feature",
        label: "AUDIO",
        desc: "Web Audio SFX Synthesizer: Efek suara ambil koin, serangan api, dan level-up yang responsif dan hemat memori."
      },
      {
        tag: "fix",
        label: "PERBAIKAN",
        desc: "Optimasi sistem rendering kamera Phaser dan pencegahan memory leak pada sprite karakter."
      }
    ]
  }
];

const FILTER_TAGS = [
  { id: "all", label: "Semua Pembaruan" },
  { id: "feature", label: "Fitur Baru" },
  { id: "netcode", label: "Gameplay & Netcode" },
  { id: "security", label: "Keamanan" },
  { id: "ui", label: "Tampilan UI/UX" }
];

const Game = () => {
  const [selectedTag, setSelectedTag] = useState("all");

  const filteredReleases = PATCH_RELEASES.map((release) => {
    if (selectedTag === "all") return release;
    const matchingChanges = release.changes.filter((c) => c.tag === selectedTag);
    return {
      ...release,
      changes: matchingChanges
    };
  }).filter((release) => release.changes.length > 0);

  return (
    <div className="game-patch-page">
      <Navbar />
      <main className="game-patch-container">
        {/* Hero Section */}
        <section className="game-patch-hero">
          <div className="game-patch-hero-content">
            <span className="game-patch-kicker">GAMUKIS UPDATE LOG</span>
            <h1>Catatan Pembaruan &amp; Patch Game</h1>
            <p>
              Pantau seluruh evolusi fitur, optimalisasi performa netcode arena multiplayer,
              serta peningkatan sistem keamanan pembelajaran interaktif di web GAMUKIS.
            </p>
            <Link
              to="/gamePage"
              state={{
                selectedCard: {
                  logo: "logo_saintek",
                  title: "Biologi",
                  subtitle: "Sains Biologi",
                  description: "Eksplorasi biologi sel, genetika molekuler, fisiologi, dan ekosistem melalui kuis interaktif.",
                  features: ["Kritis", "Kreatif", "Kolaborasi", "Teknologi dan informasi"]
                }
              }}
              className="game-patch-play-cta"
              aria-label="Masuk ke arena permainan"
            >
              <svg viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
              <span>Mainkan Sekarang</span>
            </Link>
          </div>
        </section>

        {/* Filter Categories */}
        <section className="game-patch-filters" aria-label="Kategori patch">
          {FILTER_TAGS.map((tag) => (
            <button
              key={tag.id}
              type="button"
              className={`game-patch-filter-btn ${selectedTag === tag.id ? "active" : ""}`}
              onClick={() => setSelectedTag(tag.id)}
            >
              {tag.label}
            </button>
          ))}
        </section>

        {/* Timeline List */}
        <section className="game-patch-timeline" aria-label="Daftar rilis patch">
          {filteredReleases.length === 0 ? (
            <div className="game-patch-empty">
              <p>Tidak ada catatan pembaruan untuk kategori ini.</p>
            </div>
          ) : (
            filteredReleases.map((patch) => (
              <article
                key={patch.version}
                className={`game-patch-card ${patch.isLatest ? "is-latest" : ""}`}
              >
                <div className="game-patch-card-header">
                  <div className="game-patch-version-box">
                    <h2 className="game-patch-version">{patch.version}</h2>
                    {patch.isLatest && (
                      <span className="game-patch-badge-latest">TERBARU</span>
                    )}
                  </div>
                  <time className="game-patch-date">{patch.date}</time>
                </div>

                <h3 className="game-patch-title">{patch.title}</h3>
                <p className="game-patch-summary">{patch.summary}</p>

                <div className="game-patch-changes">
                  {patch.changes.map((item, idx) => (
                    <div key={idx} className="game-patch-change-item">
                      <span className={`game-patch-tag ${item.tag}`}>
                        {item.label}
                      </span>
                      <p className="game-patch-change-desc">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </article>
            ))
          )}
        </section>
      </main>
    </div>
  );
};

export default Game;
