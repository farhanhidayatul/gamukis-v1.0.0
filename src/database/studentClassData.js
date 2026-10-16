// Frontend/src/database/studentClassData.js
// Sesuai aturan arsitektur PRD: Seluruh data fetching diletakkan di Frontend/src/database/

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Fallback catalog if backend is offline or during offline testing
export const FALLBACK_CLASS_CATEGORIES = [
  {
    category: 'SAINTEK',
    label: 'Sains & Teknologi',
    description: 'Matematika, Fisika, Kimia, Biologi, Informatika dengan pemecahan masalah analitis.',
    icon: 'logo_saintek',
    subjectCount: 5
  },
  {
    category: 'SOSHUM',
    label: 'Sosial & Humaniora',
    description: 'Sejarah, Geografi, Ekonomi, Sosiologi untuk memahami dinamika kemanusiaan.',
    icon: 'logo_soshum',
    subjectCount: 4
  },
  {
    category: 'BAHASA',
    label: 'Bahasa & Literasi',
    description: '8 bahasa lengkap: Indonesia, Inggris, Jawa, Prancis, Jerman, Mandarin, Spanyol, Melayu.',
    icon: 'logo_bahasa',
    subjectCount: 8
  }
];

export const FALLBACK_CLASSES = [
  // --- BAHASA (8 MATA PELAJARAN LENGKAP) ---
  {
    id: 'bahasa-indonesia',
    slug: 'bahasa-indonesia',
    title: 'Bahasa Indonesia',
    category: 'BAHASA',
    categoryLabel: 'Bahasa & Literasi',
    level: 'Dasar - Mahir',
    totalDuration: '20 Jam',
    totalModules: 16,
    rating: 4.9,
    enrolledCount: 2150,
    badge: 'Wajib Nasional',
    instructor: { name: 'Dr. Sri Mulyati, M.Pd.', title: 'Ahli Linguistik & Sastra Indonesia', avatar: '🇮🇩' },
    description: 'Pendalaman tata bahasa baku (PUEBI/EYD V), morfologi, sintaksis kalimat efektif, analisis teks eksposisi, argumentasi, anekdot, resensi, dan apresiasi karya sastra prosa serta puisi.',
    learningObjectives: [
      'Menerapkan kaidah ejaan bahasa Indonesia yang disempurnakan (EYD Edisi V) secara presisi.',
      'Menyusun kalimat efektif dengan struktur subjek, predikat, objek, dan keterangan yang padu.',
      'Menganalisis ide pokok, simpulan tersirat, dan fakta-opini dalam teks editorial.',
      'Mengapresiasi gaya bahasa (majas ironi, metafora, hiperbola) dalam karya sastra.'
    ],
    skillsAcquired: ['PUEBI/EYD V', 'Kalimat Efektif', 'Literasi Kritis', 'Menulis Kreatif'],
    syllabus: [
      {
        chapterNumber: 1,
        title: 'PUEBI & Tata Kalimat Efektif',
        duration: '4 Jam',
        difficulty: 'Dasar',
        summary: 'Penulisan huruf kapital, kata serapan, tanda baca titik koma/titik dua, dan kehematan kata.',
        lessons: [
          { id: 'bind-1-1', title: 'Kaidah EYD V: Penulisan Huruf dan Kata Gabung', duration: '40 Menit', type: 'interactive' },
          { id: 'bind-1-2', title: 'Ciri Kalimat Efektif: Keparalelan & Ketegasan', duration: '45 Menit', type: 'video' },
          { id: 'bind-1-3', title: 'Uji Mandiri Kalimat Rancang Bangun', duration: '35 Menit', type: 'quiz' }
        ]
      },
      {
        chapterNumber: 2,
        title: 'Analisis Ragam Teks & Teks Anekdot',
        duration: '5 Jam',
        difficulty: 'Sedang',
        summary: 'Struktur teks LHO, teks eksposisi, dan retorika sindiran anekdot.',
        lessons: [
          { id: 'bind-2-1', title: 'Teks Laporan Hasil Observasi: Definisi vs Deskripsi', duration: '45 Menit', type: 'interactive' },
          { id: 'bind-2-2', title: 'Retorika Anekdot & Majas Sindiran', duration: '50 Menit', type: 'video' }
        ]
      }
    ],
    interactiveModules: [
      { id: 'mod-bind-1', title: 'Prinsip Keparalelan Kalimat', content: 'Unsur rincian harus berimbuhan sama, e.g., pembersihan, perapihan, penataan.' }
    ],
    miniQuiz: [
      {
        id: 'quiz-bind-1',
        question: 'Manakah kalimat berikut yang merupakan contoh kalimat efektif?',
        options: [
          'Bagi para siswa-siswa diharapkan segera berkumpul.',
          'Para siswa diharapkan segera berkumpul di aula sekolah.',
          'Untuk mempersingkat waktu, acara kita lanjutkan.',
          'Rapat itu membahas daripada masalah kebersihan.'
        ],
        correct: 'Para siswa diharapkan segera berkumpul di aula sekolah.',
        explanation: 'Pilihan ini hemat kata dan memiliki subjek serta predikat yang logis tanpa pleonasme.',
        difficulty: 'easy'
      }
    ]
  },
  {
    id: 'bahasa-inggris',
    slug: 'bahasa-inggris',
    title: 'Bahasa Inggris',
    category: 'BAHASA',
    categoryLabel: 'Bahasa & Literasi',
    level: 'Dasar - Lanjutan',
    totalDuration: '24 Jam',
    totalModules: 18,
    rating: 4.9,
    enrolledCount: 2400,
    badge: 'Global Communication',
    instructor: { name: 'Arthur Pendelton, M.A. TESOL', title: 'Senior English Language Specialist', avatar: '🇬🇧' },
    description: 'Mengembangkan kemahiran tata bahasa (tenses, conditionals, passive voice, reported speech), vocabulary akademis (CEFR B1-C1), reading comprehension kritis, serta teknik listening dialog internasional.',
    learningObjectives: [
      'Menguasai penggunaan 12 tenses dan klausa kondisional (Type 0, 1, 2, 3) secara fasih.',
      'Memahami gagasan utama, inferensi konteks, dan nada penulis dalam esai bahasa Inggris.',
      'Menyusun paragraf argumentatif menggunakan transitional phrases yang kohesif.'
    ],
    skillsAcquired: ['Academic English', 'Grammar & Syntax', 'Critical Reading', 'CEFR Proficiency'],
    syllabus: [
      {
        chapterNumber: 1,
        title: 'Mastering Tenses & Sentence Structures',
        duration: '5 Jam',
        difficulty: 'Sedang',
        summary: 'Present perfect continuous, past perfect vs simple past, future forms, and inversion.',
        lessons: [
          { id: 'eng-1-1', title: 'Perfect vs Continuous Aspects Demystified', duration: '45 Menit', type: 'interactive' },
          { id: 'eng-1-2', title: 'Subject-Verb Agreement in Complex Clauses', duration: '50 Menit', type: 'video' }
        ]
      }
    ],
    interactiveModules: [
      { id: 'mod-eng-1', title: 'Conditionals Rule', content: 'Type 3: If + past perfect, would have + V3 (e.g. If I had known, I would have told you).' }
    ],
    miniQuiz: [
      {
        id: 'quiz-eng-1',
        question: 'If she _____ harder yesterday, she would have passed the final exam.',
        options: ['studied', 'had studied', 'studies', 'would study'],
        correct: 'had studied',
        explanation: 'Third conditional describes an unreal past event with If + past perfect.',
        difficulty: 'medium'
      }
    ]
  },
  {
    id: 'bahasa-jawa',
    slug: 'bahasa-jawa',
    title: 'Bahasa Jawa',
    category: 'BAHASA',
    categoryLabel: 'Bahasa & Literasi',
    level: 'Dasar - Menengah',
    totalDuration: '16 Jam',
    totalModules: 12,
    rating: 4.8,
    enrolledCount: 920,
    badge: 'Budaya Lokal',
    instructor: { name: 'Ki Danang Setyadi, S.Pd., M.Hum.', title: 'Budayawan & Pengajar Sastra Jawa', avatar: '🎭' },
    description: 'Sinau Unggah-Ungguh Basa Jawa (Ngoko Lugu, Ngoko Alus, Krama Lugu, Krama Alus/Inggil), maca lan nulis Aksara Jawa (sandhangan, pasangan, rekan, murda), tembang macapat, sarta paribasan Jawa.',
    learningObjectives: [
      'Mbedakake tataran basa Jawa: Ngoko, Krama Madya, lan Krama Inggil miturut tata krama.',
      'Maca lan nulis teks ukara migunakake Aksara Jawa jangkep sandhangan lan pasangan.',
      'Mangerteni paugeran tembang macapat: guru gatra, guru wilangan, lan guru lagu.'
    ],
    skillsAcquired: ['Unggah-Ungguh Basa', 'Aksara Jawa', 'Tembang Macapat', 'Paribasan Jawa'],
    syllabus: [
      {
        chapterNumber: 1,
        title: 'Unggah-Ungguh Basa Jawa',
        duration: '4 Jam',
        difficulty: 'Sedang',
        summary: 'Panganggone tembung krama marang wong tuwa, guru, lan kanca sapadha-padha.',
        lessons: [
          { id: 'jaw-1-1', title: 'Paugeran Ngoko Alus vs Krama Alus', duration: '45 Menit', type: 'interactive' },
          { id: 'jaw-1-2', title: 'Pacelathon Padinan Basa Jawa', duration: '40 Menit', type: 'video' }
        ]
      }
    ],
    interactiveModules: [
      { id: 'mod-jaw-1', title: 'Paugeran Pocung', content: 'Guru gatra: 4 | Guru wilangan & lagu: 12u, 6a, 8i, 12a.' }
    ],
    miniQuiz: [
      {
        id: 'quiz-jaw-1',
        question: "Ukara 'Bapak nembe mangan sega goreng', yen diowahi dadi krama alus kang trep yaiku...",
        options: [
          'Bapak nembe nedha sekul goreng.',
          'Bapak saweg dhahar sekul goreng.',
          'Bapak nembe dhahar sega goreng.',
          'Bapak saweg nedha sega goreng.'
        ],
        correct: 'Bapak saweg dhahar sekul goreng.',
        explanation: "Kanggo wong tuwa (Bapak) nggunakake tembung krama alus: 'mangan' dadi 'dhahar', 'sega' dadi 'sekul'.",
        difficulty: 'medium'
      }
    ]
  },
  {
    id: 'bahasa-prancis',
    slug: 'bahasa-prancis',
    title: 'Bahasa Prancis',
    category: 'BAHASA',
    categoryLabel: 'Bahasa & Literasi',
    level: 'Dasar - Menengah (A1-A2)',
    totalDuration: '18 Jam',
    totalModules: 14,
    rating: 4.8,
    enrolledCount: 760,
    badge: 'Eropa Kontinental',
    instructor: { name: 'Claire Dubois, M.A. FLE', title: 'Enseignante de Français Langue Étrangère', avatar: '🇫🇷' },
    description: 'Apprendre le français dès le début: salutations, articles définis/indéfinis, conjugaison des verbes du 1er, 2e et 3e groupe (Présent, Passé Composé), vocabulaire du quotidien et culture française.',
    learningObjectives: [
      'Menguasai pelafalan alfabet Prancis, nasal sounds, dan liaison dasar.',
      'Melakukan konjugasi kata kerja penting: être, avoir, aller, faire dalam waktu kini (présent).',
      'Memperkenalkan diri, memesan di restoran, dan menanyakan arah dalam bahasa Prancis.'
    ],
    skillsAcquired: ['French Phonetics', 'Conjugaison des Verbes', 'Salutations & Quotidien'],
    syllabus: [
      {
        chapterNumber: 1,
        title: 'Les Bases: Salutations et Verbes Essentiels',
        duration: '4 Jam',
        difficulty: 'Dasar',
        summary: 'Bonjour, au revoir, comment ça va, konjugasi verbe être et avoir.',
        lessons: [
          { id: 'fra-1-1', title: "L'alphabet français et les sons nasaux", duration: '40 Menit', type: 'interactive' },
          { id: 'fra-1-2', title: 'Être et Avoir au présent', duration: '45 Menit', type: 'video' }
        ]
      }
    ],
    interactiveModules: [
      { id: 'mod-fra-1', title: 'Verbe Être', content: 'Je suis, Tu es, Il/Elle est, Nous sommes, Vous êtes, Ils/Elles sont.' }
    ],
    miniQuiz: [
      {
        id: 'quiz-fra-1',
        question: "Bagaimanakah konjugasi yang tepat untuk subjek 'Nous' pada kata kerja 'être' waktu kini?",
        options: ['Nous sommes', 'Nous êtes', 'Nous avons', 'Nous ont'],
        correct: 'Nous sommes',
        explanation: "Konjugasi kata kerja être untuk subjek nous adalah 'nous sommes'.",
        difficulty: 'easy'
      }
    ]
  },
  {
    id: 'bahasa-jerman',
    slug: 'bahasa-jerman',
    title: 'Bahasa Jerman',
    category: 'BAHASA',
    categoryLabel: 'Bahasa & Literasi',
    level: 'Dasar - Menengah (A1-A2)',
    totalDuration: '18 Jam',
    totalModules: 14,
    rating: 4.7,
    enrolledCount: 690,
    badge: 'Eropa Tengah',
    instructor: { name: 'Wolfgang Becker, M.Ed. DaF', title: 'Dosen Deutsch als Fremdsprache', avatar: '🇩🇪' },
    description: 'Belajar tata bahasa Jerman terstruktur: der/die/das (kasus Nominativ, Akkusativ, Dativ), trennbare Verben, susunan kalimat Hauptsatz dan Nebensatz, angka, jam, dan komunikasi praktis di Jerman.',
    learningObjectives: [
      "Membedakan artikel benda Jerman (Maskulin 'der', Feminin 'die', Netral 'das').",
      'Memahami perubahan artikel pada kasus Nominativ, Akkusativ, dan Dativ.',
      'Menyusun kalimat sederhana dengan posisi kata kerja di posisi kedua (Verb-Zweit-Stellung).'
    ],
    skillsAcquired: ['Deutsche Grammatik', 'Akkusativ & Dativ', 'Satzstruktur'],
    syllabus: [
      {
        chapterNumber: 1,
        title: 'Artikel dan Kasus Nominativ - Akkusativ',
        duration: '4 Jam',
        difficulty: 'Sedang',
        summary: 'Perubahan der -> den pada kasus Akkusativ untuk objek langsung maskulin.',
        lessons: [
          { id: 'ger-1-1', title: 'Bestimmter und unbestimmter Artikel', duration: '45 Menit', type: 'interactive' },
          { id: 'ger-1-2', title: 'Akkusativ: Mengidentifikasi Objek Langsung', duration: '40 Menit', type: 'video' }
        ]
      }
    ],
    interactiveModules: [
      { id: 'mod-ger-1', title: 'Akkusativ Maskulin', content: 'der -> den, ein -> einen untuk objek maskulin langsung.' }
    ],
    miniQuiz: [
      {
        id: 'quiz-ger-1',
        question: "Lengkapi kalimat: 'Ich habe _____ Apfel (maskulin: der Apfel)'.",
        options: ['einen', 'ein', 'eine', 'einem'],
        correct: 'einen',
        explanation: "Karena Apfel adalah maskulin (der Apfel) dan berfungsi sebagai objek langsung, artikel berubah menjadi 'einen'.",
        difficulty: 'medium'
      }
    ]
  },
  {
    id: 'bahasa-mandarin',
    slug: 'bahasa-mandarin',
    title: 'Bahasa Mandarin',
    category: 'BAHASA',
    categoryLabel: 'Bahasa & Literasi',
    level: 'Dasar - Menengah (HSK 1-3)',
    totalDuration: '22 Jam',
    totalModules: 16,
    rating: 4.9,
    enrolledCount: 1540,
    badge: 'Asia Timur & Karir',
    instructor: { name: 'Chen Wei, B.A., M.TCSOL', title: 'Spesialis Pengajaran Mandarin HSK', avatar: '🇨🇳' },
    description: 'Pembelajaran bahasa Mandarin komprehensif: Sistem Pinyin, 4 nada (shēngdiào), goresan dasar aksara Hanzi (bihua), tata bahasa kalimat SVO, bilangan, kata bantu ukuran, dan dialog praktis.',
    learningObjectives: [
      'Menguasai sistem Pinyin beserta 4 nada intonasi dan nada netral secara akurat.',
      'Menulis dan mengenali minimal 150 karakter Hanzi dasar HSK Level 1.',
      'Menggunakan kata bantu bilangan (measure words) seperti 个 (gè), 本 (běn), 张 (zhāng) dengan tepat.'
    ],
    skillsAcquired: ['Pinyin & Tones Mastery', 'Hanzi Characters', 'HSK Preparation'],
    syllabus: [
      {
        chapterNumber: 1,
        title: 'Pinyin, 4 Nada & Goresan Hanzi Dasar',
        duration: '5 Jam',
        difficulty: 'Sedang',
        summary: 'Inisial (shengmu), final (yunmu), aturan perubahan nada ke-3, dan 8 goresan utama Hanzi.',
        lessons: [
          { id: 'man-1-1', title: 'Pelafalan 4 Nada Pinyin', duration: '45 Menit', type: 'interactive' },
          { id: 'man-1-2', title: 'Urutan Goresan Hanzi Dasar', duration: '50 Menit', type: 'video' }
        ]
      }
    ],
    interactiveModules: [
      { id: 'mod-man-1', title: '4 Nada Mandarin', content: 'Nada 1: Datar (ā), Nada 2: Naik (á), Nada 3: Melengkung (ǎ), Nada 4: Menukik (à).' }
    ],
    miniQuiz: [
      {
        id: 'quiz-man-1',
        question: "Kata sapaan umum 'Halo' atau 'Apa kabar' dalam bahasa Mandarin Pinyin ditulis sebagai...",
        options: ['Nǐ hǎo', 'Xièxie', 'Zàijiàn', 'Duìbuqǐ'],
        correct: 'Nǐ hǎo',
        explanation: '你好 (Nǐ hǎo) adalah sapaan paling mendasar dalam bahasa Mandarin.',
        difficulty: 'easy'
      }
    ]
  },
  {
    id: 'bahasa-spanyol',
    slug: 'bahasa-spanyol',
    title: 'Bahasa Spanyol',
    category: 'BAHASA',
    categoryLabel: 'Bahasa & Literasi',
    level: 'Dasar - Menengah (DELE A1-A2)',
    totalDuration: '18 Jam',
    totalModules: 14,
    rating: 4.8,
    enrolledCount: 820,
    badge: 'Hispanik Dunia',
    instructor: { name: 'Sofia Rodriguez, Lic. Filología', title: 'Instruktur Bahasa Spanyol & Budaya Hispanik', avatar: '🇪🇸' },
    description: 'Belajar bahasa Spanyol (Español): fonetik vokal bersih, kata benda bergender (-o/-a), konjugasi verba reguler -ar/-er/-ir, perbedaan ser vs estar, percakapan sehari-hari dan kebudayaan Amerika Latin serta Spanyol.',
    learningObjectives: [
      "Menguasai perbedaan pemakaian kata kerja 'Ser' (sifat permanen) dan 'Estar' (kondisi sementara/lokasi).",
      'Melakukan konjugasi kata kerja berakhiran -ar, -er, dan -ir pada waktu kini (Presente de Indicativo).',
      'Berkomunikasi aktif dalam skenario perkenalan, belanja, dan perjalanan.'
    ],
    skillsAcquired: ['Spanish Verb Conjugation', 'Ser vs Estar', 'Conversación Básica'],
    syllabus: [
      {
        chapterNumber: 1,
        title: 'Fundamentos: Ser vs Estar & Verbos Regulares',
        duration: '4 Jam',
        difficulty: 'Dasar',
        summary: 'Perkenalan diri, alfabet spanyol, aturan gender kata benda, dan pemakaian ser vs estar.',
        lessons: [
          { id: 'spa-1-1', title: 'Pronunciación y el Alfabeto Español', duration: '35 Menit', type: 'interactive' },
          { id: 'spa-1-2', title: 'Ser vs Estar con Ejemplos', duration: '50 Menit', type: 'video' }
        ]
      }
    ],
    interactiveModules: [
      { id: 'mod-spa-1', title: 'Ser vs Estar', content: 'Ser untuk karakteristik permanen; Estar untuk lokasi dan emosi sementara.' }
    ],
    miniQuiz: [
      {
        id: 'quiz-spa-1',
        question: "Untuk menyatakan lokasi 'Saya sedang di perpustakaan' dalam bahasa Spanyol digunakan...",
        options: ['Estoy en la biblioteca', 'Soy en la biblioteca', 'Tengo en la biblioteca', 'Voy en la biblioteca'],
        correct: 'Estoy en la biblioteca',
        explanation: "Kata kerja 'Estar' digunakan untuk menyatakan lokasi tempat keberadaan.",
        difficulty: 'easy'
      }
    ]
  },
  {
    id: 'bahasa-melayu',
    slug: 'bahasa-melayu',
    title: 'Bahasa Melayu',
    category: 'BAHASA',
    categoryLabel: 'Bahasa & Literasi',
    level: 'Dasar - Menengah',
    totalDuration: '16 Jam',
    totalModules: 12,
    rating: 4.8,
    enrolledCount: 710,
    badge: 'Serumpun Nusantara',
    instructor: { name: 'Zulkifli bin Ismail, M.A.', title: 'Penyelidik Bahasa Melayu Serumpun', avatar: '🇲🇾' },
    description: 'Mempelajari tatabahasa Dewan Bahasa Melayu serumpun, perbandingan kosa kata Bahasa Melayu baku dan Bahasa Indonesia, imbuhan meN-, peN-, ber-, pantun empat kerat, peribahasa serumpun, serta laras bahasa rasmi.',
    learningObjectives: [
      'Memahami perbedaan semantik kosa kata seiras antara Bahasa Melayu dan Bahasa Indonesia.',
      'Menguasai hukum tatabahasa frasa sendi nama dan sistem imbuhan Bahasa Melayu.',
      'Menganalisis makna kiasan dalam pantun nasihat dan peribahasa Melayu klasik.'
    ],
    skillsAcquired: ['Tatabahasa Melayu', 'Kosa Kata Serumpun', 'Pantun & Peribahasa'],
    syllabus: [
      {
        chapterNumber: 1,
        title: 'Tatabahasa & Perbandingan Kosa Kata Serumpun',
        duration: '4 Jam',
        difficulty: 'Dasar',
        summary: 'Perbandingan istilah seiras dan kaidah imbuhan Tatabahasa Dewan.',
        lessons: [
          { id: 'mel-1-1', title: 'Kosa Kata Seiras tapi Berbeda Makna', duration: '40 Menit', type: 'interactive' },
          { id: 'mel-1-2', title: 'Sistem Imbuhan meN- dan peN-', duration: '45 Menit', type: 'video' }
        ]
      }
    ],
    interactiveModules: [
      { id: 'mod-mel-1', title: 'Peribahasa Serumpun', content: 'Bagai aur dengan tebing = saling tolong menolong dalam kebaikan.' }
    ],
    miniQuiz: [
      {
        id: 'quiz-mel-1',
        question: "Dalam bahasa Melayu baku, perkataan yang bermaksud 'kantor' dalam bahasa Indonesia adalah...",
        options: ['Pejabat', 'Kedai', 'Bengkel', 'Wisma'],
        correct: 'Pejabat',
        explanation: "Dalam bahasa Melayu baku, 'pejabat' merujuk kepada bangunan atau ruangan tempat bekerja (kantor).",
        difficulty: 'medium'
      }
    ]
  },

  // --- SAINTEK ---
  {
    id: 'saintek-matematika',
    slug: 'matematika-saintek',
    title: 'Matematika Saintek',
    category: 'SAINTEK',
    categoryLabel: 'Sains & Teknologi',
    level: 'Menengah - Lanjutan',
    totalDuration: '24 Jam',
    totalModules: 18,
    rating: 4.8,
    enrolledCount: 1420,
    badge: 'Populer',
    instructor: { name: 'Dr. Hendra Wijaya, M.Sc.', title: 'Spesialis Kalkulus & Aljabar', avatar: '👨‍🏫' },
    description: 'Kalkulus diferensial dan integral, trigonometri analitik, vektor, polinomial, serta matriks untuk persiapan ujian akademik sains.',
    learningObjectives: [
      'Menguasai teknik diferensiasi dan integrasi fungsi aljabar serta trigonometri.',
      'Menganalisis sifat geometri analitik ruang dan operasi vektor.'
    ],
    skillsAcquired: ['Analytical Thinking', 'Calculus Mastery', 'Complex Problem Solving'],
    syllabus: [
      {
        chapterNumber: 1,
        title: 'Kalkulus Diferensial Lanjutan',
        duration: '4 Jam',
        difficulty: 'Sedang',
        summary: 'Turunan fungsi implisit, aturan rantai, dan optimasi nilai ekstrem.',
        lessons: [
          { id: 'mat-1-1', title: 'Aturan Rantai dan Turunan Parsial', duration: '45 Menit', type: 'interactive' }
        ]
      }
    ],
    interactiveModules: [
      { id: 'mod-mat-1', title: 'Formula Integral', content: '∫ x^n dx = (1/(n+1)) x^(n+1) + C untuk n ≠ -1.' }
    ],
    miniQuiz: [
      {
        id: 'quiz-mat-1',
        question: 'Hasil dari integral ∫ 4x^3 dx adalah...',
        options: ['x^4 + C', '12x^2 + C', '4x^4 + C', 'x^3 + C'],
        correct: 'x^4 + C',
        explanation: '∫ 4x^3 dx = 4 * (x^4 / 4) + C = x^4 + C.',
        difficulty: 'easy'
      }
    ]
  },
  {
    id: 'saintek-fisika',
    slug: 'fisika-saintek',
    title: 'Fisika',
    category: 'SAINTEK',
    categoryLabel: 'Sains & Teknologi',
    level: 'Menengah',
    totalDuration: '20 Jam',
    totalModules: 16,
    rating: 4.7,
    enrolledCount: 1180,
    badge: 'Eksperimental',
    instructor: { name: 'Ir. Bambang Santoso, M.T.', title: 'Praktisi Mekanika', avatar: '🔬' },
    description: 'Mekanika klasik Newton, dinamika fluida, gelombang elektromagnetik, optika, serta termodinamika secara terukur.',
    learningObjectives: ['Menganalisis hukum gerak Newton dan hukum kekekalan energi mekanik.'],
    skillsAcquired: ['Scientific Modeling', 'Fluid Dynamics'],
    syllabus: [{ chapterNumber: 1, title: 'Mekanika Partikel', duration: '4 Jam', difficulty: 'Sedang', summary: 'Hukum Newton dan usaha energi.', lessons: [{ id: 'fis-1-1', title: 'Hukum II Newton', duration: '45 Menit', type: 'interactive' }] }],
    interactiveModules: [{ id: 'mod-fis-1', title: 'Hukum Newton I', content: 'Benda diam tetap diam jika resultan gaya = 0.' }],
    miniQuiz: [{ id: 'quiz-fis-1', question: 'Jika resultan gaya bernilai nol, maka benda...', options: ['Diam atau v konstan', 'Dipercepat', 'Pasti diam', 'Berputar'], correct: 'Diam atau v konstan', explanation: 'Hukum I Newton (Inersia).', difficulty: 'easy' }]
  },
  {
    id: 'saintek-kimia',
    slug: 'kimia-saintek',
    title: 'Kimia',
    category: 'SAINTEK',
    categoryLabel: 'Sains & Teknologi',
    level: 'Menengah',
    totalDuration: '18 Jam',
    totalModules: 14,
    rating: 4.6,
    enrolledCount: 950,
    badge: 'Laboratorium',
    instructor: { name: 'Dr. Siti Rahmawati, S.Si.', title: 'Peneliti Kimia Analitik', avatar: '🧪' },
    description: 'Struktur atom, ikatan kimia, stoikiometri, laju reaksi, kesetimbangan kimia, dan sifat koligatif larutan.',
    learningObjectives: ['Menyetarakan persamaan reaksi redoks dan menghitung mol stoikiometris.'],
    skillsAcquired: ['Stoichiometry', 'Chemical Equilibrium'],
    syllabus: [{ chapterNumber: 1, title: 'Stoikiometri Larutan', duration: '4 Jam', difficulty: 'Sedang', summary: 'Konsep mol dan konsentrasi.', lessons: [{ id: 'kim-1-1', title: 'Konsep Mol', duration: '40 Menit', type: 'interactive' }] }],
    interactiveModules: [{ id: 'mod-kim-1', title: 'Massa Molar Air', content: 'Mr H2O = 18 g/mol.' }],
    miniQuiz: [{ id: 'quiz-kim-1', question: 'Massa molar (Mr) dari H2O adalah...', options: ['18 g/mol', '17 g/mol', '20 g/mol', '16 g/mol'], correct: '18 g/mol', explanation: '2*1 + 16 = 18 g/mol.', difficulty: 'easy' }]
  },
  {
    id: 'saintek-biologi',
    slug: 'biologi-saintek',
    title: 'Biologi',
    category: 'SAINTEK',
    categoryLabel: 'Sains & Teknologi',
    level: 'Menengah',
    totalDuration: '22 Jam',
    totalModules: 16,
    rating: 4.8,
    enrolledCount: 1350,
    badge: 'Hayati',
    instructor: { name: 'Dra. Nurul Hidayah, M.Biomed.', title: 'Dosen Biologi Sel', avatar: '🌿' },
    description: 'Biologi seluler, metabolisme respirasi dan fotosintesis, genetika Mendel, dan ekologi biosfer.',
    learningObjectives: ['Mengidentifikasi organel sel dan fungsinya.'],
    skillsAcquired: ['Cellular Biology', 'Genetics Mapping'],
    syllabus: [{ chapterNumber: 1, title: 'Biologi Sel', duration: '4 Jam', difficulty: 'Dasar', summary: 'Struktur sel dan organel.', lessons: [{ id: 'bio-1-1', title: 'Membran Sel', duration: '35 Menit', type: 'interactive' }] }],
    interactiveModules: [{ id: 'mod-bio-1', title: 'Mitokondria', content: 'Organel penghasil ATP sel.' }],
    miniQuiz: [{ id: 'quiz-bio-1', question: 'Organel tempat sintesis ATP adalah...', options: ['Mitokondria', 'Ribosom', 'Lisosom', 'Golgi'], correct: 'Mitokondria', explanation: 'Mitokondria adalah pusat respirasi sel.', difficulty: 'easy' }]
  },
  {
    id: 'saintek-informatika',
    slug: 'informatika-saintek',
    title: 'Informatika',
    category: 'SAINTEK',
    categoryLabel: 'Sains & Teknologi',
    level: 'Menengah - Lanjutan',
    totalDuration: '26 Jam',
    totalModules: 20,
    rating: 4.9,
    enrolledCount: 1680,
    badge: 'Digital',
    instructor: { name: 'Arya Pratama, M.Kom.', title: 'Software Engineer', avatar: '💻' },
    description: 'Berpikir komputasional, algoritma pencarian dan pengurutan, struktur data, dan logika boolean.',
    learningObjectives: ['Mendesain algoritma dengan efisiensi Big-O yang optimal.'],
    skillsAcquired: ['Computational Thinking', 'Algorithm Optimization'],
    syllabus: [{ chapterNumber: 1, title: 'Algoritma & Kompleksitas', duration: '4 Jam', difficulty: 'Sedang', summary: 'Analisis Big-O.', lessons: [{ id: 'inf-1-1', title: 'Big-O Analysis', duration: '45 Menit', type: 'interactive' }] }],
    interactiveModules: [{ id: 'mod-inf-1', title: 'Binary Search', content: 'Kompleksitas O(log n) pada array terurut.' }],
    miniQuiz: [{ id: 'quiz-inf-1', question: 'Kompleksitas Binary Search adalah...', options: ['O(log n)', 'O(n)', 'O(n^2)', 'O(1)'], correct: 'O(log n)', explanation: 'Pencarian biner membagi ruang menjadi dua.', difficulty: 'easy' }]
  },

  // --- SOSHUM ---
  {
    id: 'soshum-sejarah',
    slug: 'sejarah-soshum',
    title: 'Sejarah',
    category: 'SOSHUM',
    categoryLabel: 'Sosial & Humaniora',
    level: 'Menengah',
    totalDuration: '16 Jam',
    totalModules: 12,
    rating: 4.7,
    enrolledCount: 890,
    badge: 'Kronologis',
    instructor: { name: 'Drs. Kuncoro Hadi, M.Hum.', title: 'Sejarawan Nasional', avatar: '🏛️' },
    description: 'Peradaban maritim kuno, pergerakan kemerdekaan nusantara, dan dinamika geopolitik modern.',
    learningObjectives: ['Menganalisis metodologi penelitian sejarah dan kritik sumber.'],
    skillsAcquired: ['Historical Analysis', 'Source Criticism'],
    syllabus: [{ chapterNumber: 1, title: 'Metode Penelitian Sejarah', duration: '3 Jam', difficulty: 'Dasar', summary: 'Heuristik, kritik, interpretasi, historiografi.', lessons: [{ id: 'sej-1-1', title: 'Kritik Sumber', duration: '40 Menit', type: 'interactive' }] }],
    interactiveModules: [{ id: 'mod-sej-1', title: 'Tahapan Sejarah', content: 'Heuristik -> Kritik -> Interpretasi -> Historiografi.' }],
    miniQuiz: [{ id: 'quiz-sej-1', question: 'Tahap pengujian keaslian sumber sejarah disebut...', options: ['Verifikasi/Kritik', 'Heuristik', 'Historiografi', 'Periodisasi'], correct: 'Verifikasi/Kritik', explanation: 'Kritik menguji keaslian data.', difficulty: 'easy' }]
  },
  {
    id: 'soshum-geografi',
    slug: 'geografi-soshum',
    title: 'Geografi',
    category: 'SOSHUM',
    categoryLabel: 'Sosial & Humaniora',
    level: 'Menengah',
    totalDuration: '18 Jam',
    totalModules: 14,
    rating: 4.6,
    enrolledCount: 780,
    badge: 'Geospasial',
    instructor: { name: 'Rina Kusuma, M.Sc.', title: 'Ahli Geospasial', avatar: '🌍' },
    description: 'Litosfer, atmosfer, hidrosfer, pedosfer, serta analisis peta dan Sistem Informasi Geografis (SIG).',
    learningObjectives: ['Menguasai 10 konsep esensial geografi dan analisis spasial.'],
    skillsAcquired: ['Spatial Analysis', 'GIS Literacy'],
    syllabus: [{ chapterNumber: 1, title: 'Konsep Geografi & Peta', duration: '4 Jam', difficulty: 'Dasar', summary: 'Skala dan proyeksi peta.', lessons: [{ id: 'geo-1-1', title: 'Konsep Esensial Geografi', duration: '45 Menit', type: 'interactive' }] }],
    interactiveModules: [{ id: 'mod-geo-1', title: 'Prinsip Geografi', content: 'Distribusi, Interelasi, Deskripsi, Korologi.' }],
    miniQuiz: [{ id: 'quiz-geo-1', question: 'Prinsip geografi komprehensif adalah...', options: ['Prinsip Korologi', 'Prinsip Distribusi', 'Prinsip Deskripsi', 'Prinsip Interelasi'], correct: 'Prinsip Korologi', explanation: 'Korologi memadukan ketiganya.', difficulty: 'easy' }]
  },
  {
    id: 'soshum-ekonomi',
    slug: 'ekonomi-soshum',
    title: 'Ekonomi',
    category: 'SOSHUM',
    categoryLabel: 'Sosial & Humaniora',
    level: 'Menengah',
    totalDuration: '20 Jam',
    totalModules: 15,
    rating: 4.8,
    enrolledCount: 1120,
    badge: 'Finansial',
    instructor: { name: 'Farhan Mahendra, M.Ec.', title: 'Analis Moneter', avatar: '📈' },
    description: 'Permintaan, penawaran, elastisitas harga, pendapatan nasional, inflasi, dan kebijakan moneter.',
    learningObjectives: ['Menghitung elastisitas harga dan keseimbangan pasar.'],
    skillsAcquired: ['Market Analysis', 'Macroeconomics'],
    syllabus: [{ chapterNumber: 1, title: 'Mekanisme Pasar', duration: '4 Jam', difficulty: 'Sedang', summary: 'Permintaan dan penawaran.', lessons: [{ id: 'eko-1-1', title: 'Keseimbangan Pasar', duration: '40 Menit', type: 'interactive' }] }],
    interactiveModules: [{ id: 'mod-eko-1', title: 'PDB Metode Pengeluaran', content: 'Y = C + I + G + (X - M).' }],
    miniQuiz: [{ id: 'quiz-eko-1', question: 'Jika harga naik dan total penerimaan naik, sifat barang adalah...', options: ['Inelastis', 'Elastis', 'Elastis uniter', 'Inelastis sempurna'], correct: 'Inelastis', explanation: 'Barang inelastis memiliki |Ed| < 1.', difficulty: 'medium' }]
  },
  {
    id: 'soshum-sosiologi',
    slug: 'sosiologi-soshum',
    title: 'Sosiologi',
    category: 'SOSHUM',
    categoryLabel: 'Sosial & Humaniora',
    level: 'Menengah',
    totalDuration: '16 Jam',
    totalModules: 12,
    rating: 4.7,
    enrolledCount: 860,
    badge: 'Masyarakat',
    instructor: { name: 'Dewi Lestari, M.Si.', title: 'Pemerhati Sosial', avatar: '👥' },
    description: 'Interaksi sosial, nilai dan norma, diferensiasi dan stratifikasi sosial, serta akomodasi konflik.',
    learningObjectives: ['Menganalisis bentuk-bentuk akomodasi konflik sosial.'],
    skillsAcquired: ['Social Research', 'Conflict Resolution'],
    syllabus: [{ chapterNumber: 1, title: 'Interaksi Sosial & Nilai', duration: '3 Jam', difficulty: 'Dasar', summary: 'Asosiatif vs disosiatif.', lessons: [{ id: 'sos-1-1', title: 'Syarat Interaksi Sosial', duration: '35 Menit', type: 'interactive' }] }],
    interactiveModules: [{ id: 'mod-sos-1', title: 'Arbitrase', content: 'Penyelesaian konflik dengan keputusan pihak ketiga yang mengikat.' }],
    miniQuiz: [{ id: 'quiz-sos-1', question: 'Penyelesaian konflik dengan keputusan pihak ketiga mengikat adalah...', options: ['Arbitrase', 'Mediasi', 'Kompromi', 'Konsiliasi'], correct: 'Arbitrase', explanation: 'Arbitrase menghasilkan putusan mengikat.', difficulty: 'easy' }]
  }
];

