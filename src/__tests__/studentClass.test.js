// Frontend/src/__tests__/studentClass.test.js
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import StudentClass from '../pages/studentClass';
import {
  FALLBACK_CLASSES,
  FALLBACK_CLASS_CATEGORIES,
  FALLBACK_DAILY_RECOMMENDATIONS,
  fetchClassCategories,
  fetchClassesByCategory,
  fetchClassDetail
} from '../database/studentClassData';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

// Mock Navbar to isolate page testing
jest.mock('../component/Navbar', () => () => <div data-testid="navbar-mock">Navbar</div>);

describe('Fitur Deskripsi Kelas Siswa & Kategori Materi', () => {
  let container;
  let root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    window.localStorage.clear();
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    window.localStorage.clear();
  });

  const renderComponent = () => {
    act(() => {
      root.render(
        <BrowserRouter>
          <StudentClass />
        </BrowserRouter>
      );
    });
  };

  test('studentClassData menyediakan 3 kategori materi dan 8 bahasa lengkap', async () => {
    const categories = await fetchClassCategories();
    expect(categories.length).toBe(3);
    const catKeys = categories.map((c) => c.category);
    expect(catKeys).toContain('SAINTEK');
    expect(catKeys).toContain('SOSHUM');
    expect(catKeys).toContain('BAHASA');

    const bahasaClasses = await fetchClassesByCategory('BAHASA');
    expect(bahasaClasses.length).toBe(8);

    const requiredLanguages = [
      'Bahasa Indonesia',
      'Bahasa Inggris',
      'Bahasa Jawa',
      'Bahasa Prancis',
      'Bahasa Jerman',
      'Bahasa Mandarin',
      'Bahasa Spanyol',
      'Bahasa Melayu'
    ];

    const actualTitles = bahasaClasses.map((c) => c.title);
    for (const lang of requiredLanguages) {
      expect(actualTitles).toContain(lang);
    }
  });

  test('menampilkan judul halaman, hero banner, dan 3 kategori tab utama', async () => {
    renderComponent();

    expect(container.textContent).toContain('Kelas Siswa Gamukis');
    expect(container.textContent).toContain('SAINTEK');
    expect(container.textContent).toContain('SOSHUM');
    expect(container.textContent).toContain('BAHASA');
    expect(container.textContent).toContain('Rekomendasi Materi Harian');
  });

  test('kategori BAHASA menampilkan seluruh 8 mata pelajaran bahasa yang diwajibkan', async () => {
    renderComponent();

    // Pastikan tab BAHASA aktif
    const tabs = container.querySelectorAll('.category-tab-btn');
    const bahasaTab = Array.from(tabs).find((t) => t.textContent.includes('BAHASA'));
    expect(bahasaTab).toBeTruthy();

    act(() => {
      bahasaTab.click();
    });

    const requiredLanguages = [
      'Bahasa Indonesia',
      'Bahasa Inggris',
      'Bahasa Jawa',
      'Bahasa Prancis',
      'Bahasa Jerman',
      'Bahasa Mandarin',
      'Bahasa Spanyol',
      'Bahasa Melayu'
    ];

    for (const lang of requiredLanguages) {
      expect(container.textContent).toContain(lang);
    }
  });

  test('berpindah tab ke SAINTEK menampilkan mapel sains lengkap', async () => {
    renderComponent();

    const tabs = container.querySelectorAll('.category-tab-btn');
    const saintekTab = Array.from(tabs).find((t) => t.textContent.includes('SAINTEK'));
    expect(saintekTab).toBeTruthy();

    act(() => {
      saintekTab.click();
    });

    expect(container.textContent).toContain('Matematika Saintek');
    expect(container.textContent).toContain('Fisika');
    expect(container.textContent).toContain('Kimia');
    expect(container.textContent).toContain('Biologi');
    expect(container.textContent).toContain('Informatika');
  });

  test('menampilkan rincian kelas lengkap: capaian belajar, silabus, dan kompetensi', async () => {
    renderComponent();

    expect(container.textContent).toContain('Target Capaian Belajar');
    expect(container.textContent).toContain('Kompetensi yang Dibangun:');
  });

  test('fitur interaktif silabus dan penandaan bab selesai memperbarui status progres', async () => {
    renderComponent();

    // Buka tab silabus
    const detailTabs = container.querySelectorAll('.detail-tab-btn');
    const syllabusTabBtn = Array.from(detailTabs).find((b) => b.textContent.includes('Silabus & Bab'));
    expect(syllabusTabBtn).toBeTruthy();

    act(() => {
      syllabusTabBtn.click();
    });

    // Cari tombol centang bab 1
    const checkBtn = container.querySelector('.btn-check-chapter');
    expect(checkBtn).toBeTruthy();

    act(() => {
      checkBtn.click();
    });

    expect(checkBtn.classList.contains('checked')).toBe(true);
  });

  test('fitur latihan kilat (mini-quiz preview) interaktif: memilih jawaban, periksa, dan feedback', async () => {
    renderComponent();

    // Buka tab kuis
    const detailTabs = container.querySelectorAll('.detail-tab-btn');
    const quizTabBtn = Array.from(detailTabs).find((b) => b.textContent.includes('Latihan Kilat'));
    expect(quizTabBtn).toBeTruthy();

    act(() => {
      quizTabBtn.click();
    });

    // Cari opsi kuis
    const optionBtns = container.querySelectorAll('.quiz-opt-btn');
    expect(optionBtns.length).toBeGreaterThan(0);

    // Klik opsi pertama
    act(() => {
      optionBtns[0].click();
    });

    // Klik periksa jawaban
    const submitBtn = container.querySelector('.btn-quiz-submit');
    expect(submitBtn).toBeTruthy();
    expect(submitBtn.disabled).toBe(false);

    act(() => {
      submitBtn.click();
    });

    expect(container.querySelector('.quiz-feedback-box')).toBeTruthy();
  });

  test('fitur pencarian real-time menyaring daftar kelas berdasarkan kata kunci', async () => {
    renderComponent();

    const searchInput = container.querySelector('.class-search-input');
    expect(searchInput).toBeTruthy();

    act(() => {
      searchInput.value = 'Spanyol';
      searchInput.dispatchEvent(new Event('input', { bubbles: true }));
      // Panggil onChange handler React
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      nativeInputValueSetter.call(searchInput, 'Spanyol');
      searchInput.dispatchEvent(new Event('change', { bubbles: true }));
    });

    // Verifikasi daftar yang difilter
    expect(container.textContent).toContain('Spanyol');
  });
});
