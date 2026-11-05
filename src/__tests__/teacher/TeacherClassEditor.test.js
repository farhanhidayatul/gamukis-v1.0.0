import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import TeacherClassEditor from "../../pages/teacherClassEditor";
import TeacherDashboard from "../../pages/teacherDashboard";
import ClassPreview from "../../component/component_teacher_classes/molecules/ClassPreview";
import QuestionEditor from "../../component/component_teacher_classes/molecules/QuestionEditor";
import { getManualUser } from "../../database/manualAuth";
import * as teacherClassApi from "../../database/teacherClassApi";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

jest.mock("../../database/manualAuth", () => ({
  getManualUser: jest.fn()
}));

jest.mock("../../database/teacherClassApi");

describe("TeacherClassEditor and ClassPreview", () => {
  let container;
  let root;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    jest.clearAllMocks();
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  const render = (element) => act(async () => root.render(element));

  it("denies access to non-Guru users", async () => {
    getManualUser.mockReturnValue({ id: "s1", role: "siswa" });

    await render(
      <MemoryRouter>
        <TeacherClassEditor />
      </MemoryRouter>
    );

    expect(container.querySelector('[data-testid="teacher-editor-forbidden"]')).not.toBeNull();
    expect(container.textContent).toContain("Akses Editor Kelas Ditolak");
  });

  it("validates empty class title and does not falsely mark draft as saved on API failure", async () => {
    getManualUser.mockReturnValue({ id: "g1", role: "guru" });
    teacherClassApi.createTeacherClass.mockRejectedValue(new Error("Server database gagal menyimpan"));

    await render(
      <MemoryRouter>
        <TeacherClassEditor />
      </MemoryRouter>
    );

    const form = container.querySelector("form.teacher-class-form");
    await act(async () => {
      form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    });

    expect(container.textContent).toContain("Judul kelas wajib diisi.");
    expect(teacherClassApi.createTeacherClass).not.toHaveBeenCalled();

    const titleInput = container.querySelector("#teacher-class-title");
    await act(async () => {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
      setter.call(titleInput, "Kelas Fisika Kuantum");
      titleInput.dispatchEvent(new Event("input", { bubbles: true }));
      titleInput.dispatchEvent(new Event("change", { bubbles: true }));
    });

    await act(async () => {
      form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    });

    expect(teacherClassApi.createTeacherClass).toHaveBeenCalled();
    expect(container.textContent).toContain("Server database gagal menyimpan");
    expect(container.querySelector('[data-testid="editor-class-status"]').textContent).toContain(
      "draft (belum disimpan)"
    );
  });

  it("separates teacher preview (with answer key) from student preview (never showing answer key or explanation)", async () => {
    const sampleClass = { title: "Geometri", subject: "Matematika", description: "Sudut dan bidang" };
    const sampleQuestions = [
      {
        id: 10,
        prompt: "Jumlah sudut segitiga adalah?",
        points: 20,
        correctOptionIndex: 1,
        explanation: "Total sudut dalam segitiga selalu 180 derajat.",
        options: [
          { id: 101, position: 0, optionText: "90 derajat" },
          { id: 102, position: 1, optionText: "180 derajat" }
        ]
      }
    ];

    await render(<ClassPreview classItem={sampleClass} questions={sampleQuestions} />);

    // Teacher preview mode shows answer key & explanation
    expect(container.querySelector('[data-testid="teacher-answer-key-badge"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="teacher-explanation-preview"]')).not.toBeNull();

    // Switch to Student preview mode
    const tabs = Array.from(container.querySelectorAll('[role="tab"]'));
    const studentTab = tabs.find((btn) => btn.textContent.includes("Pratinjau Siswa"));
    await act(async () => {
      studentTab.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(container.querySelector('[data-testid="teacher-answer-key-badge"]')).toBeNull();
    expect(container.querySelector('[data-testid="teacher-explanation-preview"]')).toBeNull();
    expect(container.textContent).not.toContain("Kunci Jawaban Benar");
    expect(container.textContent).not.toContain("Total sudut dalam segitiga selalu 180 derajat.");
  });

  it("applies responsive layout classes on TeacherClassEditor header and step navigation", async () => {
    getManualUser.mockReturnValue({ id: "g1", role: "guru" });

    await render(
      <MemoryRouter>
        <TeacherClassEditor />
      </MemoryRouter>
    );

    expect(container.querySelector('[data-testid="teacher-editor-root"]')).not.toBeNull();
    expect(container.querySelector(".teacher-editor-header")).not.toBeNull();
    expect(container.querySelector(".teacher-editor-steps")).not.toBeNull();
  });

  it("allows selecting multiple_choice, drag_drop, and short_text in QuestionEditor and protects answer keys in ClassPreview", async () => {
    const onAddQuestion = jest.fn().mockResolvedValue({});
    await render(<QuestionEditor questions={[]} onAddQuestion={onAddQuestion} />);

    // Verify all 3 question type options exist
    const mcBtn = container.querySelector('[data-testid="question-type-option-multiple_choice"]');
    const ddBtn = container.querySelector('[data-testid="question-type-option-drag_drop"]');
    const stBtn = container.querySelector('[data-testid="question-type-option-short_text"]');
    expect(mcBtn).not.toBeNull();
    expect(ddBtn).not.toBeNull();
    expect(stBtn).not.toBeNull();

    // Switch to Drag and Drop Jawaban
    await act(async () => {
      ddBtn.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(container.querySelector('[data-testid="drag-drop-editor-group"]')).not.toBeNull();

    // Switch to Mengisi Jawaban dengan Tulisan
    await act(async () => {
      stBtn.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(container.querySelector('[data-testid="short-text-editor-group"]')).not.toBeNull();

    // Submit a short_text question
    const promptInput = container.querySelector("#question-prompt");
    const primaryAnswerInput = container.querySelector("#question-short-text-primary");
    await act(async () => {
      const textareaSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value").set;
      const inputSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
      textareaSetter.call(promptInput, "Apa ibu kota Indonesia?");
      promptInput.dispatchEvent(new Event("change", { bubbles: true }));
      inputSetter.call(primaryAnswerInput, "Jakarta");
      primaryAnswerInput.dispatchEvent(new Event("change", { bubbles: true }));
    });

    const form = container.querySelector("form.question-editor-form");
    await act(async () => {
      form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    });

    expect(onAddQuestion).toHaveBeenCalledWith(
      expect.objectContaining({
        questionType: "short_text",
        prompt: "Apa ibu kota Indonesia?",
        acceptedAnswers: ["Jakarta"]
      })
    );

    // Verify ClassPreview hides drag_drop and short_text keys in student mode
    const mixedQuestions = [
      {
        id: 21,
        questionType: "drag_drop",
        prompt: "Pasangkan lambang unsur berikut",
        points: 15,
        dragDropItems: [
          { id: 1, position: 1, slotLabel: "Hidrogen", answerText: "H" },
          { id: 2, position: 2, slotLabel: "Oksigen", answerText: "O" }
        ]
      },
      {
        id: 22,
        questionType: "short_text",
        prompt: "Sebutkan planet terdekat dari Matahari",
        points: 10,
        acceptedAnswers: ["Merkurius"]
      }
    ];

    await render(<ClassPreview classItem={{ title: "Sains" }} questions={mixedQuestions} />);
    expect(container.textContent).toContain("Merkurius");

    const tabs = Array.from(container.querySelectorAll('[role="tab"]'));
    const studentTab = tabs.find((btn) => btn.textContent.includes("Pratinjau Siswa"));
    await act(async () => {
      studentTab.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(container.textContent).not.toContain("Merkurius");
    expect(container.querySelector('[data-testid="teacher-answer-key-badge"]')).toBeNull();
  });

  it("renders TeacherDashboard with Admin-aligned sidebar, hero banner, stats, and class cards", async () => {
    getManualUser.mockReturnValue({ id: "g1", role: "guru", teacherStatus: "approved" });
    teacherClassApi.isApprovedGuruUser.mockReturnValue(true);
    teacherClassApi.getTeacherClasses.mockResolvedValue({
      classes: [
        {
          id: 101,
          title: "Bahasa Indonesia Yahut",
          description: "Ini soal bahasa Indonesia ygy",
          subject: "Bahasa Indonesia",
          status: "draft",
          joinCode: null,
          enrolledCount: 0,
          attemptCount: 0
        }
      ],
      quota: { activeCount: 1, maxClasses: 3, remaining: 2 }
    });

    await render(
      <MemoryRouter>
        <TeacherDashboard />
      </MemoryRouter>
    );

    expect(container.querySelector('[data-testid="teacher-dashboard-root"]')).not.toBeNull();
    expect(container.querySelector(".teacher-admin-aside")).not.toBeNull();
    expect(container.querySelector(".teacher-admin-hero")).not.toBeNull();
    expect(container.querySelector(".teacher-admin-stats")).not.toBeNull();
    expect(container.textContent).toContain("PANEL GURU");
    expect(container.textContent).toContain("Bahasa Indonesia Yahut");
  });

  it("allows editing an existing question in QuestionEditor and calls onUpdateQuestion", async () => {
    const mockUpdate = jest.fn().mockResolvedValue({});
    const sampleQuestions = [
      {
        id: "q-edit-1",
        questionType: "multiple_choice",
        prompt: "Soal asli yang akan diedit",
        points: 10,
        options: ["Opsi A", "Opsi B", "Opsi C", "Opsi D"],
        correctOptionIndex: 0
      }
    ];

    await render(
      <QuestionEditor
        questions={sampleQuestions}
        onUpdateQuestion={mockUpdate}
        onDeleteQuestion={jest.fn()}
      />
    );

    const editBtn = container.querySelector('[data-testid="edit-teacher-question-0"]');
    expect(editBtn).not.toBeNull();

    await act(async () => {
      editBtn.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(container.textContent).toContain("Edit Soal");
    const promptTextarea = container.querySelector("#question-prompt");
    expect(promptTextarea.value).toBe("Soal asli yang akan diedit");

    await act(async () => {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value").set;
      setter.call(promptTextarea, "Soal yang berhasil diperbarui");
      promptTextarea.dispatchEvent(new Event("input", { bubbles: true }));
      promptTextarea.dispatchEvent(new Event("change", { bubbles: true }));
    });

    const submitBtn = container.querySelector('button[type="submit"]');
    expect(submitBtn.textContent).toContain("Simpan Perubahan Soal");

    await act(async () => {
      submitBtn.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(mockUpdate).toHaveBeenCalledWith(
      "q-edit-1",
      expect.objectContaining({ prompt: "Soal yang berhasil diperbarui" })
    );
  });
});
