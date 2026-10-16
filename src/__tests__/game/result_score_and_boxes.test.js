import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import PerformanceSummary from '../../component/component_result/molecules/PerformanceSummary';
import ScoreBox from '../../component/component_result/scoreBox';
import AccuracySection from '../../component/component_result/accuracySection';
import RankSection from '../../component/component_result/rankSelection';
import AnswerList from '../../component/component_result/answerList';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

describe('Result Boxes & Scoring Verification', () => {
  let container;
  let root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it('Kotak Hijau (Performa): displays Benar and Salah counts with clear labels', () => {
    act(() => {
      root.render(<PerformanceSummary correct={20} incorrect={5} />);
    });

    expect(container.querySelector('.perf-correct').textContent).toBe('20');
    expect(container.querySelector('.perf-incorrect').textContent).toBe('5');
    expect(container.textContent).toContain('Benar');
    expect(container.textContent).toContain('Salah');
    expect(container.textContent).toContain('Total Dijawab: 25 Soal');
    expect(container.querySelector('.card-green')).not.toBeNull();
  });

  it('Kotak Kuning (Nilai Akademik): calculates and renders score based on n formula', () => {
    // Total 25 questions, n = 100 / 25 = 4
    // 25 correct, 0 incorrect -> (25 - 0) * 4 = 100
    const totalQuestions = 25;
    const nValue = 100 / totalQuestions;
    const correct = 25;
    const incorrect = 0;
    const score = Math.max(0, Math.min(100, Math.round((correct - incorrect) * nValue)));

    act(() => {
      root.render(<ScoreBox score={score} totalQuestions={totalQuestions} nValue={nValue} />);
    });

    expect(container.querySelector('.score-large').textContent).toBe('100');
    expect(container.textContent).toContain('Nilai Akademik');
    expect(container.querySelector('.card-yellow')).not.toBeNull();
  });

  it('Kotak Ungu Muda (Akurasi): renders percentage and badge position', () => {
    act(() => {
      root.render(<AccuracySection accuracy={88} badgePosition={88} />);
    });

    expect(container.querySelector('.accuracy-badge').textContent).toBe('88%');
    expect(container.querySelector('.card-purple')).not.toBeNull();
  });

  it('Kotak Pink (Skor Pertandingan): renders (coins * 5) + (botKills * 15) + (playerKills * 30)', () => {
    // 10 coins * 5 = 50, 2 bot kills * 15 = 30, 1 player kill * 30 = 30 -> Total 110
    const coins = 10;
    const botKills = 2;
    const playerKills = 1;
    const expectedGameScore = (coins * 5) + (botKills * 15) + (playerKills * 30);

    act(() => {
      root.render(
        <RankSection
          coins={coins}
          botKills={botKills}
          playerKills={playerKills}
        />
      );
    });

    expect(container.querySelector('.game-score-total').textContent).toBe(String(expectedGameScore));
    expect(container.textContent).toContain('Total Poin Game');
    expect(container.textContent).toContain('Koin (+50)');
    expect(container.textContent).toContain('Monster (+30)');
    expect(container.textContent).toContain('Player (+30)');
    expect(container.querySelector('.card-pink')).not.toBeNull();
  });

  it('Review Soal & Jawaban: renders question cards with options and status', () => {
    const mockAnswers = [
      {
        question: 'Apa fungsi mitokondria?',
        answer: 'Respirasi seluler',
        correct: true,
        options: ['Respirasi seluler', 'Fotosintesis', 'Pencernaan'],
        correctAnswer: 'Respirasi seluler',
        _status: 'correct'
      },
      {
        question: 'Berapa jumlah kromosom manusia?',
        answer: '48',
        correct: false,
        options: ['46', '48', '50'],
        correctAnswer: '46',
        _status: 'incorrect'
      }
    ];

    act(() => {
      root.render(<AnswerList answers={mockAnswers} />);
    });

    expect(container.textContent).toContain('Apa fungsi mitokondria?');
    expect(container.textContent).toContain('Berapa jumlah kromosom manusia?');
    expect(container.querySelectorAll('.answer-card').length).toBe(2);
    expect(container.querySelector('.answer-card-correct')).not.toBeNull();
    expect(container.querySelector('.answer-card-incorrect')).not.toBeNull();
  });
});