export const FALLBACK_DAILY_RECOMMENDATIONS = [
  {
    id: 'rec-1',
    classSlug: 'bahasa-indonesia',
    subject: 'Bahasa Indonesia',
    category: 'BAHASA',
    tag: 'Fokus Hari Ini',
    title: 'Bedah Kaidah EYD Edisi V & Kalimat Efektif',
    duration: '25 Menit',
    reason: 'Materi paling sering keluar di tes literasi dan penalaran skolastik.'
  },
  {
    id: 'rec-2',
    classSlug: 'bahasa-inggris',
    subject: 'Bahasa Inggris',
    category: 'BAHASA',
    tag: 'Tantangan Harian',
    title: 'Mastering Conditionals: Mixed & Inverted Clauses',
    duration: '30 Menit',
    reason: 'Tingkatkan akurasi grammar dan pemahaman teks bahasa Inggris internasional.'
  },
  {
    id: 'rec-3',
    classSlug: 'matematika-saintek',
    subject: 'Matematika Saintek',
    category: 'SAINTEK',
    tag: 'Latihan Kilat',
    title: 'Trik Cepat Turunan dan Nilai Maksimum-Minimum',
    duration: '20 Menit',
    reason: 'Asah ketajaman logika analitis dengan variasi soal kalkulus modern.'
  },
  {
    id: 'rec-4',
    classSlug: 'bahasa-mandarin',
    subject: 'Bahasa Mandarin',
    category: 'BAHASA',
    tag: 'Bahasa Baru',
    title: 'Latihan 4 Nada Pinyin & Pengenalan 8 Goresan Hanzi',
    duration: '20 Menit',
    reason: 'Kuasai bahasa internasional terpopuler dengan pondasi nada yang kokoh.'
  }
];

