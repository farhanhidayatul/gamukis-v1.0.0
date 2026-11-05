import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import MathText from '../../component/common/MathText';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

describe('MathText Component', () => {
  let container;
  let root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    if (root) {
      await act(async () => {
        root.unmount();
      });
    }
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
  });

  const renderComponent = async (element) => {
    await act(async () => {
      root.render(element);
    });
  };

  it('renders plain text without math delimiters directly', async () => {
    await renderComponent(<MathText text="Halo dunia, ini soal matematika dasar." />);
    expect(container.textContent).toContain('Halo dunia, ini soal matematika dasar.');
  });

  it('renders inline math with KaTeX markup', async () => {
    await renderComponent(<MathText text="Hitung nilai dari $x + y = 10$ sekarang." />);
    expect(container.textContent).toContain('Hitung nilai dari');
    expect(container.textContent).toContain('sekarang.');

    const mathInline = container.querySelector('.math-inline');
    expect(mathInline).not.toBeNull();
    expect(mathInline.querySelector('.katex')).not.toBeNull();
  });

  it('renders block math with display mode', async () => {
    await renderComponent(
      <MathText text="Persamaan kuadrat: $$\frac{-b \pm \sqrt{b^2 - 4ac}}{2a}$$ adalah rumus abc." />
    );
    expect(container.textContent).toContain('Persamaan kuadrat:');
    expect(container.textContent).toContain('adalah rumus abc.');

    const mathBlock = container.querySelector('.math-block');
    expect(mathBlock).not.toBeNull();
    expect(mathBlock.querySelector('.katex')).not.toBeNull();
  });

  it('handles empty or non-string text gracefully without error', async () => {
    await renderComponent(<MathText text="" />);
    expect(container.textContent).toBe('');

    await renderComponent(<MathText text={null} />);
    expect(container.textContent).toBe('');
  });

  it('falls back gracefully on malformed math without crashing', async () => {
    await renderComponent(<MathText text="Formula rusak: $\invalidmacro{xyz}$ coba." />);
    expect(container.querySelector('.math-text-container')).not.toBeNull();
  });

  it('purifies and sanitizes potentially malicious XSS payloads in formulas', async () => {
    await renderComponent(<MathText text="XSS test: $\text{<img src=x onerror=alert(1)>}$ selesai." />);
    expect(container.querySelector('img')).toBeNull();
    expect(container.querySelector('script')).toBeNull();
  });

  it('strictly blocks script tags and event handler injection in user education inputs', async () => {
    // 1. Script tag injection inside formula is escaped/neutralized without creating script DOM element
    await renderComponent(<MathText text="Soal kuis: $\text{<script>stealData()</script>}$ Hitung $2 + 2$." />);
    expect(container.querySelector('script')).toBeNull();
    expect(container.querySelectorAll('script').length).toBe(0);

    // 2. Inline script tag without math delimiters (escaped natively by React)
    await renderComponent(<MathText text="Soal teks biasa: <script>stealData()</script> Berapa 5 x 5?" />);
    expect(container.querySelector('script')).toBeNull();
    expect(container.textContent).toContain('<script>stealData()</script>');

    // 3. Iframe and event handler injection
    await renderComponent(<MathText text="XSS payload: $\text{<iframe src=javascript:stealData()></iframe><img src=x onerror=stealData()>}$" />);
    expect(container.querySelector('iframe')).toBeNull();
    expect(container.querySelector('img')).toBeNull();
  });
});
