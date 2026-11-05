// Frontend/src/__tests__/studentClass.test.js
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import StudentClass from '../pages/studentClass';
import * as studentClassDataApi from '../database/studentClassData';
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

  test('menempatkan eksplorasi kelas sebelum rekomendasi dan tidak menampilkan metrik dashboard', () => {
    renderComponent();

    expect(container.querySelector('.hero-metrics')).toBeNull();
    const contentSections = Array.from(container.querySelectorAll(
      '.class-hero-section, .class-navigation-section, .class-explorer-layout, .daily-recommendations-widget'
    )).map((section) => section.className);

    expect(contentSections).toEqual([
      'class-hero-section',
      'class-navigation-section',
      'class-explorer-layout',
      'daily-recommendations-widget'
    ]);
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

  test('siswa dapat membuka template offering kosong yang ditandai sebagai draf', async () => {
    const offering = {
      id: 'bahasa-indonesia-SD-1',
      educationStage: 'SD',
      schoolGrade: '1',
      questionCount: 0,
      contentStatus: 'draft',
      isTemplate: true
    };
    const subject = {
      ...FALLBACK_CLASSES.find((item) => item.id === 'bahasa-indonesia'),
      offerings: [offering]
    };
    const categorySpy = jest.spyOn(studentClassDataApi, 'fetchClassCategories').mockResolvedValue(FALLBACK_CLASS_CATEGORIES);
    const classesSpy = jest.spyOn(studentClassDataApi, 'fetchClassesByCategory').mockResolvedValue([subject]);
    const detailSpy = jest.spyOn(studentClassDataApi, 'fetchClassDetail').mockResolvedValue(subject);
    const offeringDetailSpy = jest.spyOn(studentClassDataApi, 'fetchClassOfferingDetail').mockResolvedValue({
      ...subject,
      description: 'Template draf untuk kelas satu.',
      learningObjectives: ['Mengenali konsep dasar.'],
      syllabus: [{ chapterNumber: 1, title: 'Bab Pengantar', lessons: [{ id: 'lesson-1', title: 'Konsep Dasar', duration: '30 Menit', type: 'article' }] }],
      miniQuiz: [],
      offering
    });
    const recommendationSpy = jest.spyOn(studentClassDataApi, 'fetchDailyRecommendations').mockResolvedValue(FALLBACK_DAILY_RECOMMENDATIONS);
    const progressSpy = jest.spyOn(studentClassDataApi, 'fetchStudentClassProgress').mockResolvedValue({ completedLessons: [], completedChapters: [] });

    await act(async () => {
      root.render(<BrowserRouter><StudentClass /></BrowserRouter>);
      await Promise.resolve();
    });
    const subjectButton = Array.from(container.querySelectorAll('button')).find((button) => button.textContent.includes('Lihat Silabus & Deskripsi'));
    await act(async () => subjectButton.click());
    const stageButton = Array.from(container.querySelectorAll('.detail-tab-btn')).find((button) => button.textContent === 'SD');
    await act(async () => stageButton.click());
    const gradeButton = Array.from(container.querySelectorAll('.classes-cards-list button')).find((button) => button.textContent.includes('Kelas 1'));
    expect(container.querySelector('.offering-choice-title').textContent).toBe('Kelas 1');
    expect(container.querySelector('.offering-choice-meta').textContent).toBe('0 soal');
    expect(container.querySelector('.offering-status.draft').textContent).toBe('Draf');
    await act(async () => gradeButton.click());

    expect(offeringDetailSpy).toHaveBeenCalledWith('bahasa-indonesia', offering.id);
    expect(container.textContent).toContain('Kurikulum draf');
    const syllabusTab = Array.from(container.querySelectorAll('.detail-tab-btn')).find((button) => button.textContent.includes('Silabus & Bab'));
    await act(async () => syllabusTab.click());
    expect(container.textContent).toContain('Bab Pengantar');
    const quizTab = Array.from(container.querySelectorAll('.detail-tab-btn')).find((button) => button.textContent.includes('Latihan Kilat'));
    await act(async () => quizTab.click());
    expect(container.textContent).toContain('Kuis belum tersedia pada template draf ini.');
    expect(container.querySelector('.btn-hero-launch-game')).toBeNull();

    [categorySpy, classesSpy, detailSpy, offeringDetailSpy, recommendationSpy, progressSpy].forEach((spy) => spy.mockRestore());
  });
});
