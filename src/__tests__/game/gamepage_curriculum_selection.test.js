import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import GamePage from '../../pages/gamePage';
import {
  fetchClassesByCategory,
  fetchClassDetail,
  parseDurationToMinutes,
  sumLessonDurationMinutes
} from '../../database/studentClassData';
import { getQuestionsForChapter } from '../../component/component_game/questions';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

jest.mock('../../database/studentClassData', () => ({
  fetchClassesByCategory: jest.fn(),
  fetchClassDetail: jest.fn(),
  parseDurationToMinutes: jest.requireActual('../../database/studentClassData').parseDurationToMinutes,
  sumLessonDurationMinutes: jest.requireActual('../../database/studentClassData').sumLessonDurationMinutes
}));
jest.mock('../../component/component_game/leaderboard', () => () => null);
jest.mock('../../component/component_game/skill', () => () => null);
jest.mock('../../component/component_game/cardSS', () => () => null);

const Destination = () => {
  const location = useLocation();
  return <output data-testid="destination">{JSON.stringify(location.state)}</output>;
};

describe('GamePage curriculum chapter selection', () => {
  let container;
  let root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    fetchClassesByCategory.mockResolvedValue([{ title: 'Fisika', slug: 'fisika' }]);
    fetchClassDetail.mockResolvedValue({
      syllabus: [{
        chapterNumber: 1,
        title: 'Mekanika Partikel',
        summary: 'Gerak dan hukum Newton.',
        lessons: [{ id: 'fis-1-1', title: 'Hukum II Newton' }]
      }]
    });
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    jest.clearAllMocks();
  });

  const renderGamePage = async (subjectTitle = 'Fisika') => {
    await act(async () => {
      root.render(
        <MemoryRouter
          initialEntries={[{ pathname: '/gamePage', state: { selectedCard: { title: subjectTitle } } }]}
          future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
        >
          <Routes>
            <Route path="/gamePage" element={<GamePage />} />
            <Route path="/inGame" element={<Destination />} />
          </Routes>
        </MemoryRouter>
      );
      await Promise.resolve();
      await Promise.resolve();
    });
  };

  const renderGamePageWithCard = async (selectedCard, routeState = {}) => {
    await act(async () => {
      root.render(
        <MemoryRouter
          initialEntries={[{ pathname: '/gamePage', state: { ...routeState, selectedCard } }]}
          future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
        >
          <Routes>
            <Route path="/gamePage" element={<GamePage />} />
            <Route path="/inGame" element={<Destination />} />
          </Routes>
        </MemoryRouter>
      );
      await Promise.resolve();
      await Promise.resolve();
    });
  };

  it('loads the active subject syllabus and passes the chosen chapter to inGame', async () => {
    await renderGamePage();
    expect(fetchClassDetail).toHaveBeenCalledWith('fisika');

    const chapterButton = container.querySelector('[data-chapter-id="1"]');
    expect(chapterButton).toBeTruthy();
    act(() => chapterButton.click());
    expect(chapterButton.getAttribute('aria-pressed')).toBe('true');

    act(() => container.querySelector('.action-button-start').click());
    const gameState = JSON.parse(container.querySelector('[data-testid="destination"]').textContent);
    expect(gameState.selectedChapter.title).toBe('Mekanika Partikel');
    expect(gameState.subject).toBe('Fisika');
    expect(gameState.resetSession).toBe(true);
  });

  it('passes a null chapter when the student starts with all material selected', async () => {
    await renderGamePage();
    act(() => container.querySelector('.action-button-start').click());

    const gameState = JSON.parse(container.querySelector('[data-testid="destination"]').textContent);
    expect(gameState.selectedChapter).toBeNull();
  });

  it('passes a runtime game duration override to the in-game session', async () => {
    await renderGamePageWithCard({ title: 'Fisika', gameDurationMinutes: 3 });

    act(() => container.querySelector('.action-button-start').click());

    const gameState = JSON.parse(container.querySelector('[data-testid="destination"]').textContent);
    expect(gameState.gameDurationSeconds).toBe(180);
  });

  it('parses and sums curriculum lesson durations in minutes', () => {
    expect(parseDurationToMinutes('45 Menit')).toBe(45);
    expect(parseDurationToMinutes('2 Jam')).toBe(120);
    expect(parseDurationToMinutes('1 Jam 30 Menit')).toBe(90);
    expect(parseDurationToMinutes('45')).toBe(45);
    expect(parseDurationToMinutes('durasi tidak valid')).toBeNull();
    expect(sumLessonDurationMinutes([
      { duration: '45 Menit' },
      { duration: '45 Menit' },
      { duration: '45 Menit' },
      { duration: '45 Menit' }
    ])).toBe(180);
    expect(sumLessonDurationMinutes([{ duration: '' }])).toBeNull();
  });

  it('uses the selected chapter lesson total as the inGame timer duration', async () => {
    fetchClassDetail.mockResolvedValue({
      syllabus: [{
        chapterNumber: 1,
        title: 'Teks Laporan Hasil Observasi',
        lessons: [
          { id: 'lesson-1', title: 'Pengertian', duration: '45 Menit' },
          { id: 'lesson-2', title: 'Struktur', duration: '45 Menit' },
          { id: 'lesson-3', title: 'Kaidah Bahasa', duration: '45 Menit' },
          { id: 'lesson-4', title: 'Penyusunan', duration: '45 Menit' }
        ]
      }]
    });
    await renderGamePageWithCard({ title: 'Fisika', gameDurationMinutes: 5 });

    act(() => container.querySelector('[data-chapter-id="1"]').click());
    act(() => container.querySelector('.action-button-start').click());

    const gameState = JSON.parse(container.querySelector('[data-testid="destination"]').textContent);
    expect(gameState.gameDurationSeconds).toBe(180 * 60);
  });

  it('sums all lesson durations when all curriculum materials are selected', async () => {
    fetchClassDetail.mockResolvedValue({
      syllabus: [
        { chapterNumber: 1, title: 'Bab 1', lessons: [{ id: 'lesson-1', title: 'Materi 1', duration: '45 Menit' }] },
        { chapterNumber: 2, title: 'Bab 2', lessons: [{ id: 'lesson-2', title: 'Materi 2', duration: '1 Jam' }] }
      ]
    });
    await renderGamePageWithCard({ title: 'Fisika', gameDurationMinutes: 1 });

    act(() => container.querySelector('.action-button-start').click());

    const gameState = JSON.parse(container.querySelector('[data-testid="destination"]').textContent);
    expect(gameState.selectedChapter).toBeNull();
    expect(gameState.gameDurationSeconds).toBe(105 * 60);
  });

  it('restores the selected chapter and its duration from replay state', async () => {
    const selectedChapter = {
      id: '1',
      chapterNumber: 1,
      title: 'Mekanika Partikel',
      lessons: [
        { id: 'lesson-1', title: 'Hukum I Newton', duration: '30 Menit' },
        { id: 'lesson-2', title: 'Hukum II Newton', duration: '30 Menit' }
      ]
    };
    await renderGamePageWithCard({ title: 'Fisika' }, { selectedChapter });

    const chapterButton = container.querySelector('[data-chapter-id="1"]');
    expect(chapterButton.getAttribute('aria-pressed')).toBe('true');
    act(() => container.querySelector('.action-button-start').click());

    const gameState = JSON.parse(container.querySelector('[data-testid="destination"]').textContent);
    expect(gameState.selectedChapter.title).toBe('Mekanika Partikel');
    expect(gameState.gameDurationSeconds).toBe(60 * 60);
  });

  it('loads the curriculum matching each supported subject title', async () => {
    const subjects = ['Biologi', 'Fisika', 'Kimia', 'Matematika', 'Sosiologi', 'Sejarah', 'Geografi', 'Ekonomi'];

    for (let index = 0; index < subjects.length; index += 1) {
      if (index > 0) {
        act(() => root.unmount());
        root = createRoot(container);
      }
      const subjectTitle = subjects[index];
      fetchClassesByCategory.mockResolvedValue([{ title: subjectTitle, slug: subjectTitle.toLowerCase() }]);
      fetchClassDetail.mockResolvedValue({
        syllabus: [{ chapterNumber: 1, title: `${subjectTitle} chapter`, lessons: [] }]
      });

      await renderGamePage(subjectTitle);

      expect(fetchClassDetail).toHaveBeenCalledWith(subjectTitle.toLowerCase());
      expect(container.textContent).toContain(`${subjectTitle} chapter`);
    }
  });

  it('prioritizes questions tagged for the selected chapter', () => {
    const questionBank = [
      { question: 'Apa fungsi mitokondria?', topic: 'Organel Sel' },
      { question: 'Apa peran membran sel?', topic: 'Biologi Sel' }
    ];

    expect(getQuestionsForChapter('Biologi', {
      title: 'Biologi Sel',
      topics: ['Membran Sel']
    }, questionBank)).toEqual([questionBank[1]]);
  });

  it('uses chapter lesson wording when topic metadata is absent', () => {
    const questionBank = [
      { question: 'Bagaimana Hukum II Newton menjelaskan percepatan benda?' },
      { question: 'Apa fungsi membran sel?' }
    ];

    expect(getQuestionsForChapter('Fisika', {
      title: 'Mekanika Partikel',
      topics: ['Hukum II Newton']
    }, questionBank)).toEqual([questionBank[0]]);
  });

  it('keeps the full subject bank when there is no chapter match or chapter selection', () => {
    const questionBank = [{ question: 'Soal pertama' }, { question: 'Soal kedua' }];

    expect(getQuestionsForChapter('Fisika', { title: 'Mekanika' }, questionBank)).toBe(questionBank);
    expect(getQuestionsForChapter('Fisika', null, questionBank)).toBe(questionBank);
  });

  it('does not treat a broad subject tag as a chapter match', () => {
    const questionBank = [
      { question: 'Apa fungsi mitokondria?', topic: 'Biologi' },
      { question: 'Bagaimana proses fotosintesis?', topic: 'Biologi' }
    ];

    expect(getQuestionsForChapter('Biologi', {
      title: 'Biologi Sel',
      topics: ['Membran Sel']
    }, questionBank)).toBe(questionBank);
  });
});
