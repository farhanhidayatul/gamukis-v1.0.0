import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import { signInWithGoogle } from '../../database/firebaseAuth';
import { manualLogin } from '../../database/manualAuth';
import { createBackendSession } from '../../database/firebaseDatabase';
import ButtonLoginGoogle from './component_login_asset/buttonLoginGoogle';
import '../component_login/backgroundKiri.css';
import InputPassword from './component_login_asset/inputPassword';
import InputEmailUsername from './component_login_asset/inputEmailUsername';
import ButtonLogin from './component_login_asset/buttonLogin';

const BackgroundKiri = ({ onLoginError }) => {
    const [emailOrUsername, setEmailOrUsername] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const navigate = useNavigate(); // Inisialisasi navigasi

    const completeLogin = async (loginAction, source) => {
        setIsSubmitting(true);
        try {
                const loginResult = await loginAction();
                const role = String(loginResult?.user?.role || '').toLowerCase();
                if (['admin', 'administrator'].includes(role)) navigate('/admin/dashboard');
                else navigate(['siswa', 'guru'].includes(role) ? '/home' : '/complete-profile');
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

    const handleGoogleLogin = () => {
        completeLogin(async () => {
            await signInWithGoogle();
            return createBackendSession();
        }, 'google');
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
                <ButtonLoginGoogle onClick={handleGoogleLogin} disabled={isSubmitting} />
                <p className='font-nohaveaccount'>
                Belum punya akun? 
                <a href="/register"> Daftar</a> sekarang!!
            </p>
            </form>
        </div>
    );
};

export default BackgroundKiri;

