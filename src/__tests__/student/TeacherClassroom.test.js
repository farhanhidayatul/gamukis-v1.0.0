import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import TeacherClassroom from "../../pages/teacherClassroom";
import StudentClassList from "../../component/component_student_classes/StudentClassList";
import { getManualUser } from "../../database/manualAuth";
import * as studentClassroomApi from "../../database/studentClassroomApi";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

// Capture navigate calls from TeacherClassroom
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => {
  const actual = jest.requireActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate
  };
});

jest.mock("../../database/manualAuth", () => ({
  getManualUser: jest.fn()
}));

jest.mock("../../database/studentClassroomApi");

describe("Student Classroom and Quiz Attempt", () => {
  let container;
  let root;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    jest.clearAllMocks();
    getManualUser.mockReturnValue({ id: "siswa-1", role: "siswa" });
    mockNavigate.mockReset();
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  const render = (element) => act(async () => root.render(element));

  it("allows joining a class by join code and displays feedback on invalid code", async () => {
    const onJoinMock = jest.fn().mockRejectedValueOnce(new Error("Kode join tidak valid."));

    await render(<StudentClassList classes={[]} onJoinByCode={onJoinMock} />);

    const input = container.querySelector("#student-join-code-input");
    const form = container.querySelector("form.student-join-form");

    await act(async () => {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
      setter.call(input, "gmk-invalid");
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
    });

    await act(async () => {
      form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    });

    expect(onJoinMock).toHaveBeenCalledWith("GMK-INVALID");
    expect(container.querySelector('[role="alert"]').textContent).toContain("Kode join tidak valid.");
  });

  it("renders student-safe quiz questions without answer keys, starts attempt, and submits to display server score", async () => {
    const safeQuestions = [
      {
        id: 501,
        position: 0,
        prompt: "Siapakah penemu hukum gravitasi universal?",
        points: 25,
        options: [
          { id: 9001, position: 0, optionText: "Isaac Newton" },
          { id: 9002, position: 1, optionText: "Nikola Tesla" }
        ]
      }
    ];

    studentClassroomApi.getStudentClassroomDetail.mockResolvedValue({
      class: { id: 77, title: "Fisika Klasik", description: "Bab Gravitasi", subject: "Fisika" },
      questions: safeQuestions,
      attempt: null
    });

    studentClassroomApi.startStudentQuizAttempt.mockResolvedValue({
      attempt: { id: 300, classId: 77, status: "in_progress", contentVersion: 1 },
      questions: safeQuestions
    });

    studentClassroomApi.submitStudentQuizAttempt.mockResolvedValue({
      attempt: {
        id: 300,
        classId: 77,
        status: "submitted",
        score: 25,
        maxScore: 25,
        answers: [{ questionId: 501, selectedOptionId: 9001, isCorrect: true, awardedPoints: 25 }]
      }
    });

    await render(
      <MemoryRouter initialEntries={["/siswa/classes/77"]}>
        <Routes>
          <Route path="/siswa/classes/:classId" element={<TeacherClassroom />} />
        </Routes>
      </MemoryRouter>
    );

    expect(container.textContent).toContain("Fisika Klasik");
    expect(container.textContent).not.toContain("correctOptionId");
    expect(container.textContent).not.toContain("Kunci Jawaban");

    const startBtn = Array.from(container.querySelectorAll("button")).find((btn) =>
      btn.textContent.includes("Mulai Kerjakan Kuis")
    );
    await act(async () => {
      startBtn.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(studentClassroomApi.startStudentQuizAttempt).toHaveBeenCalledWith("77");
    expect(container.querySelector('[data-testid="active-student-question"]')).not.toBeNull();

    const firstOption = container.querySelector('.student-option-target[role="radio"]');
    await act(async () => {
      firstOption.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    const submitBtn = Array.from(container.querySelectorAll("button")).find((btn) =>
      btn.textContent.includes("Kumpulkan Jawaban")
    );
    await act(async () => {
      submitBtn.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(studentClassroomApi.submitStudentQuizAttempt).toHaveBeenCalledWith("77", 300, [
      { questionId: 501, selectedOptionId: 9001 }
    ]);
    expect(container.querySelector('[data-testid="submitted-score-value"]').textContent).toBe("25 / 25");
    expect(container.querySelector('[data-testid="student-classroom-root"]')).not.toBeNull();
    expect(container.querySelector(".teacher-classroom-header")).not.toBeNull();
  });

  it("gameplay launch button navigates to inGame with class session context", async () => {
    const classId = "77";

    studentClassroomApi.getStudentClassroomDetail.mockResolvedValue({
      class: { id: 77, title: "Fisika Klasik", description: "Bab Gravitasi", subject: "Fisika" },
      questions: [],
      attempt: null
    });

    studentClassroomApi.startStudentClassGameSession.mockResolvedValue({
      sessionId: "ses1",
      subjectKey: "matematika"
    });

    await render(
      <MemoryRouter initialEntries={[`/siswa/classes/${classId}`]}>
        <Routes>
          <Route path="/siswa/classes/:classId" element={<TeacherClassroom />} />
        </Routes>
      </MemoryRouter>
    );

    const gameBtn = container.querySelector('[data-testid="start-class-game-btn"]');
    expect(gameBtn).not.toBeNull();

    await act(async () => {
      gameBtn.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(studentClassroomApi.startStudentClassGameSession).toHaveBeenCalledWith(
      classId,
      expect.any(String)
    );
    expect(mockNavigate).toHaveBeenCalledWith(
      "/inGame",
      expect.objectContaining({
        state: expect.objectContaining({
          classGameMode: true,
          classId,
          sessionId: "ses1",
          subjectKey: "matematika"
        })
      })
    );
  });
});
