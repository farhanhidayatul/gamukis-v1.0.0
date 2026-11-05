import React, { act } from "react";
import { createRoot } from "react-dom/client";
import AdminCurriculumPanel from "../../component/component_admin_curriculum/AdminCurriculumPanel";
import CurriculumClassEditorModal from "../../component/component_admin_curriculum/molecules/CurriculumClassEditorModal";
import * as adminCurriculumApi from "../../database/adminCurriculumApi";
import * as aiQuestionGeneratorApi from "../../database/aiQuestionGeneratorApi";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

jest.mock("../../database/adminCurriculumApi");
jest.mock("../../database/aiQuestionGeneratorApi");

describe("AdminCurriculumPanel Integration Tests", () => {
  let container;
  let root;

  const sampleClasses = [
    {
      id: "cls-bahasa-indo",
      slug: "bahasa-indonesia",
      title: "Bahasa Indonesia",
      category: "BAHASA",
      categoryLabel: "Bahasa & Literasi",
      level: "Dasar - Mahir",
      totalDuration: "12 Jam",
      totalModules: 4,
      rating: 4.92,
      enrolledCount: 350,
      description: "Penguasaan tata bahasa, literasi, dan pemahaman teks.",
      instructor: { name: "Dr. Siti Rahma", title: "Pakar Bahasa" },
      learningObjectives: ["Paham ejaan baku", "Mampu menganalisis teks"],
      skills: ["Literasi", "Menulis"],
      syllabus: [
        {
          chapterNumber: 1,
          title: "Struktur Paragraf",
          duration: "3 Jam",
          difficulty: "Mudah",
          summary: "Mempelajari kalimat utama dan penjelas.",
          subMateri: [
            { lessonId: "sub-1-1", title: "Ide Pokok", duration: "45 Menit", type: "interactive" }
          ]
        }
      ],
      miniQuiz: [
        {
          id: "q-1",
          question: "Apa itu ide pokok?",
          options: ["Gagasan utama", "Pemanis kalimat", "Judul buku", "Penutup"],
          correctAnswer: 0,
          explanation: "Ide pokok adalah gagasan inti suatu paragraf.",
          difficulty: "Mudah"
        }
      ],
      offerings: [
        { id: "cls-bahasa-indo-SMA-10", educationStage: "SMA", schoolGrade: "10", questionCount: 25, syllabusCount: 1, lessonCount: 4, contentStatus: "draft", isTemplate: true },
        { id: "cls-bahasa-indo-SD-1", educationStage: "SD", schoolGrade: "1", questionCount: 0, syllabusCount: 1, contentStatus: "draft", isTemplate: true }
      ]
    },
    {
      id: "cls-fisika-dasar",
      slug: "fisika-dasar",
      title: "Fisika Dasar",
      category: "SAINTEK",
      categoryLabel: "Sains & Teknologi",
      level: "Menengah",
      totalDuration: "15 Jam",
      totalModules: 5,
      rating: 4.88,
      enrolledCount: 280,
      description: "Konsep mekanika dan hukum newton.",
      instructor: { name: "Prof. Handoko", title: "Dosen Fisika" },
      syllabus: [],
      miniQuiz: []
    }
  ];

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    jest.clearAllMocks();

    adminCurriculumApi.fetchAdminCurriculumClasses.mockResolvedValue(sampleClasses);
    adminCurriculumApi.createAdminCurriculumClass.mockResolvedValue({ id: "cls-new", success: true });
    adminCurriculumApi.updateAdminCurriculumClass.mockResolvedValue({ success: true });
    adminCurriculumApi.deleteAdminCurriculumClass.mockResolvedValue({ success: true });
    adminCurriculumApi.importAiQuestionsToClass.mockResolvedValue({ importedCount: 1, success: true });
    adminCurriculumApi.addCustomQuestionsToClass.mockResolvedValue({ success: true });
    adminCurriculumApi.updateAdminCurriculumOfferingQuiz.mockResolvedValue({ success: true });
    adminCurriculumApi.updateAdminCurriculumOfferingTemplate.mockResolvedValue({ success: true });
    adminCurriculumApi.fetchAdminCurriculumOfferingDetail.mockResolvedValue({
      ...sampleClasses[0],
      offering: sampleClasses[0].offerings[0]
    });

    aiQuestionGeneratorApi.listAdminAiJobs.mockResolvedValue({
      jobs: [
        {
          jobId: "job-ai-101",
          fileName: "Modul_Bahasa_Indonesia.pdf",
          status: "completed",
          totalQuestionsExtracted: 5
        }
      ]
    });
    aiQuestionGeneratorApi.getAdminAiJob.mockResolvedValue({
      jobId: "job-ai-101",
      candidates: [
        {
          candidateId: "cand-ai-99",
          question: "Berapakah kalimat utama dalam paragraf deduktif?",
          options: ["Di awal", "Di akhir", "Di tengah", "Tidak ada"],
          correctAnswer: 0,
          explanation: "Paragraf deduktif memiliki kalimat utama di awal.",
          difficulty: "Mudah",
          reviewStatus: "approved"
        }
      ]
    });
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
  });

  test("derives chapter duration from editable lesson durations", async () => {
    await act(async () => {
      root.render(
        <CurriculumClassEditorModal
          isOpen
          classData={{
            id: "cls-duration",
            title: "Bahasa Indonesia",
            syllabus: [{
              chapterNumber: 1,
              title: "Teks Laporan Hasil Observasi",
              duration: "5 Jam",
              lessons: [
                { id: "lesson-1", title: "Pengertian", duration: "45 Menit", type: "article" },
                { id: "lesson-2", title: "Struktur", duration: "45 Menit", type: "article" },
                { id: "lesson-3", title: "Kaidah Bahasa", duration: "45 Menit", type: "article" },
                { id: "lesson-4", title: "Penyusunan", duration: "45 Menit", type: "article" }
              ]
            }]
          }}
          onClose={() => {}}
          onSave={jest.fn()}
        />
      );
    });

    const syllabusTab = Array.from(container.querySelectorAll("button")).find((button) => (
      button.textContent.includes("Silabus Materi & Sub-Materi")
    ));
    await act(async () => syllabusTab.click());

    const chapterDuration = container.querySelector('[aria-label="Total durasi Bab 1"]');
    expect(chapterDuration.value).toBe("3 Jam");
    expect(chapterDuration.readOnly).toBe(true);

    const lessonDuration = container.querySelector('[aria-label="Durasi submateri 1 Bab 1"]');
    await act(async () => {
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
      nativeInputValueSetter.call(lessonDuration, "30 Menit");
      lessonDuration.dispatchEvent(new Event("input", { bubbles: true }));
      lessonDuration.dispatchEvent(new Event("change", { bubbles: true }));
    });

    expect(chapterDuration.value).toBe("2 Jam 45 Menit");
  });

  test("renders curriculum header, category filter pills, and sample classes", async () => {
    await act(async () => {
      root.render(<AdminCurriculumPanel />);
    });

    expect(container.textContent).toContain("Bahasa Indonesia");
    expect(container.textContent).toContain("Fisika Dasar");
    expect(container.textContent).toContain("Semua Kategori");
    expect(container.textContent).toContain("Bahasa");
    expect(container.textContent).toContain("Sains & Teknologi");
    expect(container.textContent).toContain("Sosial Humaniora");
  });

  test("filters classes by category pill click", async () => {
    await act(async () => {
      root.render(<AdminCurriculumPanel />);
    });

    const saintekBtn = Array.from(container.querySelectorAll("button")).find(
      (btn) => btn.textContent.includes("Sains & Teknologi")
    );
    expect(saintekBtn).toBeTruthy();

    await act(async () => {
      saintekBtn.click();
    });

    expect(adminCurriculumApi.fetchAdminCurriculumClasses).toHaveBeenCalledWith("SAINTEK");
  });

  test("renders each education offering as its own subject card and filters by stage", async () => {
    await act(async () => {
      root.render(<AdminCurriculumPanel />);
    });

    const cards = container.querySelectorAll(".admin-curriculum-card");
    expect(cards).toHaveLength(3);
    expect(Array.from(cards).filter((card) => card.querySelector(".admin-curriculum-card__title")?.textContent === "Bahasa Indonesia")).toHaveLength(2);
    expect(cards[0].textContent).toContain("4 Sub-Materi");

    const sdFilter = Array.from(container.querySelectorAll("button")).find((button) => button.textContent.trim() === "SD");
    await act(async () => sdFilter.click());

    const filteredCards = container.querySelectorAll(".admin-curriculum-card");
    expect(filteredCards).toHaveLength(1);
    expect(filteredCards[0].querySelector(".admin-curriculum-card__title").textContent).toBe("Bahasa Indonesia");
    expect(filteredCards[0].textContent).toContain("SD · Kelas 1");
    expect(filteredCards[0].textContent).not.toContain("Kelas 10");
  });

  test("edits an offering template without updating the subject record", async () => {
    adminCurriculumApi.fetchAdminCurriculumOfferingDetail.mockResolvedValue({
      ...sampleClasses[0],
      description: "Deskripsi draf untuk kelas sepuluh.",
      learningObjectives: ["Mengenali struktur teks."],
      offering: {
        ...sampleClasses[0].offerings[0],
        title: "Bahasa Indonesia - SMA Kelas 10",
        description: "Deskripsi draf untuk kelas sepuluh.",
        learningObjectives: ["Mengenali struktur teks."],
        contentStatus: "draft",
        isTemplate: true
      }
    });

    await act(async () => {
      root.render(<AdminCurriculumPanel />);
    });

    const editTemplateButton = container.querySelector('button[aria-label="Edit template Bahasa Indonesia SMA Kelas 10"]');
    expect(editTemplateButton).toBeTruthy();
    await act(async () => {
      editTemplateButton.click();
    });

    expect(container.textContent).toContain("Edit Template: Bahasa Indonesia");
    expect(container.textContent).toContain("Draf · perlu ditinjau");
    const titleInput = container.querySelector('input[placeholder="Contoh: Matematika Diskrit"]');
    await act(async () => {
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
      nativeInputValueSetter.call(titleInput, "Bahasa Indonesia Kelas 10 - Revisi");
      titleInput.dispatchEvent(new Event("input", { bubbles: true }));
      titleInput.dispatchEvent(new Event("change", { bubbles: true }));
    });
    const submitButton = Array.from(container.querySelectorAll("button")).find((button) => button.textContent.includes("Simpan Kurikulum"));
    await act(async () => {
      submitButton.click();
    });

    expect(adminCurriculumApi.updateAdminCurriculumOfferingTemplate).toHaveBeenCalledWith(
      "cls-bahasa-indo",
      "cls-bahasa-indo-SMA-10",
      expect.objectContaining({ title: "Bahasa Indonesia Kelas 10 - Revisi", syllabus: expect.any(Array) })
    );
    expect(adminCurriculumApi.updateAdminCurriculumClass).not.toHaveBeenCalled();
  });

  test("opens CurriculumClassEditorModal when clicking 'Tambah Mata Pelajaran'", async () => {
    await act(async () => {
      root.render(<AdminCurriculumPanel />);
    });

    const createBtn = Array.from(container.querySelectorAll("button")).find((b) =>
      b.textContent.includes("Tambah Kelas")
    );
    expect(createBtn).toBeTruthy();

    await act(async () => {
      createBtn.click();
    });

    expect(container.textContent).toContain("Tambah Kelas");
    expect(container.textContent).toContain("Mata Pelajaran");
    expect(container.textContent).toContain("Simpan Kelas");
  });

  test("opens CurriculumQuizEditor and AI question picker modal", async () => {
    await act(async () => {
      root.render(<AdminCurriculumPanel />);
    });

    const manageQuizBtn = Array.from(container.querySelectorAll("button")).find((b) =>
      b.textContent.includes("Soal & AI")
    );
    expect(manageQuizBtn).toBeTruthy();

    await act(async () => {
      manageQuizBtn.click();
    });

    expect(container.textContent).toContain("Kelola Soal Kuis Kelas: Bahasa Indonesia");
    expect(container.textContent).toContain("SMA · Kelas 10");
    expect(adminCurriculumApi.fetchAdminCurriculumOfferingDetail).toHaveBeenCalledWith("cls-bahasa-indo", "cls-bahasa-indo-SMA-10");
    expect(container.textContent).toContain("Impor dari AI Soal");

    const importAiBtn = Array.from(container.querySelectorAll("button")).find((b) =>
      b.textContent.includes("Impor dari AI Soal")
    );
    expect(importAiBtn).toBeTruthy();

    await act(async () => {
      importAiBtn.click();
    });

    expect(container.textContent).toContain("Impor Soal dari Job AI Generator");
  });

  test("deletes class when confirmation is accepted", async () => {
    jest.spyOn(window, "confirm").mockImplementation(() => true);

    await act(async () => {
      root.render(<AdminCurriculumPanel />);
    });

    const deleteBtn = Array.from(container.querySelectorAll("button")).find((button) => button.textContent.includes("Hapus Mapel"));
    expect(deleteBtn).toBeTruthy();

    await act(async () => {
      deleteBtn.click();
    });

    expect(adminCurriculumApi.deleteAdminCurriculumClass).toHaveBeenCalledWith("cls-bahasa-indo");
  });

  test("allows editing an existing quiz question and saving changes", async () => {
    await act(async () => {
      root.render(<AdminCurriculumPanel />);
    });

    const manageQuizBtn = Array.from(container.querySelectorAll("button")).find((b) =>
      b.textContent.includes("Soal & AI")
    );
    await act(async () => {
      manageQuizBtn.click();
    });

    const editBtn = Array.from(container.querySelectorAll(".curriculum-quiz-card button")).find((b) => b.textContent.includes("Edit"));
    expect(editBtn).toBeTruthy();

    await act(async () => {
      editBtn.click();
    });

    expect(container.textContent).toContain("Edit Soal Kuis");
    const textarea = container.querySelector(".curriculum-question-form textarea");
    expect(textarea).toBeTruthy();

    await act(async () => {
      textarea.value = "Prompt yang sudah diedit oleh admin";
      textarea.dispatchEvent(new Event("change", { bubbles: true }));
    });

    const saveBtn = Array.from(container.querySelectorAll("button")).find((b) =>
      b.textContent.includes("Simpan Perubahan")
    );
    expect(saveBtn).toBeTruthy();

    await act(async () => {
      saveBtn.click();
    });

    expect(adminCurriculumApi.updateAdminCurriculumOfferingQuiz).toHaveBeenCalled();
    expect(adminCurriculumApi.fetchAdminCurriculumOfferingDetail).toHaveBeenCalledWith(
      "cls-bahasa-indo",
      "cls-bahasa-indo-SMA-10"
    );
  });

  test("allows deleting an existing quiz question with confirmation", async () => {
    jest.spyOn(window, "confirm").mockImplementation(() => true);

    await act(async () => {
      root.render(<AdminCurriculumPanel />);
    });

    const manageQuizBtn = Array.from(container.querySelectorAll("button")).find((b) =>
      b.textContent.includes("Soal & AI")
    );
    await act(async () => {
      manageQuizBtn.click();
    });

    const deleteQuizBtn = Array.from(container.querySelectorAll(".curriculum-quiz-card button")).find((b) => b.textContent.includes("Hapus"));
    expect(deleteQuizBtn).toBeTruthy();

    await act(async () => {
      deleteQuizBtn.click();
    });

    expect(adminCurriculumApi.updateAdminCurriculumOfferingQuiz).toHaveBeenCalledWith(
      "cls-bahasa-indo",
      "cls-bahasa-indo-SMA-10",
      []
    );
  });
});
