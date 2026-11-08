import React, { useState } from 'react';
import AnimeProfileCanvas from './atoms/AnimeProfileCanvas';
import BitdsulAnimeModal from './molecules/BitdsulAnimeModal';
import './descAffiliate.css';

const bitdsulPhoto = require('../../images/documentation/bitdsul person.jpg');
const bitdsulActivityPhotos = [
  {
    src: require('../../images/documentation/dokumentasi_1.jpg'),
    alt: 'Anggota BITDSUL berkumpul di area luar kampus',
    caption: 'Anggota tim berkumpul di area luar kampus; salah satu anggota tampak menunjuk ke arah teman-temannya.'
  },
  {
    src: require('../../images/documentation/dokumentasi_2.JPG'),
    alt: 'Anggota BITDSUL berfoto bersama di depan gedung',
    caption: 'Foto bersama di depan gedung dengan beberapa anggota berpose santai ke arah kamera.'
  },
  {
    src: require('../../images/documentation/dokumentasi_3.jpg'),
    alt: 'Enam anggota BITDSUL berfoto berjajar di depan gedung',
    caption: 'Enam anggota berdiri berjajar di depan gedung dan berpose bersama.'
  },
  {
    src: require('../../images/documentation/dokumentasi_4.jpg'),
    alt: 'Swafoto anggota BITDSUL dengan teman-teman di belakangnya',
    caption: 'Swafoto di area luar gedung; dua anggota berada dekat kamera dan anggota lain terlihat di latar.'
  }
];

// Centers are based on the six faces in the source group photo (4032 × 3024).
const bitdsulMembers = [
  { id: 3, x: 1790, y: 1260, title: 'Ketua', name: 'Farhan Hidayatul Haq', role: 'Ketua / Leader BITDSUL / Fullstack Developer / Game Dev Web', linkedin: 'https://www.linkedin.com/in/farhan-hidayatul-haq-209171170/', quote: '“Mulailah melangkah. Langkah kecil yang konsisten dapat membawa tim menuju karya yang bermanfaat.”' },
  { id: 2, x: 1290, y: 1310, name: 'Dhanu Ahsan Fatih', title: 'Wakil Ketua BITDSUL', role: 'Pembicara dan pengurus berkas', linkedin: 'https://www.linkedin.com/in/dhanu-ahsan-fatih-756860297/', quote: '“Dengarkan ide, sampaikan dengan jelas, lalu bergerak bersama untuk mewujudkannya.”' },
  { id: 5, x: 2905, y: 1280, name: 'Yuranan Risan Gartiwa', title: 'Sekretaris dan Penasihat', role: 'Dokumentator dan pengurus berkas', linkedin: 'https://www.linkedin.com/in/yuranan-tiwa/', quote: '“Catatan yang rapi menjaga ide tetap hidup dan membantu tim melangkah lebih terarah.”' },
  { id: 1, x: 685, y: 1290, name: 'Septa Firdaus Adinata', title: 'Bendahara', role: 'Keamanan', linkedin: 'https://www.linkedin.com/in/septa-firdaus-adinata-2411b9295/', quote: '“Kepercayaan tumbuh dari tanggung jawab dan kepedulian dalam setiap langkah.”' },
  { id: 4, x: 2310, y: 1290, name: 'Farhan Bachtiar Yudhayana', title: 'Dokumentator', role: 'Ketua dokumentator dan pengurus berkas', linkedin: 'https://www.linkedin.com/in/farhan-bachtiar-yudhayana-51459a296/', quote: '“Setiap momen dan detail punya cerita; dokumentasi membuatnya tetap berarti.”' },
  { id: 6, x: 3590, y: 1260, name: 'Petrus Padji Goran Lewogete', title: 'Koordinator Desainer', role: 'Desainer inti', linkedin: 'https://www.linkedin.com/in/petrus-padji-goran-lewogete-a91218325/', quote: '“Rancang dengan tujuan, ciptakan dengan hati, dan buat setiap karya memberi manfaat.”' }
];

const BitdsulMemberCard = ({ member, bitdsulPhoto, onSelect }) => {
  const { id, x, y, title, name, role, linkedin, quote } = member;
  const [isHovered, setIsHovered] = useState(false);
  const cropSize = 480;
  const portraitSize = 76;
  const scale = portraitSize / cropSize;
  const backgroundWidth = 4032 * scale;
  const backgroundHeight = 3024 * scale;

  return (
    <article
      className="bitdsul-member-card is-clickable"
      key={id}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onSelect(member)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onSelect(member); }}
      aria-label={`Buka kartu anime ${name}`}
    >
      <div className="bitdsul-member-avatar-wrapper">
        <AnimeProfileCanvas
          width={116}
          height={116}
          isHovered={isHovered}
          memberId={id}
        />
        <div
          className="bitdsul-member-photo"
          role="img"
          aria-label={`Foto wajah anggota BITDSUL ${id}`}
          style={{
            backgroundImage: `url("${bitdsulPhoto}")`,
            backgroundSize: `${backgroundWidth}px ${backgroundHeight}px`,
            backgroundPosition: `${portraitSize / 2 - x * scale}px ${portraitSize / 2 - y * scale}px`
          }}
        />
      </div>
      <div className="bitdsul-member-details">
        <div className="bitdsul-card-top-row">
          <span className="bitdsul-member-number">{title || `Anggota ${id}`}</span>
          <span className="bitdsul-anime-tap-hint">⚡ Karakter Anime</span>
        </div>
        <h4>{name}</h4>
        <p>{role || 'Peran dalam tim'}</p>
        <span className="bitdsul-member-bio">{quote}</span>
        <a
          className="bitdsul-member-linkedin"
          href={linkedin}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`LinkedIn ${name}`}
          onClick={(e) => e.stopPropagation()}
        >
          Lihat LinkedIn <span aria-hidden="true">↗</span>
        </a>
      </div>
    </article>
  );
};

