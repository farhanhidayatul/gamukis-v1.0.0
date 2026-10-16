import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import {
  ConfirmDialog,
  DataToolbar,
  EmptyState,
  ErrorState,
  FormField,
  Modal,
  Pagination,
  ResponsiveTable,
  Skeleton,
  StatusBadge,
  Toast,
  useToast
} from './index';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

describe('Admin shared UI components', () => {
  let container;
  let root;
  let originalMatchMedia;
  let compactMatches;
  let mediaQueryListeners;

  beforeEach(() => {
    originalMatchMedia = window.matchMedia;
    compactMatches = false;
    mediaQueryListeners = [];
    window.matchMedia = jest.fn(() => ({
      matches: compactMatches,
      addEventListener: (_event, listener) => mediaQueryListeners.push(listener),
      removeEventListener: (_event, listener) => {
        mediaQueryListeners = mediaQueryListeners.filter((current) => current !== listener);
      }
    }));
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    if (originalMatchMedia) window.matchMedia = originalMatchMedia;
    else delete window.matchMedia;
  });

  const render = (element) => act(() => root.render(element));

  it('renders only the active responsive layout and switches at the mobile breakpoint', () => {
    render(
      <ResponsiveTable
        caption="Rooms"
        columns={[{ key: 'name', label: 'Nama', primary: true }, { key: 'count', label: 'Pemain' }]}
        rows={[{ id: 'room-1', name: 'Kelas A', count: 3 }]}
        actions={() => [{ label: 'Edit', onClick: jest.fn() }]}
      />
    );

    expect(container.querySelector('.admin-shared-table tbody tr')).toBeTruthy();
    expect(container.querySelector('.admin-shared-data-card')).toBeNull();
    expect(container.textContent).toContain('Kelas A');

    act(() => {
      compactMatches = true;
      mediaQueryListeners.forEach((listener) => listener({ matches: true }));
    });

    expect(container.querySelector('.admin-shared-table')).toBeNull();
    expect(container.querySelector('.admin-shared-data-card')).toBeTruthy();
  });

  it('requires the exact confirmation text before enabling a destructive action', () => {
    render(<ConfirmDialog open title="Hapus room" message="Aksi ini permanen." requireText="KELAS A" danger onConfirm={jest.fn()} onCancel={jest.fn()} />);
    const confirm = [...container.querySelectorAll('button')].find((button) => button.textContent === 'Konfirmasi');
    const input = container.querySelector('input');
    expect(confirm.disabled).toBe(true);

    act(() => {
      const setNativeValue = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      setNativeValue.call(input, 'KELAS A');
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });

    expect(confirm.disabled).toBe(false);
  });

  it('closes an open modal on Escape', () => {
    const onClose = jest.fn();
    render(<Modal open title="Edit room" onClose={onClose}><p>Form</p></Modal>);
    act(() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('connects field errors to the form control accessibly', () => {
    render(<FormField label="Nama room" name="name" error="Nama wajib diisi."><input /></FormField>);
    const input = container.querySelector('input');
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(container.querySelector(`#${input.getAttribute('aria-describedby')}`)?.textContent).toBe('Nama wajib diisi.');
  });

  it('shows search feedback and translated status labels', () => {
    render(
      <>
        <DataToolbar search={{ value: 'Kelas', placeholder: 'Cari room', onChange: jest.fn() }} />
        <StatusBadge status="pending" />
      </>
    );
    expect(container.querySelector('input[type="search"]').placeholder).toBe('Cari room');
    expect(container.querySelector('.admin-shared-status-badge').textContent).toBe('Menunggu');
  });

  it('moves between pages using the pagination contract', () => {
    const onChange = jest.fn();
    render(<Pagination page={2} totalPages={5} limit={20} onChange={onChange} />);
    act(() => container.querySelector('[aria-label="Halaman berikutnya"]').click());
    expect(onChange).toHaveBeenCalledWith(3);
  });

  it('renders empty, error, and loading states without production mock data', () => {
    render(
      <>
        <EmptyState title="Kosong" description="Belum ada item." />
        <ErrorState error={{ message: 'Tidak tersedia.' }} onRetry={jest.fn()} />
        <Skeleton rows={2} />
      </>
    );
    expect(container.textContent).toContain('Belum ada item.');
    expect(container.textContent).toContain('Tidak tersedia.');
    expect(container.querySelectorAll('.admin-shared-skeleton-row')).toHaveLength(2);
  });

  it('adds and dismisses toast messages through the hook contract', () => {
    const ToastHarness = () => {
      const { toasts, showToast, dismissToast } = useToast({ duration: 0 });
      return (
        <>
          <button type="button" onClick={() => showToast({ message: 'Room diperbarui.' })}>Tampilkan</button>
          <Toast toasts={toasts} onDismiss={dismissToast} />
        </>
      );
    };
    render(<ToastHarness />);
    act(() => container.querySelector('button').click());
    expect(container.textContent).toContain('Room diperbarui.');
    act(() => container.querySelector('[aria-label="Tutup notifikasi"]').click());
    expect(container.textContent).not.toContain('Room diperbarui.');
  });
});