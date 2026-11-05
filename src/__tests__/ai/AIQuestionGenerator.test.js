import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { getManualUser } from "../../database/manualAuth";
import * as aiApi from "../../database/aiQuestionGeneratorApi";
import * as adminApi from "../../database/adminApi";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

// Mock dependencies
jest.mock("../../database/manualAuth", () => ({
  getManualUser: jest.fn()
}));

jest.mock("../../database/aiQuestionGeneratorApi");
jest.mock("../../database/adminApi");

// Lazy import after mocks are set up
let AdminAiQuestionGenerator;
beforeAll(async () => {
  AdminAiQuestionGenerator = (await import("../../pages/adminAiQuestionGenerator")).default;
});

describe("AdminAiQuestionGenerator Page", () => {
  let container;
  let root;

  const renderPage = async (element) => {
    await act(async () => root.render(element));
  };

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    jest.clearAllMocks();

    // Default: admin jobs and classes return empty arrays
    aiApi.listAdminAiJobs.mockResolvedValue({ jobs: [] });
    aiApi.getAiServiceStatus.mockResolvedValue({ online: true, status: "ready", message: "Layanan AI aktif dan siap." });
    aiApi.startAiService.mockResolvedValue({ online: true, status: "ready", message: "Layanan AI berhasil dinyalakan." });
    aiApi.stopAiService.mockResolvedValue({ online: false, status: "stopped", message: "Layanan AI dimatikan." });
    aiApi.getJobConstitutionalMetrics.mockResolvedValue({
      totalCandidates: 155,
      overallCompliance: 0.98,
      passedCount: 155,
      ruleCompliance: [
        { ruleId: "CONST-01", name: "Zero Numerical Hallucination", complianceRate: 1.0 },
        { ruleId: "CONST-02", name: "Single Deterministic Key", complianceRate: 1.0 },
        { ruleId: "CONST-03", name: "KaTeX / LaTeX Mathematical Rigor", complianceRate: 0.96 }
      ]
    });
    aiApi.harvestJobToTrainingMemory.mockResolvedValue({
      success: true,
      harvestedCount: 155,
      message: "Berhasil memanen 155 dari 155 soal ke dalam Memory Pelatihan RLAIF!"
    });
    aiApi.triggerSelfPlayGeneration.mockResolvedValue({
      success: true,
      candidate: {
        prompt: "[SOAL GENERATOR MANDIRI - SELF-PLAY]:\nDalam konteks materi Penalaran Matematika, $f(x) = 2x^2 + 4x - 10$.",
        options: ["A. $18$", "B. $20$", "C. $22$"],
        correctOptionIndex: 1
      },
      rlaifMetrics: {
        rewardScore: 0.96,
        passed: true,
        criticFeedback: "Soal mematuhi seluruh 5 aksioma Constitutional AI."
      }
    });
    adminApi.getAdminClasses.mockResolvedValue({ classes: [] });
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it("shows login redirect message when user is not logged in", async () => {
    getManualUser.mockReturnValue(null);

    await renderPage(
      <MemoryRouter>
        <AdminAiQuestionGenerator />
      </MemoryRouter>
    );

    expect(container.textContent).toContain("Silakan masuk");
  });

  it("shows access denied when user is not admin", async () => {
    getManualUser.mockReturnValue({ id: "1", role: "siswa" });

    await renderPage(
      <MemoryRouter>
        <AdminAiQuestionGenerator />
      </MemoryRouter>
    );

    expect(container.textContent).toContain("Akses Ditolak");
    expect(container.textContent).not.toContain("AI Pembuat Soal");
  });

  it("renders upload section for admin user", async () => {
    getManualUser.mockReturnValue({ id: "1", role: "admin" });

    await renderPage(
      <MemoryRouter>
        <AdminAiQuestionGenerator />
      </MemoryRouter>
    );

    expect(container.textContent).toContain("AI Pembuat Soal");
    expect(container.textContent).toContain("Upload PDF");
    // Upload button should be visible
    const uploadBtn = Array.from(container.querySelectorAll("button")).find((b) =>
      b.textContent.includes("Buat Job AI")
    );
    expect(uploadBtn).toBeTruthy();
    // Button should be disabled until file selected
    expect(uploadBtn.disabled).toBe(true);
  });

  it("shows job list after jobs are loaded", async () => {
    getManualUser.mockReturnValue({ id: "1", role: "admin" });
    aiApi.listAdminAiJobs.mockResolvedValue({
      jobs: [{ jobId: "job-abc123", status: "done", candidateCount: 3 }]
    });
    adminApi.getAdminClasses.mockResolvedValue({ classes: [] });

    await renderPage(
      <MemoryRouter>
        <AdminAiQuestionGenerator />
      </MemoryRouter>
    );

    expect(container.textContent).toContain("job-abc123");
    expect(container.textContent).toContain("DONE");
  });

  it("admin page does not enforce membership check", async () => {
    getManualUser.mockReturnValue({ id: "1", role: "administrator" });

    await renderPage(
      <MemoryRouter>
        <AdminAiQuestionGenerator />
      </MemoryRouter>
    );

    // Should show the page content (no membership block)
    expect(container.textContent).toContain("AI Pembuat Soal");
    expect(container.textContent).not.toContain("Membership");
    expect(container.textContent).not.toContain("Paket");
  });

  it("supports drag and drop of a PDF file", async () => {
    getManualUser.mockReturnValue({ id: "1", role: "administrator" });

    await renderPage(
      <MemoryRouter>
        <AdminAiQuestionGenerator />
      </MemoryRouter>
    );

    const uploader = container.querySelector(".pdf-uploader");
    expect(uploader).toBeTruthy();

    // Trigger dragEnter
    act(() => {
      uploader.dispatchEvent(
        new Event("dragenter", { bubbles: true, cancelable: true })
      );
    });

    // Create a mock PDF File
    const mockPdfFile = new File(["dummy pdf content"], "soal_ujian.pdf", {
      type: "application/pdf"
    });

    // Trigger drop
    act(() => {
      const dropEvent = new Event("drop", { bubbles: true, cancelable: true });
      Object.defineProperty(dropEvent, "dataTransfer", {
        value: {
          files: [mockPdfFile]
        }
      });
      uploader.dispatchEvent(dropEvent);
    });

    // Should display selected file in UI
    expect(container.textContent).toContain("soal_ujian.pdf");

    // Upload button should now be enabled
    const uploadBtn = Array.from(container.querySelectorAll("button")).find((b) =>
      b.textContent.includes("Buat Job AI")
    );
    expect(uploadBtn).toBeTruthy();
    expect(uploadBtn.disabled).toBe(false);
  });

  it("renders candidates with auto-detected category badges and category filter pills", async () => {
    getManualUser.mockReturnValue({ id: "1", role: "administrator" });
    const mockCandidates = [
      {
        id: "cand-1",
        candidateId: "cand-1",
        prompt: "Berdasarkan materi wacana, apakah simpulan logis teks?",
        options: ["Opsi A", "Opsi B"],
        correctOptionIndex: 0,
        explanation: "Penjelasan soal 1",
        difficulty: "medium",
        category: "Penalaran Umum",
        topic: "Subtes: Penalaran Umum",
        evidence: [{ page: 1, quote: "simpulan logis teks" }]
      },
      {
        id: "cand-2",
        candidateId: "cand-2",
        prompt: "What is the primary topic discussed by the author in the passage?",
        options: ["Topic A", "Topic B"],
        correctOptionIndex: 0,
        explanation: "English explanation",
        difficulty: "easy",
        category: "Literasi Bahasa Inggris",
        topic: "Bahasa Inggris",
        evidence: [{ page: 2, quote: "primary topic discussed" }]
      }
    ];

    aiApi.listAdminAiJobs.mockResolvedValue({
      jobs: [{ jobId: "job-multi-cat", status: "review", candidateCount: 2 }]
    });
    aiApi.getAdminAiJob.mockResolvedValue({
      job: { jobId: "job-multi-cat", status: "review", candidateCount: 2 },
      candidates: mockCandidates
    });
    aiApi.getAdminAiCandidates.mockResolvedValue({
      candidates: mockCandidates
    });

    await renderPage(
      <MemoryRouter>
        <AdminAiQuestionGenerator />
      </MemoryRouter>
    );

    // Find and click the job item
    const jobCode = Array.from(container.querySelectorAll("code, strong, span")).find((el) =>
      el.textContent.includes("job-multi-cat")
    );
    const jobItem = jobCode ? jobCode.closest("div[style*='cursor: pointer']") || jobCode.parentElement : null;
    expect(jobItem).toBeTruthy();

    await act(async () => {
      jobItem.click();
    });

    // Verify category badges and pills are rendered
    expect(container.textContent).toContain("Penalaran Umum");
    expect(container.textContent).toContain("Literasi Bahasa Inggris");
    expect(container.querySelector('[data-testid="candidate-category-pills"]')).toBeTruthy();
  });

  it("renders continuation prompt when job is awaiting_continuation and calls continueAdminAiJob", async () => {
    getManualUser.mockReturnValue({ id: "1", role: "admin" });
    aiApi.continueAdminAiJob = jest.fn().mockResolvedValue({
      job: { jobId: "job-stack", status: "queued", currentStackIndex: 1 }
    });
    const mockStackJob = {
      jobId: "job-stack",
      status: "awaiting_continuation",
      awaitingContinuation: true,
      currentSectionTitle: "Kemampuan Penalaran Umum",
      nextSectionTitle: "Pengetahuan Kuantitatif",
      candidateCount: 15
    };
    aiApi.listAdminAiJobs.mockResolvedValue({
      jobs: [mockStackJob]
    });
    aiApi.getAdminAiJob.mockResolvedValue({
      job: mockStackJob,
      candidates: []
    });

    await renderPage(
      <MemoryRouter>
        <AdminAiQuestionGenerator />
      </MemoryRouter>
    );

    const jobCode = Array.from(container.querySelectorAll("code, strong, span")).find((el) =>
      el.textContent.includes("job-stack")
    );
    const jobItem = jobCode ? jobCode.closest("div[style*='cursor: pointer']") || jobCode.parentElement : null;
    expect(jobItem).toBeTruthy();

    await act(async () => {
      jobItem.click();
    });

    // Check continuation message
    expect(container.textContent).toContain("Kemampuan Penalaran Umum");
    expect(container.textContent).toContain("Pengetahuan Kuantitatif");

    // Find and click the continuation button
    const continueBtn = Array.from(container.querySelectorAll("button")).find((b) =>
      b.textContent.includes("Lanjutkan ke Materi Berikutnya")
    );
    expect(continueBtn).toBeTruthy();

    await act(async () => {
      continueBtn.click();
    });

    expect(aiApi.continueAdminAiJob).toHaveBeenCalledWith("job-stack");
  });

  it("renders subtest navigation tabs and supports batch approval", async () => {
    getManualUser.mockReturnValue({ id: "1", role: "admin" });
    const mockMultiJob = {
      jobId: "job-multi-subtest",
      status: "review",
      candidateCount: 2
    };
    const mockCandidates = [
      {
        candidateId: "cand-1",
        prompt: "Soal Penalaran Umum nomor 1",
        category: "Penalaran Umum",
        options: ["A", "B", "C", "D"],
        reviewStatus: "pending_review",
        validationStatus: "valid"
      },
      {
        candidateId: "cand-2",
        prompt: "Soal Pengetahuan Kuantitatif nomor 2",
        category: "Pengetahuan Kuantitatif",
        options: ["10", "20", "30", "40"],
        reviewStatus: "pending_review",
        validationStatus: "valid",
        teacherVerdict: "corrected",
        isAligned: false
      }
    ];

    aiApi.listAdminAiJobs.mockResolvedValue({ jobs: [mockMultiJob] });
    aiApi.getAdminAiJob.mockResolvedValue({
      job: mockMultiJob,
      candidates: mockCandidates
    });
    aiApi.reviewAllAiCandidates.mockResolvedValue({ modifiedCount: 2 });

    await renderPage(
      <MemoryRouter>
        <AdminAiQuestionGenerator />
      </MemoryRouter>
    );

    // Select the job
    const jobItem = Array.from(container.querySelectorAll("code, strong, span")).find((el) =>
      el.textContent.includes("job-multi-subtest")
    )?.closest("div[style*='cursor: pointer']");

    if (jobItem) {
      await act(async () => {
        jobItem.click();
      });
    }

    // Verify subtest navigation tabs render
    const tabs = container.querySelectorAll("[data-testid='subtest-tab'], [data-testid='subtest-tab-all']");
    expect(tabs.length).toBeGreaterThanOrEqual(2);

    // Verify batch approve button renders and can be clicked
    const batchBtn = container.querySelector("[data-testid='batch-approve-btn']");
    expect(batchBtn).toBeTruthy();

    await act(async () => {
      batchBtn.click();
    });

    expect(aiApi.reviewAllAiCandidates).toHaveBeenCalledWith("job-multi-subtest", { decision: "approved" });
  });

  it("applies the word and noise filter to the selected job", async () => {
    getManualUser.mockReturnValue({ id: "1", role: "admin" });
    const mockJob = { jobId: "job-word-filter", status: "review", candidateCount: 1 };
    const mockCandidates = [
      {
        candidateId: "cand-w1",
        prompt: "Soal PBM Day 1 dengan kata tidak penting",
        category: "PBM",
        options: ["(a)", "(b)", "(c)", "(d)"],
        reviewStatus: "pending_review",
        validationStatus: "valid"
      }
    ];
    aiApi.listAdminAiJobs.mockResolvedValue({ jobs: [mockJob] });
    aiApi.getAdminAiJob.mockResolvedValue({ job: mockJob, candidates: mockCandidates });
    aiApi.filterAdminAiJobWords.mockResolvedValue({ cleanedCount: 1, rejectedCount: 0 });

    await renderPage(
      <MemoryRouter>
        <AdminAiQuestionGenerator />
      </MemoryRouter>
    );

    const jobItem = Array.from(container.querySelectorAll("code, strong, span")).find((el) =>
      el.textContent.includes("job-word-filter")
    )?.closest("div[style*='cursor: pointer']");
    if (jobItem) {
      await act(async () => {
        jobItem.click();
      });
    }

    const panel = container.querySelector("[data-testid='word-filter-panel']");
    expect(panel).toBeTruthy();
    await act(async () => {
      panel.querySelector("button").click();
    });

    const input = container.querySelector("[data-testid='word-filter-input']");
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
    await act(async () => {
      setter.call(input, "tidak penting, kata kotor");
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
    await act(async () => {
      container.querySelector("[data-testid='word-filter-apply']").click();
    });

    expect(aiApi.filterAdminAiJobWords).toHaveBeenCalledWith("job-word-filter", {
      customWords: ["tidak penting", "kata kotor"],
      autoCleanNoise: true,
      rejectInvalidQuestions: false
    });
  });

  it("renders AI service power toggle and allows admin to start AI service on-demand", async () => {
    getManualUser.mockReturnValue({ role: "admin", username: "admin1" });
    aiApi.getAiServiceStatus.mockResolvedValue({
      online: false,
      status: "stopped",
      message: "Layanan AI nonaktif (hemat daya)."
    });

    await renderPage(
      <MemoryRouter>
        <AdminAiQuestionGenerator />
      </MemoryRouter>
    );

    const toggle = container.querySelector("[data-testid='ai-service-toggle']");
    expect(toggle).toBeTruthy();
    expect(container.textContent).toContain("Layanan AI Nonaktif (Hemat Daya)");

    const startBtn = container.querySelector("[data-testid='btn-toggle-ai-start']");
    expect(startBtn).toBeTruthy();

    await act(async () => {
      startBtn.click();
    });

    expect(aiApi.startAiService).toHaveBeenCalled();
  });

  it("renders 155 candidates and displays the RLAIF Training Evolution panel with harvest button", async () => {
    getManualUser.mockReturnValue({ role: "admin", username: "admin1" });
    const mock155Job = {
      jobId: "job-155-test",
      status: "done",
      candidateCount: 155,
      totalEstimated: 155
    };
    const mock155Candidates = Array.from({ length: 155 }, (_, i) => ({
      _id: `cand-${i + 1}`,
      prompt: `Soal UTBK nomor ${i + 1} dengan pembahasan lengkap dan jelas.`,
      options: ["A. Pilihan satu", "B. Pilihan dua", "C. Pilihan tiga"],
      correctOptionIndex: 0,
      explanation: "Penjelasan lengkap dari wacana.",
      difficulty: "medium",
      category: i < 30 ? "Penalaran Umum" : "Pengetahuan Kuantitatif"
    }));

    aiApi.listAdminAiJobs.mockResolvedValue({ jobs: [mock155Job] });
    aiApi.getAdminAiJob.mockResolvedValue({ job: mock155Job, candidates: mock155Candidates });
    aiApi.getAdminAiCandidates.mockResolvedValue({ candidates: mock155Candidates });

    await renderPage(
      <MemoryRouter>
        <AdminAiQuestionGenerator />
      </MemoryRouter>
    );

    // Select the job
    const jobItem = Array.from(container.querySelectorAll("code, strong, span")).find((el) =>
      el.textContent.includes("job-155-test")
    )?.closest("div[style*='cursor: pointer']");

    if (jobItem) {
      await act(async () => {
        jobItem.click();
      });
    }

    // Verify all 155 questions loaded and RLAIF panel renders
    expect(container.textContent).toContain("job-155-test");
    const evolutionPanel = container.querySelector("[data-testid='ai-training-evolution-panel']");
    expect(evolutionPanel).toBeTruthy();
    expect(container.textContent).toContain("AI Training & Evolution Engine");

    // Click harvest button
    const harvestBtn = container.querySelector("[data-testid='btn-harvest-rlaif']");
    expect(harvestBtn).toBeTruthy();
    await act(async () => {
      harvestBtn.click();
    });
    expect(aiApi.harvestJobToTrainingMemory).toHaveBeenCalledWith("job-155-test");
  });

  it("renders PdfStructureDetectorCard dynamically for an arbitrary 43-question exam with A-D options", async () => {
    getManualUser.mockReturnValue({ role: "admin", username: "admin1" });
    const mock43Job = {
      jobId: "job-43-test",
      status: "review",
      candidateCount: 43,
      detectedExamStructure: {
        totalQuestions: 43,
        numberingType: "sequential",
        minQuestionNumber: 1,
        maxQuestionNumber: 43,
        optionScheme: "A_TO_D",
        optionCount: 4,
        confidence: 1.0,
        isSequenceComplete: true,
        hasPassages: true,
        hasMatrixQuestions: false,
        detectedSections: [
          { title: "Bagian I: Pilihan Ganda", startQuestion: 1, endQuestion: 30, count: 30 },
          { title: "Bagian II: Penalaran Kritis", startQuestion: 31, endQuestion: 43, count: 13 }
        ]
      }
    };

    aiApi.listAdminAiJobs.mockResolvedValue({ jobs: [mock43Job] });
    aiApi.getAdminAiJob.mockResolvedValue({ job: mock43Job, candidates: [] });

    await renderPage(
      <MemoryRouter>
        <AdminAiQuestionGenerator />
      </MemoryRouter>
    );

    // Select the 43-question job
    const jobItem = Array.from(container.querySelectorAll("code, strong, span")).find((el) =>
      el.textContent.includes("job-43-test")
    )?.closest("div[style*='cursor: pointer']");

    if (jobItem) {
      await act(async () => {
        jobItem.click();
      });
    }

    // Verify dynamic structure detector card rendered
    expect(container.textContent).toContain("Hasil Pemindaian Struktur Ujian PDF");
    expect(container.textContent).toContain("43");
    expect(container.textContent).toContain("Pilihan A – D");
    expect(container.textContent).toContain("No. 1 s/d 43");
    expect(container.textContent).toContain("Bagian I: Pilihan Ganda");
  });

  it("renders TableStructureBadge with matrix and image badges correctly", async () => {
    const TableStructureBadge = (await import("../../component/component_ai_question_generator/atoms/TableStructureBadge")).default;
    await renderPage(
      <div>
        <TableStructureBadge interactionType="matrix_drag_drop" matrixData={{ rows: ["a", "b"], columns: ["Benar", "Salah"] }} />
        <TableStructureBadge interactionType="single_choice" hasImage={true} />
        <TableStructureBadge interactionType="single_choice" modalityType="text" />
      </div>
    );

    expect(container.textContent).toContain("Matriks 2x2");
    expect(container.textContent).toContain("Soal Bergambar");
    expect(container.textContent).toContain("Pilihan Ganda");
  });

  it("renders TableStructurePreview with rows, columns and interactive callbacks", async () => {
    const TableStructurePreview = (await import("../../component/component_ai_question_generator/molecules/TableStructurePreview")).default;
    const onAddRow = jest.fn();
    const onDeleteRow = jest.fn();
    const onRowChange = jest.fn();

    await renderPage(
      <TableStructurePreview
        columns={["Pernyataan", "Benar", "Salah"]}
        rows={[{ statement: "Matahari terbit dari timur", expectedKey: "Benar" }]}
        readOnly={false}
        onAddRow={onAddRow}
        onDeleteRow={onDeleteRow}
        onRowChange={onRowChange}
      />
    );

    expect(container.textContent).toContain("Pratinjau Model Struktur Tabel");
    expect(container.textContent).toContain("1 Baris × 3 Kolom");
    const input = container.querySelector(".table-statement-input");
    expect(input).toBeTruthy();
    expect(input.value).toBe("Matahari terbit dari timur");

    const addBtn = container.querySelector(".add-row-btn");
    expect(addBtn).toBeTruthy();
    await act(async () => {
      addBtn.click();
    });
    expect(onAddRow).toHaveBeenCalled();
  });

  it("renders DatasetFilterToolbar and triggers onFilterChange with modality filter pills", async () => {
    const DatasetFilterToolbar = (await import("../../component/component_ai_question_generator/molecules/DatasetFilterToolbar")).default;
    const onFilterChange = jest.fn();

    await renderPage(
      <DatasetFilterToolbar
        filters={{ modality: "all", category: "all", qualityTier: "all", search: "" }}
        categories={["Penalaran Umum", "Pengetahuan Kuantitatif"]}
        totalCount={155}
        filteredCount={155}
        onFilterChange={onFilterChange}
      />
    );

    expect(container.textContent).toContain("Semua Modality");
    expect(container.textContent).toContain("Matriks Tabel");
    expect(container.textContent).toContain("Wacana / Cerita");
    expect(container.textContent).toContain("Menampilkan 155 dari 155 soal");

    // Click on Matriks Tabel filter pill
    const matrixPill = Array.from(container.querySelectorAll(".dataset-filter-pill")).find((p) =>
      p.textContent.includes("Matriks Tabel")
    );
    expect(matrixPill).toBeTruthy();
    await act(async () => {
      matrixPill.click();
    });
    expect(onFilterChange).toHaveBeenCalledWith(
      expect.objectContaining({ modality: "matrix_drag_drop" })
    );
  });

  it("supports Drag and Drop of reference photo in MultimodalReferenceUploader", async () => {
    const MultimodalReferenceUploader = (await import("../../component/component_ai_question_generator/molecules/MultimodalReferenceUploader")).default;
    aiApi.fetchGroundTruthSpecs.mockResolvedValue({ specs: [] });

    await renderPage(
      <MultimodalReferenceUploader subjectKey="semua_pelajaran" />
    );

    const dropzone = container.querySelector(".photo-upload-dropzone");
    expect(dropzone).toBeTruthy();
    expect(container.textContent).toContain("Drag & Drop");

    // Simulate drag enter
    await act(async () => {
      dropzone.dispatchEvent(new Event("dragenter", { bubbles: true }));
    });
    expect(dropzone.classList.contains("photo-upload-dropzone--dragging")).toBe(true);

    // Simulate drop
    const mockFile = new File(["dummy content"], "table_screenshot.png", { type: "image/png" });
    await act(async () => {
      const dropEvent = new Event("drop", { bubbles: true });
      Object.defineProperty(dropEvent, "dataTransfer", {
        value: { files: [mockFile] }
      });
      dropzone.dispatchEvent(dropEvent);
    });
    expect(dropzone.classList.contains("photo-upload-dropzone--dragging")).toBe(false);
  });
  it("renders CandidateEditModal and saves updated candidate parameters", async () => {
    const CandidateEditModal = (await import("../../component/component_ai_question_generator/molecules/CandidateEditModal")).default;
    const mockCandidate = {
      id: "cand-1",
      prompt: "Soal asli yang perlu dikoreksi admin",
      options: ["Opsi A", "Opsi B", "Opsi C", "Opsi D"],
      correctOptionIndex: 0,
      explanation: "Penjelasan asli",
      difficulty: "medium",
      category: "Literasi Bahasa Indonesia"
    };

    const onSave = jest.fn().mockResolvedValue({});
    const onClose = jest.fn();

    await renderPage(
      <CandidateEditModal
        isOpen={true}
        candidate={mockCandidate}
        onClose={onClose}
        onSave={onSave}
      />
    );

    expect(container.textContent).toContain("Koreksi Parameter Soal (Human-in-the-Loop)");
    expect(container.textContent).toContain("Soal asli yang perlu dikoreksi admin");

    // Change prompt using native property setter so React onChange fires
    const textarea = container.querySelector(".candidate-edit-textarea");
    const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value").set;
    await act(async () => {
      nativeSetter.call(textarea, "Soal telah dikoreksi oleh admin menjadi valid");
      textarea.dispatchEvent(new Event("change", { bubbles: true }));
    });

    // Submit form
    const form = container.querySelector(".candidate-edit-form");
    await act(async () => {
      form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    });

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        prompt: "Soal telah dikoreksi oleh admin menjadi valid",
        options: ["Opsi A", "Opsi B", "Opsi C", "Opsi D"]
      })
    );
    expect(onClose).toHaveBeenCalled();
  });

  it("renders Edit button on Ground-Truth spec card in MultimodalReferenceUploader", async () => {
    const MultimodalReferenceUploader = (await import("../../component/component_ai_question_generator/molecules/MultimodalReferenceUploader")).default;
    aiApi.fetchGroundTruthSpecs.mockResolvedValue({
      specs: [
        {
          specId: "spec-utbk-1",
          title: "Model Matriks Pernyataan UTBK",
          category: "Penalaran Umum",
          modalityType: "table_matrix",
          tableStructure: {
            columns: ["Pernyataan", "Benar", "Salah"],
            rows: [{ statement: "Ekonomi bertumbuh", expectedKey: "Benar" }]
          },
          createdAt: new Date().toISOString()
        }
      ]
    });

    await renderPage(
      <MultimodalReferenceUploader subjectKey="semua_pelajaran" />
    );

    // Await async state update from loadSpecs
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(container.textContent).toContain("Model Matriks Pernyataan UTBK");
    const editBtn = container.querySelector(".btn-edit-spec");
    expect(editBtn).toBeTruthy();
    expect(editBtn.textContent).toContain("Edit");

    // Click edit button
    await act(async () => {
      editBtn.click();
    });

    // Title input should be populated and submit button changes to "Perbarui Model Latihan"
    const titleInput = container.querySelector(".form-group input[type='text']");
    expect(titleInput.value).toBe("Model Matriks Pernyataan UTBK");
    expect(container.textContent).toContain("Perbarui Model Latihan");
  });
  it("allows admin to click Terima Soal and Tolak to update candidate status", async () => {
    getManualUser.mockReturnValue({ id: "1", role: "admin" });
    const mockJob = {
      jobId: "job-review-test",
      status: "done",
      subjectKey: "matematika"
    };
    const mockCandidate = {
      candidateId: "cand-rev-1",
      prompt: "Berapa nilai dari $x + 2 = 5$?",
      options: ["1", "2", "3", "4"],
      correctOptionIndex: 2,
      reviewStatus: "needs_review",
      status: "pending_review",
      validationStatus: "valid"
    };
    aiApi.listAdminAiJobs.mockResolvedValue({ jobs: [mockJob] });
    aiApi.getAdminAiJob.mockResolvedValue({ job: mockJob, candidates: [mockCandidate] });
    aiApi.reviewAiCandidate = jest.fn().mockResolvedValue({
      candidate: { ...mockCandidate, reviewStatus: "approved" }
    });

    await renderPage(
      <MemoryRouter>
        <AdminAiQuestionGenerator />
      </MemoryRouter>
    );

    const jobItem = Array.from(container.querySelectorAll("code, strong, span"))
      .find((el) => el.textContent.includes("job-review-test"))
      ?.closest("div[style*='cursor: pointer']");
    expect(jobItem).toBeTruthy();

    await act(async () => {
      jobItem.click();
    });

    // Verify candidate card is rendered
    expect(container.textContent).toContain("Berapa nilai dari");
    const acceptBtn = container.querySelector('[data-testid="accept-candidate-btn"]');
    expect(acceptBtn).toBeTruthy();
    expect(acceptBtn.textContent).toContain("Terima Soal");

    // Click Terima Soal
    await act(async () => {
      acceptBtn.click();
    });

    expect(aiApi.reviewAiCandidate).toHaveBeenCalledWith(
      "job-review-test",
      "cand-rev-1",
      expect.objectContaining({ decision: "approved" })
    );
  });
});
