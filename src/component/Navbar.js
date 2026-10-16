import React, { useEffect, useRef, useState } from 'react';
import { NavLink } from 'react-router-dom';
import "../component/Navbar.css";
import Img from '../images/Gamukis.png';
import DefaultProfile from '../images/people-profile.png';
import { auth, onAuthStateChanged } from '../database/firebaseAuth';
import { clearManualSession, getManualUser } from '../database/manualAuth';
import { signOut } from 'firebase/auth';

const Navbar = ({ src, alt }) => {
  const [user, setUser] = useState(null);
  const [manualUser, setManualUser] = useState(() => getManualUser());
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (authUser) => {
      setUser(authUser && !authUser.isAnonymous ? authUser : null);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    const refreshManualUser = () => setManualUser(getManualUser());
    const handleStorageChange = (event) => {
      if (event.key === 'gamukis_manual_user' || event.key === 'gamukis_manual_token') {
        refreshManualUser();
      }
    };

    window.addEventListener('gamukis-manual-auth-change', refreshManualUser);
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('gamukis-manual-auth-change', refreshManualUser);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setIsProfileMenuOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsProfileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      clearManualSession();
      setManualUser(null);
      setIsProfileMenuOpen(false);
    } catch (error) {
      console.error('Gagal keluar:', error);
    }
  };

  const activeUser = user || manualUser;
  const displayName = activeUser?.displayName || activeUser?.username || activeUser?.email?.split('@')[0] || 'Pengguna';
  const profileImage = activeUser?.photoURL || DefaultProfile;

  return (
    <div className="fContainer">
      <nav className="wrapper">
        <div className='ImgContainer'>
          <div className='ImgContainer-2'>
            <img src={Img} alt={alt} className="Img" />
          </div>
        </div>
        
        <ul className='navigation'>
          <li><NavLink end to="/home" className={({ isActive }) => isActive ? 'active' : ''}>Home</NavLink></li>
          <li><NavLink to="/kelas" className={({ isActive }) => isActive ? 'active' : ''}>Kelas Siswa</NavLink></li>
          <li><NavLink to="/game" className={({ isActive }) => isActive ? 'active' : ''}>Game</NavLink></li>
          <li><NavLink to="/membership/plans" className={({ isActive }) => isActive ? 'active' : ''}>Membership</NavLink></li>
          <li><NavLink to="/tutorial" className={({ isActive }) => isActive ? 'active' : ''}>Tutorial</NavLink></li>
          <li><NavLink to="/about" className={({ isActive }) => isActive ? 'active' : ''}>About</NavLink></li>
        </ul>

        {activeUser ? (
          <div className="profile-menu" ref={profileMenuRef}>
            <button
              type="button"
              className="profile-trigger"
              aria-expanded={isProfileMenuOpen}
              aria-haspopup="menu"
              onClick={() => setIsProfileMenuOpen((isOpen) => !isOpen)}
            >
              <span className="profile-greeting">
                <span>Semangat!</span>
                <strong>{displayName}</strong>
              </span>
              <img src={profileImage} alt={`Profil ${displayName}`} className="profile-image" />
              <span className="profile-chevron" aria-hidden="true">▾</span>
            </button>

            {isProfileMenuOpen && (
              <div className="profile-dropdown" role="menu">
                <NavLink to="/profile" role="menuitem" onClick={() => setIsProfileMenuOpen(false)}>
                  Profil saya
                </NavLink>
                <NavLink to="/membership" role="menuitem" onClick={() => setIsProfileMenuOpen(false)}>
                  Langganan Saya
                </NavLink>
                <button type="button" role="menuitem" onClick={handleSignOut}>
                  Keluar
                </button>
              </div>
            )}
          </div>
        ) : (
          <button className='btn-login'><NavLink to="/login" className="Navlink"><b>Masuk / Daftar</b></NavLink></button>
        )}
      </nav>
    </div>
  );
}

export default Navbar;
