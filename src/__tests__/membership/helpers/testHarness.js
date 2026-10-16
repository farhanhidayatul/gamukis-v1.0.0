import React from 'react';
import ReactDOM from 'react-dom/client';
import { act } from 'react';

// Configure React 18 act environment for jsdom
global.IS_REACT_ACT_ENVIRONMENT = true;

/**
 * Safely loads a module or returns null if not yet implemented.
 * @param {string} relativePath
 * @returns {any|null}
 */
export const loadComponent = (relativePath) => {
  try {
    // eslint-disable-next-line global-require, import/no-dynamic-require
    const mod = require(relativePath);
    return mod.default || mod;
  } catch (err) {
    if (err.code === 'MODULE_NOT_FOUND') {
      return null;
    }
    throw err;
  }
};

/**
 * Condition-based test runner that skips tests if required component is null.
 */
export const itIf = (condition) => (condition ? it : it.skip);
export const describeIf = (condition) => (condition ? describe : describe.skip);

/**
 * Renders a React element into the jsdom document with React 18 createRoot & act.
 * @param {React.ReactElement} ui
 * @returns {Promise<{ container: HTMLElement, root: any, unmount: Function, getByText: Function, queryByText: Function, getAllByText: Function }>}
 */
export const renderIntoDom = async (ui) => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = ReactDOM.createRoot(container);

  await act(async () => {
    root.render(ui);
  });

  const getByText = (text, options = { exact: false }) => {
    const el = queryByText(text, options);
    if (!el) {
      throw new Error(`Element with text "${text}" not found. DOM: ${container.innerHTML}`);
    }
    return el;
  };

  const queryByText = (text, options = { exact: false }) => {
    const matcher = (node) => {
      const content = node.textContent || '';
      return options.exact
        ? content.trim() === text
        : content.toLowerCase().includes(text.toLowerCase());
    };
    const all = container.querySelectorAll('*');
    for (const node of all) {
      if (node.children.length === 0 && matcher(node)) {
        return node;
      }
    }
    for (const node of all) {
      if (matcher(node)) return node;
    }
    return null;
  };

  const getAllByText = (text, options = { exact: false }) => {
    const matches = [];
    const all = container.querySelectorAll('*');
    for (const node of all) {
      const content = node.textContent || '';
      const matched = options.exact
        ? content.trim() === text
        : content.toLowerCase().includes(text.toLowerCase());
      if (matched && node.children.length === 0) {
        matches.push(node);
      }
    }
    return matches;
  };

  const unmount = async () => {
    await act(async () => {
      root.unmount();
    });
    if (container.parentNode) {
      container.parentNode.removeChild(container);
    }
  };

  return {
    container,
    root,
    unmount,
    getByText,
    queryByText,
    getAllByText
  };
};

/**
 * Triggers a click event inside act.
 * @param {HTMLElement} element
 */
export const fireClick = async (element) => {
  if (!element) throw new Error('Cannot fire click on null element');
  await act(async () => {
    element.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
  });
};

/**
 * Sets up a mock window.fetch responding to membership routes.
 * @param {object} routes - Map of endpoint path regex/substring to response resolver
 */
export const setupMockFetch = (routes = {}) => {
  const originalFetch = global.fetch;
  const calls = [];

  global.fetch = jest.fn(async (url, options = {}) => {
    calls.push({ url, options });

    for (const [pattern, handler] of Object.entries(routes)) {
      if (url.includes(pattern)) {
        if (typeof handler === 'function') {
          return handler(url, options);
        }
        const { status = 200, data = {} } = handler;
        return {
          ok: status >= 200 && status < 300,
          status,
          statusText: status === 200 ? 'OK' : 'Error',
          json: async () => data,
          text: async () => JSON.stringify(data)
        };
      }
    }

    // Default fallback 404
    return {
      ok: false,
      status: 404,
      statusText: 'Not Found',
      json: async () => ({ message: 'Not Found' }),
      text: async () => JSON.stringify({ message: 'Not Found' })
    };
  });

  return {
    calls,
    restore: () => {
      global.fetch = originalFetch;
    }
  };
};

/**
 * Sets up a mock localStorage object.
 */
export const setupMockStorage = (initial = {}) => {
  const store = { ...initial };
  const mockStorage = {
    getItem: jest.fn((key) => (key in store ? store[key] : null)),
    setItem: jest.fn((key, value) => {
      store[key] = String(value);
    }),
    removeItem: jest.fn((key) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      Object.keys(store).forEach((k) => delete store[k]);
    }),
    store
  };

  Object.defineProperty(window, 'localStorage', {
    value: mockStorage,
    writable: true,
    configurable: true
  });

  return mockStorage;
};


describe('Test Harness Utilities Integrity', () => {
  it('should export core harness functions', () => {
    expect(typeof loadComponent).toBe('function');
    expect(typeof itIf).toBe('function');
    expect(typeof renderIntoDom).toBe('function');
    expect(typeof fireClick).toBe('function');
    expect(typeof setupMockFetch).toBe('function');
    expect(typeof setupMockStorage).toBe('function');
  });
});
