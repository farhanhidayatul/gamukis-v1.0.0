import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import AdminDashboard from "../../pages/adminDashboard";
import * as adminApi from "../../database/adminApi";
import { getManualUser } from "../../database/manualAuth";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

jest.mock("../../database/adminApi");
jest.mock("../../database/manualAuth", () => ({
  getManualUser: jest.fn()
}));

describe("AdminClasses and AdminDashboard Kelas Guru section", () => {
  let container;
  let root;

  const sampleClasses = [
    {
      id: 12,
      teacherUserId: "guru-99",
      title: "Biologi Sel",
      subject: "Biologi",
      status: "published",
      joinCode: "GMK-BIO123",
      enrollmentCount: 15,
      attemptCount: 12
    }
  ];

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    jest.clearAllMocks();

    getManualUser.mockReturnValue({ id: "admin-1", role: "administrator" });
    adminApi.getPendingTeachers.mockResolvedValue([]);
    adminApi.getRooms.mockResolvedValue([]);
    adminApi.getHistory.mockResolvedValue([]);
    adminApi.getAdminClasses.mockResolvedValue({
      classes: sampleClasses,
      total: 1,
      page: 1,
      pageSize: 20
    });
    adminApi.getAdminClassHistory.mockResolvedValue({
      class: sampleClasses[0],
      auditEvents: [
        {
          id: 1,
          eventType: "CLASS_CREATED",
          actorAuthType: "manual",
          actorUserId: "guru-99",
          createdAt: "2026-10-21T08:00:00Z"
        },
        {
          id: 2,
          eventType: "CLASS_PUBLISHED",
          actorAuthType: "manual",
          actorUserId: "guru-99",
          createdAt: "2026-10-21T09:00:00Z"
        }
      ],
      attemptSummary: {
        totalAttempts: 12,
        submittedCount: 10,
        inProgressCount: 2,
        averageScore: 85.5
      }
    });
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  const render = (element) => act(async () => root.render(element));

  it("renders Kelas Guru section separately from Game History and loads class lifecycle history", async () => {
    await render(
      <MemoryRouter initialEntries={["/admin/classes"]}>
        <AdminDashboard section="classes" />
      </MemoryRouter>
    );

    expect(container.textContent).toContain("Kelas Guru");
    expect(container.textContent).toContain("Biologi Sel");
    expect(container.textContent).toContain("GMK-BIO123");

    // Game history button still exists separately
    const navButtons = Array.from(container.querySelectorAll(".admin-nav")).map((b) => b.textContent.trim());
    expect(navButtons).toContain("Kelas Guru");
    expect(navButtons).toContain("History");

    // Inspect read-only class history
    const historyBtn = Array.from(container.querySelectorAll("button")).find((btn) =>
      btn.textContent.includes("Riwayat Kelas")
    );
    await act(async () => {
      historyBtn.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(adminApi.getAdminClassHistory).toHaveBeenCalledWith(12);
    expect(container.querySelector('[data-testid="admin-class-history-panel"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="admin-history-avg-score"]').textContent).toBe("85.5");
    expect(container.querySelector('[data-testid="audit-event-CLASS_PUBLISHED"]')).not.toBeNull();
  });

  it("filters admin classes by status", async () => {
    await render(
      <MemoryRouter initialEntries={["/admin/classes"]}>
        <AdminDashboard section="classes" />
      </MemoryRouter>
    );

    const statusSelect = container.querySelector('select[aria-label="Filter status kelas"]');
    await act(async () => {
      statusSelect.value = "published";
      statusSelect.dispatchEvent(new Event("change", { bubbles: true }));
    });

    expect(adminApi.getAdminClasses).toHaveBeenCalledWith(
      expect.objectContaining({ status: "published" })
    );
  });

  it("toggles admin sidebar between compact (min) and expanded (is-open) for multi-device responsive navigation", async () => {
    await render(
      <MemoryRouter initialEntries={["/admin/classes"]}>
        <AdminDashboard section="classes" />
      </MemoryRouter>
    );

    const aside = container.querySelector("#sb");
    const toggleBtn = container.querySelector("#tg");
    expect(aside.classList.contains("min")).toBe(true);
    expect(container.querySelector(".admin-nav-list")).not.toBeNull();

    await act(async () => {
      toggleBtn.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(aside.classList.contains("is-open")).toBe(true);
  });
});
