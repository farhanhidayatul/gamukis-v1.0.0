import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import AnomalyAlertBadge from '../../component/component_admin_monitoring/atoms/AnomalyAlertBadge';
import AnomalyResolutionModal from '../../component/component_admin_monitoring/molecules/AnomalyResolutionModal';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

describe('Admin Anomaly Detector & Confirmation Hub', () => {
  let container;
  let root;

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
  });

  it('renders healthy badge state when no unresolved anomalies exist', () => {
    act(() => {
      root.render(<AnomalyAlertBadge count={0} />);
    });
    expect(container.textContent).toContain('Sistem In-Game: Normal');
  });

  it('renders alert badge with counter when anomalies are detected', () => {
    const handleClick = jest.fn();
    act(() => {
      root.render(<AnomalyAlertBadge count={3} onClick={handleClick} />);
    });

    expect(container.textContent).toContain('3 Bug In-Game Terdeteksi');

    const button = container.querySelector('button');
    expect(button).not.toBeNull();
    act(() => {
      button.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('renders AnomalyResolutionModal and triggers resolution action', async () => {
    const handleResolve = jest.fn().mockResolvedValue({ status: 'ok' });
    const handleClose = jest.fn();

    const mockAnomalies = [
      {
        id: 'anom_1',
        type: 'CLIENT_FREEZE',
        severity: 'HIGH',
        message: 'Client loop freeze detected (2100ms)',
        playerId: 'guest_test',
        lobbyId: 'lobby-1',
        detectedAt: Date.now(),
        occurrences: 1,
        details: { deltaMs: 2100 }
      }
    ];

    act(() => {
      root.render(
        <AnomalyResolutionModal
          isOpen={true}
          anomalies={mockAnomalies}
          onClose={handleClose}
          onResolve={handleResolve}
        />
      );
    });

    expect(container.textContent).toContain('Konfirmasi Bug & Kejanggalan In-Game');
    expect(container.textContent).toContain('Client loop freeze detected (2100ms)');

    const resolveBtn = container.querySelector('.btn-anomaly-resolve');
    expect(resolveBtn).not.toBeNull();

    await act(async () => {
      resolveBtn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(handleResolve).toHaveBeenCalledWith('anom_1', 'auto_heal');
  });
});
