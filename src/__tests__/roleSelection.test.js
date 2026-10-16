import React, { act } from 'react';
import ReactDOM from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import CompleteProfile from '../pages/completeProfile';
import ProfileRoleSelector from '../component/component_profile/molecules/ProfileRoleSelector';
import { getManualAccount, getManualUser, saveCompleteProfile } from '../database/manualAuth';

global.IS_REACT_ACT_ENVIRONMENT = true;

jest.mock('../database/firebaseAuth', () => ({
  auth: {},
  onAuthStateChanged: (_auth, callback) => {
    callback(null);
    return () => {};
  }
}));

jest.mock('../database/manualAuth', () => ({
  getManualUser: jest.fn(() => ({ id: '42', username: 'learner', role: null })),
  getManualAccount: jest.fn(() => Promise.resolve({ user: { id: '42', role: null, teacherApplication: null } })),
  saveCompleteProfile: jest.fn(),
  saveManualProfile: jest.fn(),
  updateManualRole: jest.fn()
}));

jest.mock('../database/firebaseDatabase', () => ({
  saveFirebaseCompleteProfile: jest.fn()
}));

const mount = async (element) => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = ReactDOM.createRoot(container);
  await act(async () => root.render(element));
  return {
    container,
    unmount: async () => {
      await act(async () => root.unmount());
      container.remove();
    }
  };
};

const changeValue = async (element, value) => {
  await act(async () => {
    const isCheckable = element.type === 'radio' || element.type === 'checkbox';
    if (isCheckable) {
      element.click();
    } else {
      const proto = element instanceof HTMLSelectElement ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
      const nativeSetter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
      if (nativeSetter) {
        nativeSetter.call(element, value);
      } else {
        element.value = value;
      }
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });
};

const submitForm = async (form) => {
  await act(async () => {
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  });
};

describe('explicit role selection', () => {
  beforeEach(() => {
    getManualUser.mockReturnValue({ id: '42', username: 'learner', role: null });
    getManualAccount.mockReset().mockResolvedValue({ user: { id: '42', role: null, teacherApplication: null } });
    saveCompleteProfile.mockReset().mockResolvedValue({ success: true });
  });

  it('keeps onboarding role unset until the user chooses one', async () => {
    const view = await mount(<MemoryRouter><CompleteProfile /></MemoryRouter>);
    const roleInputs = view.container.querySelectorAll('input[name="role"]');

    expect([...roleInputs].some((input) => input.checked)).toBe(false);
    expect(view.container.querySelector('.complete-profile-submit').disabled).toBe(true);
    expect(view.container.textContent).toContain('Pilih peran Siswa atau Guru');

    await view.unmount();
  });

  it('saves the explicitly selected Guru role with a subject', async () => {
    const view = await mount(<MemoryRouter><CompleteProfile /></MemoryRouter>);
    const guruInput = view.container.querySelector('input[name="role"][value="guru"]');
    await changeValue(guruInput, 'guru');

    const nameInput = view.container.querySelector('input[placeholder="Masukkan nama lengkap Anda"]');
    await changeValue(nameInput, 'Guru Contoh');
    const subjectInput = view.container.querySelector('select');
    await changeValue(subjectInput, 'Matematika');

    const form = view.container.querySelector('form');
    await submitForm(form);

    expect(saveCompleteProfile).toHaveBeenCalledWith({
      role: 'guru',
      fullName: 'Guru Contoh',
      subject: 'Matematika'
    });
    await view.unmount();
  });

  it('shows a pending Guru request and requires the user to wait for review', async () => {
    getManualAccount.mockResolvedValue({ user: {
      id: '42', role: null,
      teacherApplication: { status: 'pending', fullName: 'Guru Contoh', subject: 'IPA' }
    } });
    const view = await mount(<MemoryRouter><CompleteProfile /></MemoryRouter>);

    expect(view.container.textContent).toContain('Pengajuan Guru sedang menunggu persetujuan');
    expect(view.container.querySelector('input[name="role"][value="guru"]').checked).toBe(true);
    expect(view.container.querySelector('.complete-profile-submit').disabled).toBe(true);
    await view.unmount();
  });

  it('lets a rejected applicant choose a role again', async () => {
    getManualAccount.mockResolvedValue({ user: {
      id: '42', role: null,
      teacherApplication: { status: 'rejected', fullName: 'Guru Contoh', subject: 'IPA' }
    } });
    const view = await mount(<MemoryRouter><CompleteProfile /></MemoryRouter>);

    expect(view.container.textContent).toContain('Pengajuan Guru sebelumnya ditolak');
    expect([...view.container.querySelectorAll('input[name="role"]')].some((input) => input.checked)).toBe(false);
    await view.unmount();
  });

  it('saves the explicitly selected Siswa role without a subject', async () => {
    const onSave = jest.fn().mockResolvedValue({ success: true });
    const view = await mount(
      <ProfileRoleSelector currentRole={null} currentSubject="" onSave={onSave} isSaving={false} />
    );
    const siswaInput = view.container.querySelector('input[name="profile-role"][value="siswa"]');
    await changeValue(siswaInput, 'siswa');
    await submitForm(view.container.querySelector('form'));

    expect(onSave).toHaveBeenCalledWith({ role: 'siswa', subject: '' });
    await view.unmount();
  });

  it('shows a recoverable error when saving a selected role fails', async () => {
    const onSave = jest.fn().mockRejectedValue(new Error('Gagal menyimpan peran.'));
    const view = await mount(
      <ProfileRoleSelector currentRole={null} currentSubject="" onSave={onSave} isSaving={false} />
    );
    const siswaInput = view.container.querySelector('input[name="profile-role"][value="siswa"]');
    await changeValue(siswaInput, 'siswa');
    await submitForm(view.container.querySelector('form'));

    expect(view.container.querySelector('[role="alert"]').textContent).toContain('Gagal menyimpan peran.');
    expect(siswaInput.checked).toBe(true);
    expect(view.container.querySelector('button[type="submit"]').disabled).toBe(false);
    await view.unmount();
  });
});
