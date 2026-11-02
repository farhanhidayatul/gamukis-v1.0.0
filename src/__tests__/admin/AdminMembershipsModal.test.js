import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import PlanModal from '../../component/component_admin_memberships/molecules/PlanModal';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

describe('Admin PlanModal component', () => {
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

  const render = (element) => act(() => root.render(element));

  it('renders create modal with role buttons and default siswa perks', () => {
    render(
      <PlanModal
        isOpen={true}
        onClose={jest.fn()}
        onSave={jest.fn()}
        plan={null}
      />
    );

    expect(container.textContent).toContain('Buat Paket Membership Baru');
    expect(container.textContent).toContain('Siswa');
    expect(container.textContent).toContain('Guru');
    expect(container.textContent).toContain('Batas Karakter / Avatar');
    expect(container.textContent).toContain('Nyawa Tak Terbatas');
    expect(container.textContent).toContain('Akses Skin & Kostum Eksklusif');
    expect(container.textContent).toContain('Pengganda EXP Game');
  });

  it('switches role to guru and updates perks list', () => {
    render(
      <PlanModal
        isOpen={true}
        onClose={jest.fn()}
        onSave={jest.fn()}
        plan={null}
      />
    );

    const guruBtn = Array.from(container.querySelectorAll('button')).find((b) =>
      b.textContent.includes('Guru')
    );
    expect(guruBtn).toBeTruthy();

    act(() => {
      guruBtn.click();
    });

    expect(container.textContent).toContain('Maksimal Kelas Aktif');
    expect(container.textContent).toContain('Kapasitas Siswa per Room');
    expect(container.textContent).toContain('Ekspor Laporan & Analitik Nilai');
    expect(container.textContent).toContain('AI Question Generator');
  });

  it('validates required fields before submitting create', () => {
    const handleSave = jest.fn();
    render(
      <PlanModal
        isOpen={true}
        onClose={jest.fn()}
        onSave={handleSave}
        plan={null}
      />
    );

    const submitBtn = Array.from(container.querySelectorAll('button')).find((b) =>
      b.textContent.includes('Buat Paket')
    );
    expect(submitBtn).toBeTruthy();

    act(() => {
      submitBtn.click();
    });

    // Should display validation errors
    expect(container.textContent).toContain('Kode paket wajib diisi.');
    expect(container.textContent).toContain('Nama paket wajib diisi.');
    expect(handleSave).not.toHaveBeenCalled();
  });

  const setInputValue = (input, value) => {
    const valueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    valueSetter.call(input, value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  };

  it('submits valid plan payload with compiled features', () => {
    const handleSave = jest.fn();
    render(
      <PlanModal
        isOpen={true}
        onClose={jest.fn()}
        onSave={handleSave}
        plan={null}
      />
    );

    const inputs = container.querySelectorAll('input');
    const codeInput = Array.from(inputs).find((i) => i.placeholder === 'kode_paket_unik');
    const nameInput = Array.from(inputs).find((i) => i.placeholder && i.placeholder.includes('Paket Belajar'));
    const priceInput = container.querySelector('input[type="number"][min="0"]');

    expect(codeInput).toBeTruthy();
    expect(nameInput).toBeTruthy();
    expect(priceInput).toBeTruthy();

    act(() => {
      setInputValue(codeInput, 'siswa_pro_test');
      setInputValue(nameInput, 'Paket Siswa Pro Test');
      setInputValue(priceInput, '25000');
    });

    const submitBtn = Array.from(container.querySelectorAll('button')).find((b) =>
      b.textContent.includes('Buat Paket')
    );

    act(() => {
      submitBtn.click();
    });

    expect(handleSave).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 'siswa_pro_test',
        name: 'Paket Siswa Pro Test',
        audience: 'siswa',
        price: 25000,
        durationDays: 30,
        isActive: true,
        features: expect.objectContaining({
          maxCharacters: 5,
          unlimitedHeart: false,
          exclusiveSkins: false,
          extraExpMultiplier: 1
        })
      })
    );
  });

  it('renders edit mode prefilled with plan data and disables code input', () => {
    const existingPlan = {
      id: 99,
      code: 'guru_expert',
      name: 'Guru Expert VIP',
      audience: 'guru',
      price: 150000,
      durationDays: 60,
      isActive: true,
      features: {
        maxClasses: 20,
        maxStudentsPerRoom: 100,
        exportReports: true,
        aiQuestionGenerator: true
      }
    };

    const handleSave = jest.fn();
    render(
      <PlanModal
        isOpen={true}
        onClose={jest.fn()}
        onSave={handleSave}
        plan={existingPlan}
      />
    );

    expect(container.textContent).toContain('Edit Paket: Guru Expert VIP');

    const inputs = container.querySelectorAll('input');
    const codeInput = Array.from(inputs).find((i) => i.value === 'guru_expert');
    expect(codeInput).toBeTruthy();
    expect(codeInput.disabled).toBe(true);

    const submitBtn = Array.from(container.querySelectorAll('button')).find((b) =>
      b.textContent.includes('Simpan Perubahan')
    );
    expect(submitBtn).toBeTruthy();

    act(() => {
      submitBtn.click();
    });

    expect(handleSave).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Guru Expert VIP',
        price: 150000,
        durationDays: 60,
        isActive: true,
        features: expect.objectContaining({
          maxClasses: 20,
          maxStudentsPerRoom: 100,
          exportReports: true,
          aiQuestionGenerator: true
        })
      })
    );
  });
});
