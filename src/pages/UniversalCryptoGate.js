import React, { useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { resolveCryptoSlug } from '../utils/universalCryptoRouter';

// Page components
import Home from './home';
import Game from './game';
import Tutorial from './tutorial';
import About from './about';
import GamePage from './gamePage';
import InGame from '../component/component_game/inGame';
import Result from './result';
import Login from './login';
import Register from './register';
import ForgotPassword from './forgotPassword';
import Profile from './profile';
import MembershipPlans from './membershipPlans';
import MembershipDashboard from './membershipDashboard';
import CharacterCustomization from './characterCustomization';
import CompleteProfile from './completeProfile';
import StudentClass from './studentClass';
import TeacherDashboard from './teacherDashboard';
import TeacherClassEditor from './teacherClassEditor';
import StudentDashboard from './studentDashboard';
import RoleProtectedRoute from '../component/common/RoleProtectedRoute';

/**
 * UniversalCryptoGate
 * Dynamically resolves ephemeral crypto slug /s/:cryptoSlug and renders the target view
 */
export default function UniversalCryptoGate() {
  const { cryptoSlug } = useParams();
  const navigate = useNavigate();

  const resolved = useMemo(() => {
    return resolveCryptoSlug(cryptoSlug);
  }, [cryptoSlug]);

  useEffect(() => {
    if (!resolved) {
      // Replay attack, expired token, or invalid slug -> fallback safely
      navigate('/home', { replace: true });
    }
  }, [resolved, navigate]);

  if (!resolved) {
    return null;
  }

  const { routeKey, params } = resolved;

  switch (routeKey) {
    case 'home':
      return <Home />;
    case 'game':
      return <Game />;
    case 'tutorial':
      return <Tutorial />;
    case 'about':
      return <About />;
    case 'gamePage':
      return <GamePage />;
    case 'inGame':
      return <InGame />;
    case 'result':
      return <Result />;
    case 'login':
      return <Login />;
    case 'register':
      return <Register />;
    case 'forgotPassword':
      return <ForgotPassword />;
    case 'profile':
      return <Profile />;
    case 'membership':
    case 'membershipDashboard':
      return <MembershipDashboard />;
    case 'membershipPlans':
      return <MembershipPlans />;
    case 'characterCustomization':
      return <CharacterCustomization />;
    case 'completeProfile':
      return <CompleteProfile />;
    case 'kelas':
      return <StudentClass {...params} />;
    case 'guruDashboard':
      return (
        <RoleProtectedRoute allowedRoles={['guru']}>
          <TeacherDashboard />
        </RoleProtectedRoute>
      );
    case 'guruClassesNew':
      return (
        <RoleProtectedRoute allowedRoles={['guru']}>
          <TeacherClassEditor />
        </RoleProtectedRoute>
      );
    case 'siswaDashboard':
      return (
        <RoleProtectedRoute allowedRoles={['siswa']}>
          <StudentDashboard />
        </RoleProtectedRoute>
      );
    default:
      return <Home />;
  }
}
