import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import BitdsulAnimeModal from '../../component/component_about/molecules/BitdsulAnimeModal';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

describe('BitdsulAnimeModal (Interactive Anime Character Spotlight)', () => {
  let container;
  let root;
  const dummyMember = {
    id: 3,
    x: 1790,
    y: 1260,
    title: 'Ketua',
    name: 'Farhan Hidayatul Haq',
    role: 'Ketua / Leader BITDSUL / Fullstack Developer',
    linkedin: 'https://linkedin.com',
    quote: 'Langkah kecil yang konsisten'
  };

  beforeAll(() => {
    // Mock HTMLCanvasElement.getContext
    HTMLCanvasElement.prototype.getContext = () => ({
      clearRect: jest.fn(),
      fillRect: jest.fn(),
      strokeRect: jest.fn(),
      beginPath: jest.fn(),
      closePath: jest.fn(),
      moveTo: jest.fn(),
      lineTo: jest.fn(),
      bezierCurveTo: jest.fn(),
      quadraticCurveTo: jest.fn(),
      arc: jest.fn(),
      ellipse: jest.fn(),
      stroke: jest.fn(),
      fill: jest.fn(),
      save: jest.fn(),
      restore: jest.fn(),
      translate: jest.fn(),
      rotate: jest.fn(),
      drawImage: jest.fn(),
      createLinearGradient: () => ({ addColorStop: jest.fn() }),
      createRadialGradient: () => ({ addColorStop: jest.fn() }),
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 1,
      shadowColor: '',
      shadowBlur: 0,
      globalAlpha: 1
    });
  });

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    container = null;
  });

  it('renders anime character details, title, and ultimate skill', () => {
    act(() => {
      root.render(<BitdsulAnimeModal member={dummyMember} bitdsulPhoto="" onClose={jest.fn()} />);
    });

    expect(container.textContent).toContain('The Code Vanguard & Knight');
    expect(container.textContent).toContain('Farhan Hidayatul Haq');
    expect(container.textContent).toContain('Excalibur Code Slash');
    expect(container.textContent).toContain('STEEL / AETHER');
  });

  it('triggers onClose when close button is clicked', () => {
    const handleClose = jest.fn();
    act(() => {
      root.render(<BitdsulAnimeModal member={dummyMember} bitdsulPhoto="" onClose={handleClose} />);
    });

    const closeBtn = container.querySelector('.bitdsul-modal-close');
    expect(closeBtn).not.toBeNull();
    act(() => {
      closeBtn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