const BitdsulTeam = () => {
  const [selectedMember, setSelectedMember] = useState(null);

  return (
    <section className="bitdsul-team" aria-labelledby="bitdsul-team-title">
      <div className="bitdsul-team-heading">
        <span className="affiliate-description-eyebrow">Kenali tim kami</span>
        <h3 id="bitdsul-team-title">Biodata Tim BITDSUL</h3>
        <p>Klik kartu salah satu anggota tim untuk membuka Kartu Karakter Anime dan Ultimate Skill mereka!</p>
      </div>
      <div className="bitdsul-team-grid">
        {bitdsulMembers.map((member) => (
          <BitdsulMemberCard
            key={member.id}
            member={member}
            bitdsulPhoto={bitdsulPhoto}
            onSelect={setSelectedMember}
          />
        ))}
      </div>

      {/* Interactive Anime Character Modal */}
      {selectedMember && (
        <BitdsulAnimeModal
          member={selectedMember}
          bitdsulPhoto={bitdsulPhoto}
          onClose={() => setSelectedMember(null)}
        />
      )}
    </section>
  );
};

const BitdsulActivityGallery = () => (
  <section className="bitdsul-activities" aria-labelledby="bitdsul-activities-title">
    <div className="bitdsul-team-heading">
      <span className="affiliate-description-eyebrow">Cerita dalam foto</span>
      <h3 id="bitdsul-activities-title">Dokumentasi BITDSUL</h3>
      <p>Beberapa momen kebersamaan tim yang terdokumentasi.</p>
    </div>
    <div className="bitdsul-activity-grid">
      {bitdsulActivityPhotos.map(({ src, alt, caption }, index) => (
        <figure className="bitdsul-activity-card" key={src}>
          <img src={src} alt={alt} loading="lazy" />
          <figcaption><span>Dokumentasi {index + 1}</span>{caption}</figcaption>
        </figure>
      ))}
    </div>
  </section>
);

const affiliateDescriptions = {
  AMIKOM: {
    category: 'Pendidikan dan teknologi',
    description: 'Melalui ekosistem inkubasi inovasi kampus, GAMUKIS dan Universitas AMIKOM Yogyakarta berkolaborasi dalam bidang pengembangan teknologi edukasi interaktif (EdTech) dan gim pembelajaran. Kegiatan ini bertujuan untuk meningkatkan literasi sains, sosial, dan bahasa melalui riset terapan serta uji coba platform pembelajaran berbasis gamifikasi bagi pelajar Indonesia.'
  },
  IEEE: {
    category: 'Teknologi dan rekayasa',
    description: 'Kolaborasi GAMUKIS dan komunitas IEEE Student Branch diwujudkan melalui lokakarya rekayasa perangkat lunak yang berfokus pada arsitektur sistem terdistribusi, kecerdasan buatan (AI), dan standar teknis pengembangan web modern. Program ini melibatkan mahasiswa dan pengembang muda dalam riset dan publikasi teknologi pendidikan.'
  },
  P2MW: {
    category: 'Pengembangan kewirausahaan',
    description: 'Melalui Program Pembinaan Mahasiswa Wirausaha (P2MW), GAMUKIS didukung dalam akselerasi produk edugame digital yang berkelanjutan. Kerja sama ini mencakup pendampingan bisnis, validasi pasar sekolah, dan penguatan ekosistem kelas interaktif untuk memperluas dampak pendidikan berkualitas di Indonesia.'
  },
  BITDSUL: {
    category: 'Komunitas dan kolaborasi tim',
    description: 'BITDSUL adalah cikal bakal terciptanya GAMUKIS yang berawal dari tim belajar sesaat, lalu berubah menjadi sebuah komunitas kecil yang berinovasi untuk menciptakan sesuatu yang bermanfaat bersama. Moto BITDSUL adalah, “Mulailah melangkah walaupun seperti kura-kura berjalan.”'
  }
};

const DescAffiliate = ({ partner }) => {
  const content = affiliateDescriptions[partner] || affiliateDescriptions.AMIKOM;

  return (
    <section className="affiliate-description" aria-live="polite" aria-atomic="true">
      <div className="affiliate-description-heading">
        <span className="affiliate-description-eyebrow">Mitra kolaborasi</span>
        <h2>{partner}</h2>
        <span className="affiliate-description-category">{content.category}</span>
      </div>
      <p>{content.description}</p>
      {partner !== 'BITDSUL' && <figure className="affiliate-photo">
        <div className="affiliate-photo-placeholder" role="img" aria-label={`Tempat foto kegiatan bersama ${partner}`}>
          <svg viewBox="0 0 48 48" aria-hidden="true" focusable="false">
            <rect x="5" y="9" width="38" height="30" rx="5" />
            <circle cx="17" cy="19" r="3.5" />
            <path d="M9 34l10-9 6 5 5-4 9 8" />
          </svg>
          <strong>Tempat foto kegiatan</strong>
          <span>Tambahkan foto kolaborasi {partner} di sini</span>
        </div>
        <figcaption>Dokumentasi kegiatan bersama {partner}</figcaption>
      </figure>}
      {partner === 'BITDSUL' && <>
        <BitdsulTeam />
        <BitdsulActivityGallery />
      </>}
    </section>
  );
};

export default DescAffiliate;
