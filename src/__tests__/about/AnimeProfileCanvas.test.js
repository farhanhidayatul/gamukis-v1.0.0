import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import AnimeProfileCanvas from '../../component/component_about/atoms/AnimeProfileCanvas';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

describe('AnimeProfileCanvas (HTML5 Canvas Anime Aura & Petals)', () => {
  let container;
  let root;
  let originalRAF;
  let originalCAF;

  beforeAll(() => {
    originalRAF = window.requestAnimationFrame;
    originalCAF = window.cancelAnimationFrame;
    window.requestAnimationFrame = (callback) => setTimeout(callback, 16);
    window.cancelAnimationFrame = (id) => clearTimeout(id);

    // Mock HTMLCanvasElement.getContext
    HTMLCanvasElement.prototype.getContext = () => ({
      clearRect: jest.fn(),
      save: jest.fn(),
      restore: jest.fn(),
      translate: jest.fn(),
      rotate: jest.fn(),
      beginPath: jest.fn(),
      arc: jest.fn(),
      stroke: jest.fn(),
      setLineDash: jest.fn(),
      ellipse: jest.fn(),
      fill: jest.fn(),
      moveTo: jest.fn(),
      lineTo: jest.fn(),
      closePath: jest.fn(),
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 1,
      shadowColor: '',
      shadowBlur: 0,
      globalAlpha: 1
    });
  });

  afterAll(() => {
    window.requestAnimationFrame = originalRAF;
    window.cancelAnimationFrame = originalCAF;
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

  it('renders canvas element with proper class and dimensions', () => {
    act(() => {
      root.render(<AnimeProfileCanvas width={116} height={116} memberId={1} />);
    });

    const canvas = container.querySelector('canvas.bitdsul-anime-canvas');
    expect(canvas).not.toBeNull();
    expect(canvas.getAttribute('width')).toBe('116');
    expect(canvas.getAttribute('height')).toBe('116');
  });

  it('applies is-burst class when isHovered is true', () => {
    act(() => {
      root.render(<AnimeProfileCanvas isHovered={false} memberId={2} />);
    });
    let canvas = container.querySelector('canvas.bitdsul-anime-canvas');
    expect(canvas.classList.contains('is-burst')).toBe(false);

    act(() => {
      root.render(<AnimeProfileCanvas isHovered={true} memberId={2} />);
    });
    canvas = container.querySelector('canvas.bitdsul-anime-canvas');
    expect(canvas.classList.contains('is-burst')).toBe(true);
  });

  it('unmounts cleanly without leaking animation frame', () => {
    act(() => {
      root.render(<AnimeProfileCanvas memberId={3} />);
    });
    expect(() => {
      act(() => {
        root.unmount();
      });
    }).not.toThrow();
  });
});
