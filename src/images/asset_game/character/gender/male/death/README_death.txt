CHAR MALE - DEATH ANIMATION (8 frame)
Struktur & penamaan sama dengan paket idle (idle -> death). Baris: r0=front r1=back r2=left r3=right. Kolom c0..c7 = frame.
Gerakan front/back mengikuti referensi: keduanya akhirnya rebah ke arah kamera (kepala di bawah layar, kaki di atas).
  front : c0 hit stagger, c1 lutut menekuk, c2 menurun, c3 benturan (tertelungkup, art BACK diputar 180), c4 pantul, c5 settle, c6-c7 rest
  back  : c0 hit stagger, c1 lutut menekuk, c2 terguling (art FRONT mulai dipakai), c3 benturan (telentang), c4 pantul, c5 settle, c6-c7 rest
  left  : jatuh ke kanan layar (telentang)   right : jatuh ke kiri layar (telentang)
Frame terakhir (c7) ditahan, jangan loop. Durasi saran (ms): 120,120,120,100,110,130,150, tahan. Anchor tengah-bawah sel.
Catatan: di frame rebah baris front memakai sprite back dan baris back memakai sprite front (layer yang sama, ikut semua pakaian).
frames.json = hi-res pakaian (8 kolom). frames_native.json = color_white/hands/preview (46x42). frames_parts.json = body/head/legs (44x42).
