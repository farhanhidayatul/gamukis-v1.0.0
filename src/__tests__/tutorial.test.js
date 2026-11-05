import React, { act } from "react";
import fs from "fs";
import path from "path";
import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import Tutorial from "../pages/tutorial";

jest.mock("../component/Navbar", () => () => <nav data-testid="main-navbar" />);
jest.mock(
  "../component/component_customization_char/characterCustomization",
  () => () => (
    <div className="character-customization-page" data-testid="character-customization-mock">
      <h1>Kustomisasi Karakter</h1>
      <button type="button">Konfirmasi Karakter Anda</button>
    </div>
  )
);

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

describe("GAMUKIS Interactive Tutorial", () => {
  let container;
  let root;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  const renderTutorial = () => act(() => {
    root.render(
      <MemoryRouter>
        <Tutorial />
      </MemoryRouter>
    );
  });

  const clickButton = (selector) => act(() => {
    container.querySelector(selector).click();
  });

  it("shows the student guide by default with a working class link", () => {
    renderTutorial();

    expect(container.querySelector('[data-testid="main-navbar"]')).not.toBeNull();
    expect(container.querySelectorAll('[data-testid="tutorial-stage"]')).toHaveLength(20);
    expect(container.querySelector("#tutorial-stage-1 h3").textContent).toBe("Loading Page");
    expect(container.querySelector("#tutorial-stage-2 h3").textContent).toBe("Home Before Login/Register");
    const homeFrame = container.querySelector("#tutorial-stage-2 .tutorial-home-frame");
    const loginFrame = container.querySelector("#tutorial-stage-3 .tutorial-auth-frame");
    const characterFrame = container.querySelector("#tutorial-stage-8 .tutorial-character-frame");
    const completeProfileFrame = container.querySelector("#tutorial-stage-7 .tutorial-profile-frame");
    const classesFrame = container.querySelector("#tutorial-stage-10 .tutorial-classes-frame");
    const studentDashboardFrame = container.querySelector("#tutorial-stage-11 .tutorial-student-dashboard-frame");
    const classroomEntryFrame = container.querySelector("#tutorial-stage-12 .tutorial-classroom-frame");
    const courseFrame = container.querySelector("#tutorial-stage-13 .tutorial-course-frame");
    const accountProfileFrame = container.querySelector("#tutorial-stage-16 .tutorial-profile-frame");
    const membershipPlansFrame = container.querySelector("#tutorial-stage-17 .tutorial-membership-frame");
    const membershipDashboardFrame = container.querySelector("#tutorial-stage-18 .tutorial-membership-frame");
    const gamePlaceholderFrame = container.querySelector("#tutorial-stage-19 .tutorial-game-route-frame");
    const aboutFrame = container.querySelector("#tutorial-stage-20 .tutorial-about-frame");
    expect(homeFrame.getAttribute("src")).toBe("/home");
    expect(homeFrame.getAttribute("width")).toBe("1366");
    expect(homeFrame.getAttribute("height")).toBe("768");
    expect(loginFrame.getAttribute("src")).toBe("/login");
    expect(loginFrame.getAttribute("width")).toBe("1366");
    expect(loginFrame.getAttribute("height")).toBe("768");
    expect(characterFrame.getAttribute("src")).toBe("/character-customization");
    expect(characterFrame.getAttribute("width")).toBe("1366");
    expect(characterFrame.getAttribute("height")).toBe("768");
    expect(completeProfileFrame.getAttribute("src")).toBe("/complete-profile");
    expect(classesFrame.getAttribute("src")).toBe("/kelas");
    expect(studentDashboardFrame.getAttribute("src")).toBe("/siswa/dashboard");
    expect(classroomEntryFrame.getAttribute("src")).toBe("/siswa/dashboard");
    expect(courseFrame.getAttribute("src")).toBe("/gamePage");
    expect(courseFrame.getAttribute("width")).toBe("1366");
    expect(courseFrame.getAttribute("height")).toBe("768");
    expect(accountProfileFrame.getAttribute("src")).toBe("/profile");
    expect(membershipPlansFrame.getAttribute("src")).toBe("/membership/plans");
    expect(membershipDashboardFrame.getAttribute("src")).toBe("/membership");
    expect(gamePlaceholderFrame.getAttribute("src")).toBe("/game");
    expect(aboutFrame.getAttribute("src")).toBe("/about");
    expect(container.querySelector("#tutorial-stage-3 h3").textContent).toBe("Login");
    expect(container.querySelector("#tutorial-stage-4 h3").textContent).toBe("Register 01");
    expect(container.querySelector("#tutorial-stage-5 h3").textContent).toBe("Register 03");
    expect(container.querySelector("#tutorial-stage-6 h3").textContent).toBe("Register 04");
    expect(container.querySelector("#tutorial-stage-7 h3").textContent).toBe("Lengkapi Profil Jika Diminta");
    expect(container.querySelector("#tutorial-stage-8 h3").textContent).toBe("Persiapan Karakter");
    expect(container.querySelector("#tutorial-stage-9 h3").textContent).toBe("Home Selection Course");
    expect(container.querySelector("#tutorial-stage-10 h3").textContent).toBe("Jelajahi Kelas Siswa");
    expect(container.querySelector("#tutorial-stage-11 h3").textContent).toBe("Dashboard Belajar Siswa");
    expect(container.querySelector("#tutorial-stage-12 h3").textContent).toBe("Belajar di Ruang Kelas");
    expect(container.querySelector("#tutorial-stage-13 h3").textContent).toBe("Course Before Start Game");
    expect(container.querySelector("#tutorial-stage-14 h3").textContent).toBe("Proses Permainan");
    expect(container.querySelector("#tutorial-stage-15 h3").textContent).toBe("Hasil Akhir dan Papan Peringkat");
    expect(container.querySelector("#tutorial-stage-16 h3").textContent).toBe("Kelola Profil Akun");
    expect(container.querySelector("#tutorial-stage-17 h3").textContent).toBe("Lihat Paket Keanggotaan");
    expect(container.querySelector("#tutorial-stage-18 h3").textContent).toBe("Kelola Keanggotaan");
    expect(container.querySelector("#tutorial-stage-19 h3").textContent).toBe("Menu Game Saat Ini");
    expect(container.querySelector("#tutorial-stage-20 h3").textContent).toBe("Tentang GAMUKIS");
    expect(container.querySelector("#tutorial-stage-1 .tutorial-action-link").getAttribute("href")).toBe("/");
    expect(container.querySelector("#tutorial-stage-3 .tutorial-action-link").getAttribute("href")).toBe("/login");
    expect(container.querySelector("#tutorial-stage-4 .tutorial-action-link").getAttribute("href")).toBe("/register");
    expect(container.querySelector("#tutorial-stage-5 .tutorial-action-link").getAttribute("href")).toBe("/register");
    expect(container.querySelector("#tutorial-stage-7 .tutorial-action-link").getAttribute("href")).toBe("/complete-profile");
    expect(container.querySelector("#tutorial-stage-8 .tutorial-action-link").getAttribute("href")).toBe("/character-customization");
    expect(container.querySelector("#tutorial-stage-9 .tutorial-action-link").getAttribute("href")).toBe("/home");
    expect(container.querySelector("#tutorial-stage-10 .tutorial-action-link").getAttribute("href")).toBe("/kelas");
    expect(container.querySelector("#tutorial-stage-11 .tutorial-action-link").getAttribute("href")).toBe("/siswa/dashboard");
    expect(container.querySelector("#tutorial-stage-12 .tutorial-action-link").getAttribute("href")).toBe("/siswa/dashboard");
    expect(container.querySelector("#tutorial-stage-13 .tutorial-action-link").getAttribute("href")).toBe("/gamePage");
    expect(container.querySelector("#tutorial-stage-14 .tutorial-action-link").getAttribute("href")).toBe("/inGame");
    expect(container.querySelector("#tutorial-stage-15 .tutorial-action-link").getAttribute("href")).toBe("/result");
    expect(container.querySelector("#tutorial-stage-15").textContent).toContain("10 besar teratas");
    expect(container.querySelector("#tutorial-stage-16 .tutorial-action-link").getAttribute("href")).toBe("/profile");
    expect(container.querySelector("#tutorial-stage-17 .tutorial-action-link").getAttribute("href")).toBe("/membership/plans");
    expect(container.querySelector("#tutorial-stage-18 .tutorial-action-link").getAttribute("href")).toBe("/membership");
    expect(container.querySelector("#tutorial-stage-19 .tutorial-action-link").getAttribute("href")).toBe("/game");
    expect(container.querySelector("#tutorial-stage-19 .tutorial-step-description").textContent).toContain("belum menyediakan sesi bermain");
    expect(container.querySelector("#tutorial-stage-20 .tutorial-action-link").getAttribute("href")).toBe("/about");
    expect(container.querySelectorAll(".tutorial-route-badge")).toHaveLength(0);
    expect(container.querySelectorAll('a[href^="/admin/"]')).toHaveLength(0);
    expect(container.querySelector(".tutorial-screen-preview").getAttribute("aria-label")).toContain("Simulasi layar");
  });

  it("keeps all stages visible and jumps the focus to a selected stage", () => {
    renderTutorial();

    clickButton('[aria-label="Lihat Langkah 6: Proses Permainan"]');
    expect(container.querySelectorAll('[data-testid="tutorial-stage"]')).toHaveLength(20);
    expect(container.querySelector("#tutorial-stage-14").classList.contains("is-current")).toBe(true);
    expect(container.querySelector(".tutorial-progress-label").textContent.replace(/\s/g, "")).toBe("Fokus14/20");
    expect(container.querySelector("#tutorial-stage-14").textContent).toMatch(/WASD|tombol panah/);
    expect(container.querySelector("#tutorial-stage-14").textContent).toMatch(/setiap 5 koin/i);

    clickButton('[aria-label="Langkah berikutnya"]');
    expect(container.querySelector("#tutorial-stage-15").classList.contains("is-current")).toBe(true);
    clickButton('[aria-label="Langkah sebelumnya"]');
    expect(container.querySelector("#tutorial-stage-14").classList.contains("is-current")).toBe(true);
  });

  it("switches login/register methods and shows manual registration stages", () => {
    renderTutorial();

    expect(container.querySelector("#tutorial-stage-4").textContent).toContain("Daftar");
    expect(container.querySelector("#tutorial-stage-4 .tutorial-action-link").getAttribute("href")).toBe("/register");

    clickButton('[aria-label="Lihat Langkah 3.3: Register 03"]');
    const googleMethod = container.querySelectorAll("#tutorial-stage-5 .tutorial-auth-method button")[0];
    act(() => googleMethod.click());
    expect(container.querySelector("#tutorial-stage-5 .tutorial-screen-auth").textContent).toContain("Lanjutkan dengan Google");

    const accountMethod = container.querySelectorAll("#tutorial-stage-5 .tutorial-auth-method button")[1];
    act(() => accountMethod.click());
    expect(container.querySelector("#tutorial-stage-5 .tutorial-screen-auth").textContent).toContain("Konfirmasi Password");

    clickButton('[aria-label="Lihat Langkah 3.4: Register 04"]');
    const profileStage = container.querySelector("#tutorial-stage-6 .tutorial-register-stages button[aria-pressed='true']");
    expect(profileStage.textContent).toContain("Lengkapi profil");
    expect(container.querySelector("#tutorial-stage-6 .tutorial-screen-auth").textContent).toContain("Nama Sekolah");

    const verifyStage = container.querySelectorAll("#tutorial-stage-6 .tutorial-register-stages button")[2];
    act(() => verifyStage.click());
    expect(container.querySelector("#tutorial-stage-6 .tutorial-screen-auth").textContent).toContain("kode OTP");
    expect(container.querySelectorAll("#tutorial-stage-6 .tutorial-otp-boxes i")).toHaveLength(6);
  });

  it("keeps the teacher guide as a complete storyboard with dashboard actions", () => {
    renderTutorial();

    clickButton('[role="tab"][id="tutorial-tab-guru"]');
    expect(container.querySelectorAll('[data-testid="tutorial-stage"]')).toHaveLength(6);
    expect(container.querySelector("#tutorial-stage-1 h3").textContent).toBe("Ajukan peran Guru");
    expect(container.querySelector("#tutorial-stage-1 .tutorial-action-link").getAttribute("href")).toBe("/profile");

    clickButton('[aria-label="Lihat Langkah 2: Buka Dashboard Guru"]');
    expect(container.querySelector("#tutorial-stage-2").classList.contains("is-current")).toBe(true);
    expect(container.querySelector("#tutorial-stage-2 .tutorial-action-link").getAttribute("href")).toBe("/guru/dashboard");
    expect(container.querySelector("#tutorial-stage-2 .tutorial-teacher-frame").getAttribute("src")).toBe("/guru/dashboard");
    expect(container.querySelector("#tutorial-stage-3 .tutorial-teacher-frame").getAttribute("src")).toBe("/guru/classes/new");
    expect(container.querySelector("#tutorial-stage-4 .tutorial-step-description").textContent).toContain("Generator Soal AI");
  });

  it("includes a reduced-motion override", () => {
    const stylesheet = fs.readFileSync(path.resolve(__dirname, "../pages/tutorial.css"), "utf8");
    expect(stylesheet).toMatch(/prefers-reduced-motion:\s*reduce/);
  });

  it("renders the PDF storyboard design with yellow-bordered step badges, red callouts, green flow arrows, 6 gameplay HUD callouts, and no duplicate courses block", () => {
    renderTutorial();

    expect(container.querySelectorAll("#tutorial-stage-1 .tutorial-loading-canvas")).toHaveLength(2);
    expect(container.querySelector("#tutorial-stage-1 .tutorial-green-arrow-horizontal")).not.toBeNull();
    expect(container.querySelector("#tutorial-stage-1 .tutorial-red-callout")).not.toBeNull();

    expect(container.querySelectorAll("#tutorial-stage-3 .tutorial-auth-subcard")).toHaveLength(2);
    expect(container.querySelectorAll("#tutorial-stage-4 .tutorial-auth-subcard")).toHaveLength(2);
    expect(container.querySelectorAll("#tutorial-stage-5 .tutorial-auth-subcard")).toHaveLength(2);
    expect(container.querySelectorAll("#tutorial-stage-6 .tutorial-auth-subcard")).toHaveLength(2);
    expect(container.querySelector("#tutorial-stage-6").textContent).toContain("Langkah 3.5 - Register 05");

    expect(container.querySelectorAll("#tutorial-stage-9 .tutorial-screen-courses")).toHaveLength(1);
    expect(container.querySelector("#tutorial-stage-9 .tutorial-screen-courses .tutorial-screen-courses")).toBeNull();
    expect(container.querySelector("#tutorial-stage-9 .tutorial-authentic-course-card.is-biologi")).not.toBeNull();

    expect(container.querySelectorAll("#tutorial-stage-13 .tutorial-gp-syllabus-item")).toHaveLength(6);
    expect(container.querySelector("#tutorial-stage-13 .flashcards")).not.toBeNull();
    expect(container.querySelector("#tutorial-stage-13 .leaderboard .self-card-wrapper")).not.toBeNull();
    expect(container.querySelector("#tutorial-stage-13 .tutorial-gp-mulai-btn").textContent).toBe("Mulai");

    expect(container.querySelectorAll("#tutorial-stage-14 .tutorial-callout-box")).toHaveLength(6);
    expect(container.querySelectorAll("#tutorial-stage-14 .tutorial-callout-badge")).toHaveLength(6);
    expect(container.querySelectorAll("#tutorial-stage-14 .tutorial-callout-line")).toHaveLength(6);
    expect(container.querySelector("#tutorial-stage-14 .tutorial-ingame-connector-svg")).not.toBeNull();
    expect(container.querySelector("#tutorial-stage-14 #player-color")?.textContent).toMatch(/Change (Color|Character)/);
    expect(container.querySelectorAll("#tutorial-stage-14 .movement-pad button")).toHaveLength(4);
    expect(container.querySelectorAll("#tutorial-stage-14 .mobile-skill-grid .mobile-skill-button")).toHaveLength(6);
    expect(container.querySelector("#tutorial-stage-14 .tutorial-green-arrow-vertical")).not.toBeNull();
    expect(container.querySelector("#tutorial-stage-14 .tutorial-ingame-quiz-modal")).not.toBeNull();

    expect(container.querySelector("#tutorial-stage-15 .tutorial-authentic-result")).not.toBeNull();
    expect(container.querySelector("#tutorial-stage-15 .result-container")).not.toBeNull();
    expect(container.querySelector("#tutorial-stage-15 .tutorial-result-answers-card")).not.toBeNull();
    expect(container.querySelector("#tutorial-stage-15 .tutorial-result-leaderboard-card")).not.toBeNull();
    expect(container.querySelectorAll(".tutorial-scaled-viewport-host").length).toBeGreaterThanOrEqual(20);
  });
});
