import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ReactGA from 'react-ga4';
import Loading from './pages/loading';
import Home from './pages/home';
import Game from './pages/game';
import Tutorial from './pages/tutorial';
import About from './pages/about';
import NF from './pages/notfound';
import InGame from "./component/component_game/inGame";
import GamePage from "./pages/gamePage";
import Login from "./pages/login"
import Register from "./pages/register"
import ForgotPassword from "./pages/forgotPassword";
import Result from "./pages/result";
import Profile from "./pages/profile";
import CharacterCustomization from "./pages/characterCustomization";
import CompleteProfile from "./pages/completeProfile";
import AdminDashboard from "./pages/adminDashboard";
import MembershipPlans from "./pages/membershipPlans";
import MembershipDashboard from "./pages/membershipDashboard";
import StudentClass from "./pages/studentClass";
import TeacherDashboard from "./pages/teacherDashboard";
import TeacherClassEditor from "./pages/teacherClassEditor";
import StudentDashboard from "./pages/studentDashboard";
import TeacherClassroom from "./pages/teacherClassroom";
import TeacherAiQuestionGenerator from "./pages/teacherAiQuestionGenerator";
import RoleProtectedRoute from "./component/common/RoleProtectedRoute";
import UniversalCryptoGate from "./pages/UniversalCryptoGate";

const TRACKING_ID = "G-FLNMFT2FES"; // Your Google Analytics tracking ID
ReactGA.initialize(TRACKING_ID);

const App = () => {
  useEffect(() => {
    const sendPageView = () => {
      ReactGA.send({
        hitType: "pageview",
        page_location: window.location.href,
        page_title: document.title
      });
    };

    sendPageView(); // Initial page view

    // Listen for route changes
    const handleRouteChange = () => {
      sendPageView();
    };

    window.addEventListener("popstate", handleRouteChange);

    return () => {
      window.removeEventListener("popstate", handleRouteChange);
    };
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Loading />} />
        <Route path="/home" element={<Home />} />
        <Route path="/game" element={<Game />} />
        <Route path="/tutorial" element={<Tutorial />} />
        <Route path="/about" element={<About />} />
        <Route path="/gamePage" element={<GamePage />} />
        <Route path="/inGame" element={<InGame/>} />
        <Route path="/result" element={<Result/>} />
        <Route path="/login" element={<Login/>} />
        <Route path="/register" element={<Register/>} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/membership/plans" element={<MembershipPlans />} />
        <Route path="/plans" element={<MembershipPlans />} />
        <Route path="/membership" element={<MembershipDashboard />} />
        <Route path="/membership/dashboard" element={<MembershipDashboard />} />
        <Route path="/character-customization" element={<CharacterCustomization />} />
        <Route path="/complete-profile" element={<CompleteProfile />} />
        <Route path="/kelas" element={<StudentClass />} />
        <Route path="/kelas-siswa" element={<StudentClass />} />
        <Route path="/kelas/:slug" element={<StudentClass />} />
        <Route path="/guru/dashboard" element={<RoleProtectedRoute allowedRoles={["guru"]}><TeacherDashboard /></RoleProtectedRoute>} />
        <Route path="/guru/classes/new" element={<RoleProtectedRoute allowedRoles={["guru"]}><TeacherClassEditor /></RoleProtectedRoute>} />
        <Route path="/guru/classes/:classId/edit" element={<RoleProtectedRoute allowedRoles={["guru"]}><TeacherClassEditor /></RoleProtectedRoute>} />
        <Route path="/guru/classes/:classId/ai-soal" element={<RoleProtectedRoute allowedRoles={["guru"]}><TeacherAiQuestionGenerator /></RoleProtectedRoute>} />
        <Route path="/siswa/dashboard" element={<RoleProtectedRoute allowedRoles={["siswa"]}><StudentDashboard /></RoleProtectedRoute>} />
        <Route path="/siswa/classes/:classId" element={<RoleProtectedRoute allowedRoles={["siswa"]}><TeacherClassroom /></RoleProtectedRoute>} />
        {/* Admin Dashboard: Dynamic Crypto Hash Slugs (Jurus 2 URL Obfuscation) */}
        <Route path="/admin/s/:hashSlug" element={<RoleProtectedRoute allowedRoles={["admin", "administrator"]}><AdminDashboard /></RoleProtectedRoute>} />
        {/* Universal Dynamic Cryptographic Route Obfuscation */}
        <Route path="/s/:cryptoSlug" element={<UniversalCryptoGate />} />
        <Route path="/admin/dashboard" element={<RoleProtectedRoute allowedRoles={["admin", "administrator"]}><AdminDashboard section="overview" /></RoleProtectedRoute>} />
        <Route path="/admin/bug-detector" element={<RoleProtectedRoute allowedRoles={["admin", "administrator"]}><AdminDashboard section="bug-detector" /></RoleProtectedRoute>} />
        <Route path="/admin/rooms" element={<RoleProtectedRoute allowedRoles={["admin", "administrator"]}><AdminDashboard section="rooms" /></RoleProtectedRoute>} />
        <Route path="/admin/monitoring" element={<RoleProtectedRoute allowedRoles={["admin", "administrator"]}><AdminDashboard section="monitoring" /></RoleProtectedRoute>} />
        <Route path="/admin/teachers" element={<RoleProtectedRoute allowedRoles={["admin", "administrator"]}><AdminDashboard section="teachers" /></RoleProtectedRoute>} />
        <Route path="/admin/curriculum" element={<RoleProtectedRoute allowedRoles={["admin", "administrator"]}><AdminDashboard section="curriculum" /></RoleProtectedRoute>} />
        <Route path="/admin/kurikulum" element={<RoleProtectedRoute allowedRoles={["admin", "administrator"]}><AdminDashboard section="curriculum" /></RoleProtectedRoute>} />
        <Route path="/admin/classes" element={<RoleProtectedRoute allowedRoles={["admin", "administrator"]}><AdminDashboard section="classes" /></RoleProtectedRoute>} />
        <Route path="/admin/memberships" element={<RoleProtectedRoute allowedRoles={["admin", "administrator"]}><AdminDashboard section="memberships" /></RoleProtectedRoute>} />
        <Route path="/admin/history" element={<RoleProtectedRoute allowedRoles={["admin", "administrator"]}><AdminDashboard section="history" /></RoleProtectedRoute>} />
        <Route path="/admin/ai-soal" element={<RoleProtectedRoute allowedRoles={["admin", "administrator"]}><AdminDashboard section="ai-soal" /></RoleProtectedRoute>} />
        <Route path="/admin/ai" element={<RoleProtectedRoute allowedRoles={["admin", "administrator"]}><AdminDashboard section="ai-soal" /></RoleProtectedRoute>} />
        <Route path="/admin/ai-results" element={<RoleProtectedRoute allowedRoles={["admin", "administrator"]}><AdminDashboard section="ai-results" /></RoleProtectedRoute>} />
        <Route path="/admin/tutorial" element={<RoleProtectedRoute allowedRoles={["admin", "administrator"]}><AdminDashboard section="tutorial" /></RoleProtectedRoute>} />
        <Route path="*" element={<NF />} />

      </Routes>
    </Router>
  );
}

export default App;
