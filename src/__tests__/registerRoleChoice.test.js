import React, { act } from 'react';
import ReactDOM from 'react-dom/client';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import RegisterPage from '../pages/register';
import RoleChoice from '../component/component_register/molecules/roleChoice';
import {
  requestRegistrationOtp,
  saveCompleteProfile,
  updateManualRole,
  verifyRegistrationOtp
} from '../database/manualAuth';
import {
  authenticateWithBackendGoogle,
  loadGoogleIdentityScript,
  promptGoogleSignIn
} from '../database/googleCloudAuth';

global.IS_REACT_ACT_ENVIRONMENT = true;

let capturedGsiCallback = null;

jest.mock('../database/manualAuth', () => ({
  clearManualSession: jest.fn(),
  requestRegistrationOtp: jest.fn(),
  saveCompleteProfile: jest.fn(),
  updateManualRole: jest.fn(),
  verifyRegistrationOtp: jest.fn()
}));

jest.mock('../database/googleCloudAuth', () => ({
  authenticateWithBackendGoogle: jest.fn(),
  loadGoogleIdentityScript: jest.fn(),
  promptGoogleSignIn: jest.fn()
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

const changeInput = async (element, value) => {
  await act(async () => {
    if (element.type === 'radio') {
      element.click();
      return;
    }
    const proto = element instanceof HTMLSelectElement ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
    if (setter) setter.call(element, value);
    else element.value = value;
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
  });
};

describe('Registration Role Choice (R1–R4)', () => {
  beforeEach(() => {
    capturedGsiCallback = null;
    requestRegistrationOtp.mockImplementation(() => Promise.resolve({ message: 'OTP sent' }));
    saveCompleteProfile.mockImplementation(() => Promise.resolve({
      user: { id: 1, username: 'tester', email: 't@example.com', role: null, teacherApplication: { status: 'pending' } }
    }));
    updateManualRole.mockImplementation(() => Promise.resolve({
      user: { id: 1, username: 'tester', email: 't@example.com', role: 'siswa' }
    }));
    verifyRegistrationOtp.mockImplementation(() => Promise.resolve({
      user: { id: 1, username: 'tester', email: 't@example.com', role: null },
      token: 'jwt-token'
    }));
    authenticateWithBackendGoogle.mockImplementation(() => Promise.resolve({
      success: true,
      user: { id: 2, username: 'guser', email: 'g@example.com', role: null, teacherApplication: { status: 'pending' } },
      token: 'google-jwt'
    }));
    loadGoogleIdentityScript.mockImplementation(() => Promise.resolve({
      initialize: ({ callback }) => {
        capturedGsiCallback = callback;
      },
      renderButton: () => {}
    }));
    promptGoogleSignIn.mockImplementation(() => Promise.resolve('mock-google-id-token'));
  });

  it('RoleChoice allows Siswa immediately and requires fullName + subject + yellow hint for Guru', async () => {
    const Wrapper = () => {
      const [role, setRole] = React.useState('siswa');
      const [fullName, setFullName] = React.useState('');
      const [subject, setSubject] = React.useState('');
      const [proceeded, setProceeded] = React.useState(false);
      return (
        <div>
          <RoleChoice
            role={role}
            fullName={fullName}
            subject={subject}
            onChangeRole={setRole}
            onChangeFullName={setFullName}
            onChangeSubject={setSubject}
            nextStep={() => setProceeded(true)}
          />
          {proceeded && <span data-testid="proceeded">yes</span>}
        </div>
      );
    };

    const view = await mount(<Wrapper />);
    expect(view.container.querySelector('.register-form.role-choice-form')).toBeTruthy();

    const stepLabels = Array.from(view.container.querySelectorAll('.progress-step span')).map((el) => el.textContent);
    expect(stepLabels).toEqual(['Pendaftaran', 'Data diri', 'Verifikasi', 'Pilih Role']);
    expect(view.container.querySelector('.progress-step:last-child span')?.className).toContain('active-label');

    const guruRadio = view.container.querySelector('input[name="register-role"][value="guru"]');
    await changeInput(guruRadio, 'guru');

    const hint = view.container.querySelector('.role-choice-pending-hint');
    expect(hint).toBeTruthy();
    expect(hint.textContent).toContain('Menunggu Persetujuan Admin');

    const nextBtn = view.container.querySelector('.next-button');
    expect(nextBtn.disabled).toBe(true);

    const nameInput = view.container.querySelector('.role-choice-field input');
    const subjectSelect = view.container.querySelector('.role-choice-field select');
    await changeInput(nameInput, 'Ibu Guru Biologi');
    await changeInput(subjectSelect, 'Biologi');

    expect(nextBtn.disabled).toBe(false);
    await act(async () => nextBtn.click());
    expect(view.container.querySelector('[data-testid="proceeded"]')).toBeTruthy();

    await view.unmount();
  });

  it('RegisterPage places RoleChoice at the final step after Google credential and forwards Guru role to Google register', async () => {
    const LocationDisplay = () => {
      const loc = useLocation();
      return <div data-testid="loc">{loc.pathname}</div>;
    };

    const view = await mount(
      <MemoryRouter initialEntries={[{ pathname: '/register', state: { fromGoogleLogin: true, email: 'newguru@gmail.com', name: 'Pak Guru' } }]}>
        <Routes>
          <Route path="/register" element={<RegisterPage />} />
          <Route path="*" element={<LocationDisplay />} />
        </Routes>
      </MemoryRouter>
    );

    expect(typeof capturedGsiCallback).toBe('function');
    await act(async () => {
      await capturedGsiCallback({ credential: 'mock-google-id-token' });
    });

    expect(view.container.querySelector('.register-form.role-choice-form')).toBeTruthy();

    const guruRadio = view.container.querySelector('input[name="register-role"][value="guru"]');
    await changeInput(guruRadio, 'guru');

    const subjectSelect = view.container.querySelector('.role-choice-field select');
    await changeInput(subjectSelect, 'Matematika');

    const nextBtn = view.container.querySelector('.next-button');
    await act(async () => nextBtn.click());

    expect(authenticateWithBackendGoogle).toHaveBeenCalledWith(
      'mock-google-id-token',
      'register',
      {
        role: 'guru',
        fullName: 'Pak Guru',
        subject: 'Matematika'
      }
    );
    expect(view.container.querySelector('[data-testid="loc"]')?.textContent).toBe('/complete-profile');

    await view.unmount();
  });
});