/**
 * Mengambil daftar kategori materi kelas (SAINTEK, SOSHUM, BAHASA)
 */
export const fetchClassCategories = async () => {
  try {
    const response = await fetch(`${API_URL}/classes/categories`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const result = await response.json();
    return result.categories || FALLBACK_CLASS_CATEGORIES;
  } catch (err) {
    // Graceful offline fallback
    return FALLBACK_CLASS_CATEGORIES;
  }
};

/**
 * Mengambil daftar kelas siswa dengan filter kategori opsional
 */
export const fetchClassesByCategory = async (category = null) => {
  try {
    const query = category ? `?category=${encodeURIComponent(category)}` : '';
    const response = await fetch(`${API_URL}/classes${query}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const result = await response.json();
    return result.classes || [];
  } catch (err) {
    // Graceful offline fallback
    if (!category || category === 'ALL') return FALLBACK_CLASSES;
    const norm = category.toUpperCase();
    return FALLBACK_CLASSES.filter((c) => c.category.toUpperCase() === norm);
  }
};

/**
 * Mengambil rincian kelas siswa lengkap (silabus, bab, target capaian, mini quiz)
 */
export const fetchClassDetail = async (slug) => {
  try {
    const response = await fetch(`${API_URL}/classes/subject/${encodeURIComponent(slug)}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const result = await response.json();
    return result.classDetail;
  } catch (err) {
    // Graceful offline fallback
    const norm = String(slug).toLowerCase();
    const found = FALLBACK_CLASSES.find((c) => c.slug.toLowerCase() === norm || c.id.toLowerCase() === norm);
    return found || FALLBACK_CLASSES[0];
  }
};

/**
 * Mengambil rekomendasi harian materi belajar
 */
export const fetchDailyRecommendations = async () => {
  try {
    const response = await fetch(`${API_URL}/classes/recommendations`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const result = await response.json();
    return result.recommendations || FALLBACK_DAILY_RECOMMENDATIONS;
  } catch (err) {
    return FALLBACK_DAILY_RECOMMENDATIONS;
  }
};

/**
 * Mengambil progress belajar siswa
 */
export const fetchStudentClassProgress = async (studentId = 'default_student', classSlug = null) => {
  try {
    const url = classSlug
      ? `${API_URL}/classes/progress/${encodeURIComponent(classSlug)}?studentId=${encodeURIComponent(studentId)}`
      : `${API_URL}/classes/progress?studentId=${encodeURIComponent(studentId)}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const result = await response.json();
    return result.progress;
  } catch (err) {
    // LocalStorage fallback
    const storageKey = `gamukis_progress_${studentId}_${classSlug || 'all'}`;
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return {
      studentId,
      classSlug,
      completedLessons: ['bind-1-1'],
      completedChapters: [],
      overallPercent: 15,
      streakDays: 3
    };
  }
};

/**
 * Menyimpan progress belajar siswa
 */
export const saveStudentClassProgress = async (progressData) => {
  const { studentId = 'default_student', classSlug } = progressData;
  const storageKey = `gamukis_progress_${studentId}_${classSlug || 'all'}`;
  try {
    localStorage.setItem(storageKey, JSON.stringify(progressData));
    const response = await fetch(`${API_URL}/classes/progress`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(progressData)
    });
    if (response.ok) {
      const result = await response.json();
      return result.progress;
    }
  } catch (err) {
    // LocalStorage fallback already set
  }
  return progressData;
};

