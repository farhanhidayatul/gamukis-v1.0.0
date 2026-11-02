import React, { act } from "react";
import { createRoot } from "react-dom/client";
import AdminTeachers from "../../component/component_admin_teachers/AdminTeachers";
import * as adminApi from "../../database/adminApi";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

jest.mock("../../database/adminApi");

describe("AdminTeachers component", () => {
  let container;
  let root;

  const mockTeachers = [
    {
      id: 1,
      authType: "manual",
      fullName: "Budi Santoso",
      email: "budi@example.com",
      subject: "Matematika",
      status: "pending",
      createdAt: "2026-10-15T10:00:00Z"
    },
    {
      id: 2,
      authType: "google",
      fullName: "Siti Rahma",
      email: "siti@gmail.com",
      subject: "Bahasa Inggris",
      status: "approved",
      createdAt: "2026-10-14T08:30:00Z"
    }
  ];

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);

    jest.clearAllMocks();
    adminApi.listTeachers.mockResolvedValue(mockTeachers);
    adminApi.updateTeacherApproval.mockResolvedValue({ success: true, status: "approved" });
    adminApi.deleteTeacher.mockResolvedValue({ success: true });
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  const render = (element) => act(() => root.render(element));

  it("renders teacher list with columns and status badges", async () => {
    await render(<AdminTeachers teachers={mockTeachers} setTeachers={jest.fn()} />);

    expect(container.textContent).toContain("Persetujuan & Manajemen Guru");
    expect(container.textContent).toContain("Budi Santoso");
    expect(container.textContent).toContain("budi@example.com");
    expect(container.textContent).toContain("Matematika");
    expect(container.textContent).toContain("Menunggu");
    expect(container.querySelector(".admin-shared-status-badge").className).toContain("is-warning");
  });

  it("filters teachers by status", async () => {
    await render(<AdminTeachers teachers={mockTeachers} setTeachers={jest.fn()} />);

    const select = container.querySelector("select");
    expect(select).not.toBeNull();

    await act(async () => {
      select.value = "approved";
      select.dispatchEvent(new Event("change", { bubbles: true }));
    });

    expect(adminApi.listTeachers).toHaveBeenCalledWith(
      expect.objectContaining({ status: "approved" })
    );
  });

  it("opens detail modal when clicking Detail button", async () => {
    await render(<AdminTeachers teachers={mockTeachers} setTeachers={jest.fn()} />);

    const detailButtons = Array.from(container.querySelectorAll("button")).filter(
      (btn) => btn.textContent.trim() === "Detail"
    );
    expect(detailButtons.length).toBeGreaterThan(0);

    await act(async () => {
      detailButtons[0].dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(container.textContent).toContain("Detail Pengajuan: Budi Santoso");
    expect(container.textContent).toContain("ID Pengajuan");
    expect(container.textContent).toContain("Tipe Autentikasi");
  });

  it("approves pending teacher application", async () => {
    await render(<AdminTeachers teachers={mockTeachers} setTeachers={jest.fn()} />);

    const approveButton = Array.from(container.querySelectorAll("button")).find(
      (btn) => btn.textContent.trim() === "Setujui"
    );
    expect(approveButton).not.toBeUndefined();

    await act(async () => {
      approveButton.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(adminApi.updateTeacherApproval).toHaveBeenCalledWith(1, "approved");
  });

  it("opens confirm dialog when rejecting an application", async () => {
    await render(<AdminTeachers teachers={mockTeachers} setTeachers={jest.fn()} />);

    const rejectButton = Array.from(container.querySelectorAll("button")).find(
      (btn) => btn.textContent.trim() === "Tolak"
    );
    expect(rejectButton).not.toBeUndefined();

    await act(async () => {
      rejectButton.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(container.textContent).toContain("Tolak Pengajuan Guru");
    const confirmButton = Array.from(container.querySelectorAll("button")).find(
      (btn) => btn.textContent.trim() === "Tolak Pengajuan"
    );
    expect(confirmButton).not.toBeUndefined();

    await act(async () => {
      confirmButton.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(adminApi.updateTeacherApproval).toHaveBeenCalledWith(1, "rejected");
  });

  it("revokes access for approved teacher with confirmation", async () => {
    await render(<AdminTeachers teachers={mockTeachers} setTeachers={jest.fn()} />);

    const revokeButton = Array.from(container.querySelectorAll("button")).find(
      (btn) => btn.textContent.trim() === "Cabut Akses"
    );
    expect(revokeButton).not.toBeUndefined();

    await act(async () => {
      revokeButton.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(container.textContent).toContain("Cabut Hak Akses Guru");
    const confirmButton = Array.from(container.querySelectorAll("button")).find(
      (btn) => btn.textContent.trim() === "Cabut Akses" && btn.className.includes("is-danger")
    );
    expect(confirmButton).not.toBeUndefined();

    await act(async () => {
      confirmButton.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(adminApi.deleteTeacher).toHaveBeenCalledWith(2, { revoke: true });
  });
});

