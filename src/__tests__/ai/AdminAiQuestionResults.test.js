import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { getManualUser } from "../../database/manualAuth";
import * as aiApi from "../../database/aiQuestionGeneratorApi";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

jest.mock("../../database/manualAuth", () => ({ getManualUser: jest.fn() }));
jest.mock("../../database/aiQuestionGeneratorApi");

let AdminAiQuestionResults;
beforeAll(async () => {
  AdminAiQuestionResults = (await import("../../pages/adminAiQuestionResults")).default;
});

describe("AdminAiQuestionResults", () => {
  let container;
  let root;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    jest.clearAllMocks();
    getManualUser.mockReturnValue({ id: "admin-1", role: "admin" });
    aiApi.listAdminAiJobs.mockResolvedValue({ jobs: [], total: 0, page: 1, pageSize: 20 });
    aiApi.getAdminAiCandidates.mockResolvedValue({ candidates: [], total: 0, page: 1, pageSize: 20 });
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it("loads the existing jobs endpoint with pagination", async () => {
    await act(async () => {
      root.render(<AdminAiQuestionResults />);
    });

    expect(aiApi.listAdminAiJobs).toHaveBeenCalledWith({ page: 1, pageSize: 20, status: undefined });
    expect(container.textContent).toContain("Belum ada hasil pembuatan soal AI");
  });

  it("shows safe job metadata without candidate content", async () => {
    aiApi.listAdminAiJobs.mockResolvedValue({
      jobs: [{
        jobId: "0123456789abcdef",
        purpose: "admin_test",
        subjectKey: "matematika",
        status: "completed",
        candidateCount: 6,
        pageCount: 3,
        createdAt: "2026-10-25T08:00:00.000Z",
        completedAt: "2026-10-25T08:01:00.000Z",
        modelConfig: { provider: "openai", model: "gpt-test", apiKey: "must-not-render" },
        prompt: "must-not-render"
      }],
      total: 1,
      page: 1,
      pageSize: 20
    });

    await act(async () => {
      root.render(<AdminAiQuestionResults />);
    });

    expect(container.textContent).toContain("matematika");
    expect(container.textContent).toContain("openai / gpt-test");
    expect(container.textContent).toContain("Selesai");
    expect(container.textContent).not.toContain("must-not-render");
  });

  it("forwards the selected status filter", async () => {
    await act(async () => {
      root.render(<AdminAiQuestionResults />);
    });

    const select = container.querySelector("select");
    await act(async () => {
      select.value = "failed";
      select.dispatchEvent(new Event("change", { bubbles: true }));
    });

    expect(aiApi.listAdminAiJobs).toHaveBeenLastCalledWith({ page: 1, pageSize: 20, status: "failed" });
  });

  it("loads the next page when pagination advances", async () => {
    aiApi.listAdminAiJobs.mockResolvedValue({
      jobs: [{ jobId: "job-1", status: "queued" }],
      total: 21,
      page: 1,
      pageSize: 20
    });

    await act(async () => {
      root.render(<AdminAiQuestionResults />);
    });

    await act(async () => {
      Array.from(container.querySelectorAll("button"))
        .find((button) => button.textContent === "Berikutnya")
        .click();
    });

    expect(aiApi.listAdminAiJobs).toHaveBeenLastCalledWith({ page: 2, pageSize: 20, status: undefined });
  });

  it("previews selected MongoDB candidates with their answer and explanation", async () => {
    aiApi.listAdminAiJobs.mockResolvedValue({
      jobs: [{ jobId: "job-preview", status: "review", candidateCount: 1 }],
      total: 1,
      page: 1,
      pageSize: 20
    });
    aiApi.getAdminAiCandidates.mockResolvedValue({
      candidates: [{
        id: "candidate-1",
        jobId: "job-preview",
        index: 0,
        prompt: "Manakah jawaban yang benar?",
        options: ["Opsi pertama", "Opsi kedua"],
        correctOptionIndex: 1,
        explanation: "Opsi kedua sesuai materi.",
        validationStatus: "valid",
        reviewStatus: "needs_review"
      }],
      total: 1,
      page: 1,
      pageSize: 20
    });

    await act(async () => {
      root.render(<AdminAiQuestionResults />);
    });
    await act(async () => {
      Array.from(container.querySelectorAll("button"))
        .find((button) => button.textContent === "Pratinjau soal")
        .click();
    });

    expect(aiApi.getAdminAiCandidates).toHaveBeenCalledWith("job-preview", { page: 1, pageSize: 20 });
    expect(container.textContent).toContain("Manakah jawaban yang benar?");
    expect(container.textContent).toContain("B. Opsi kedua");
    expect(container.textContent).toContain("Opsi kedua sesuai materi.");
  });

  it("paginates candidates for the selected job", async () => {
    aiApi.listAdminAiJobs.mockResolvedValue({
      jobs: [{ jobId: "job-many-candidates", status: "review", candidateCount: 21 }],
      total: 1,
      page: 1,
      pageSize: 20
    });
    aiApi.getAdminAiCandidates.mockResolvedValue({
      candidates: [{ id: "candidate-1", jobId: "job-many-candidates", prompt: "Soal pertama", options: [] }],
      total: 21,
      page: 1,
      pageSize: 20
    });

    await act(async () => {
      root.render(<AdminAiQuestionResults />);
    });
    await act(async () => {
      Array.from(container.querySelectorAll("button"))
        .find((button) => button.textContent === "Pratinjau soal")
        .click();
    });
    await act(async () => {
      Array.from(container.querySelectorAll("button"))
        .find((button) => button.textContent === "Berikutnya" && !button.disabled)
        .click();
    });

    expect(aiApi.getAdminAiCandidates).toHaveBeenLastCalledWith("job-many-candidates", { page: 2, pageSize: 20 });
  });

  it("shows a candidate preview error without retaining previous questions", async () => {
    aiApi.listAdminAiJobs.mockResolvedValue({
      jobs: [{ jobId: "job-error", status: "failed" }],
      total: 1,
      page: 1,
      pageSize: 20
    });
    aiApi.getAdminAiCandidates.mockRejectedValue(new Error("Memory AI tidak tersedia."));

    await act(async () => {
      root.render(<AdminAiQuestionResults />);
    });
    await act(async () => {
      Array.from(container.querySelectorAll("button"))
        .find((button) => button.textContent === "Pratinjau soal")
        .click();
    });

    expect(container.textContent).toContain("Memory AI tidak tersedia.");
  });

  it("does not render the preview for non-admin users", async () => {
    getManualUser.mockReturnValue({ id: "student-1", role: "siswa" });

    await act(async () => {
      root.render(<AdminAiQuestionResults />);
    });

    expect(container.textContent).toBe("");
    expect(aiApi.getAdminAiCandidates).not.toHaveBeenCalled();
  });
});
