import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithGoogle } from '../../database/firebaseAuth';
import { promptGoogleSignIn, authenticateWithBackendGoogle } from '../../database/googleCloudAuth';
import { clearManualSession, getManualAccount, manualLogin } from '../../database/manualAuth';
import { createBackendSession } from '../../database/firebaseDatabase';
import ButtonLoginGoogle from './component_login_asset/buttonLoginGoogle';
import '../component_login/backgroundKiri.css';
import InputPassword from './component_login_asset/inputPassword';
import InputEmailUsername from './component_login_asset/inputEmailUsername';
import ButtonLogin from './component_login_asset/buttonLogin';

const resolveEffectiveRole = (user) => {
    const directRole = String(user?.role || '').toLowerCase();
    if (directRole) return directRole;
    if (String(user?.teacherApplication?.status || '').toLowerCase() === 'approved') {
        return 'guru';
    }
    return '';
};

const BackgroundKiri = ({ onLoginError }) => {
    const [emailOrUsername, setEmailOrUsername] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const navigate = useNavigate();

    const completeLogin = async (loginAction, source) => {
        setIsSubmitting(true);
        try {
            const loginResult = await loginAction();
            let userObj = loginResult?.user || null;
            let role = resolveEffectiveRole(userObj);

            if (!role && source === 'manual') {
                try {
                    const accountRes = await getManualAccount();
                    if (accountRes?.user) {
                        userObj = accountRes.user;
                        role = resolveEffectiveRole(userObj);
                    }
                } catch (_) {
                    // fallback to loginResult role
                }
            }

            if (['admin', 'administrator'].includes(role)) navigate('/admin/dashboard');
            else if (role === 'guru') navigate('/guru/dashboard');
            else if (role === 'siswa') navigate('/siswa/dashboard');
            else navigate('/complete-profile');
        } catch (loginError) {
            onLoginError({
                source,
                message: loginError.message || 'Login gagal. Periksa kembali data Anda.'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        completeLogin(() => manualLogin(emailOrUsername, password, rememberMe), 'manual');
    };

    const handleGoogleCredential = (idToken) => {
        completeLogin(async () => {
            if (typeof clearManualSession === 'function') {
                clearManualSession();
            }

            const session = await authenticateWithBackendGoogle(idToken);

            if (session?.user && typeof window !== 'undefined') {
                // Always persist Google login in localStorage to prevent session dropping
                window.localStorage?.setItem('gamukis_manual_user', JSON.stringify(session.user));
                if (session.token) {
                    window.localStorage?.setItem('gamukis_manual_token', session.token);
                }
                window.dispatchEvent(new Event('gamukis-manual-auth-change'));
            }
            return session;
        }, 'google');
    };

    const handleGoogleError = (err) => {
        onLoginError({
            source: 'google',
            message: err?.message || 'Login Google gagal. Silakan coba kembali.'
        });
    };

    return (
        <div className="login-right">
            <form onSubmit={handleSubmit}>
                <h2 className="font-welcome">
                    Selamat datang di <br /> <span className="font-gamukis">GAMUKIS</span>
                </h2>
                <InputEmailUsername setInputEmailUsername={setEmailOrUsername} />
                <InputPassword setInputPassword={setPassword} />
                <div className='flex-row-container'>
                    <div className="remember-me">
                        <input type="checkbox" id="remember" checked={rememberMe} onChange={(event) => setRememberMe(event.target.checked)} />
                        <label htmlFor="remember">Remember me</label>
                    </div>
                    <a className="font-lupapassword" href="/forgot-password">
                        Lupa password?
                    </a>
                </div>
                <ButtonLogin inputEmailUsername={emailOrUsername} inputPassword={password} disabled={isSubmitting} />
                <ButtonLoginGoogle 
                    onCredentialSuccess={handleGoogleCredential}
                    onCredentialError={handleGoogleError}
                    disabled={isSubmitting} 
                />
                <p className='font-nohaveaccount'>
                Belum punya akun? 
                <a href="/register"> Daftar</a> sekarang!!
            </p>
            </form>
        </div>
    );
};

export default BackgroundKiri;
