import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import Result from '../../pages/result';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

jest.mock('../../database/firebaseAuth', () => ({
  auth: { currentUser: null },
  onAuthStateChanged: (_auth, callback) => {
    callback(null);
    return jest.fn();
  }
}));

jest.mock('../../database/firebaseDatabase', () => ({ getAnswers: jest.fn() }));
jest.mock('../../database/manualAuth', () => ({ getManualUser: () => null }));
jest.mock('../../component/component_result/accuracySection', () => () => null);
jest.mock('../../component/component_result/answerList', () => () => null);
jest.mock('../../component/component_result/rankSelection', () => () => null);
jest.mock('../../component/component_result/scoreBox', () => () => null);
jest.mock('../../component/component_result/subjectSelection', () => () => null);
jest.mock('../../component/component_result/molecules/PerformanceSummary', () => () => null);

const Destination = () => {
  const location = useLocation();
  return <output data-testid="destination">{JSON.stringify({ pathname: location.pathname, state: location.state })}</output>;
};

describe('Result navigation', () => {
  let container;
  let root;
  const selectedCard = { title: 'Biologi', subtitle: 'Saintek' };

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    window.sessionStorage.setItem('gamukis_game_session_id', 'finished-session');
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    window.sessionStorage.clear();
  });

  const renderResult = () => act(() => {
    root.render(
      <MemoryRouter
        initialEntries={[{ pathname: '/result', state: { selectedCard } }]}
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <Routes>
          <Route path="/result" element={<Result />} />
          <Route path="*" element={<Destination />} />
        </Routes>
      </MemoryRouter>
    );
  });

  it('returns Home when the player exits the lobby from results', () => {
    renderResult();

    act(() => container.querySelector('.result-action-home').click());

    expect(container.querySelector('[data-testid="destination"]').textContent)
      .toContain('"pathname":"/home"');
  });

  it('replays from gamePage with the same selection, resetSession flag, and cleared cache', () => {
    window.localStorage.setItem('gamukis_anonymous_game_session', JSON.stringify({ sessionId: 'old-anon' }));
    renderResult();

    act(() => container.querySelector('.result-action-replay').click());

    const destination = JSON.parse(container.querySelector('[data-testid="destination"]').textContent);
    expect(destination.pathname).toBe('/gamePage');
    expect(destination.state.selectedCard).toEqual(selectedCard);
    expect(destination.state.resetSession).toBe(true);
    expect(window.sessionStorage.getItem('gamukis_game_session_id')).toBeNull();
    expect(window.localStorage.getItem('gamukis_anonymous_game_session')).toBeNull();
  });
});