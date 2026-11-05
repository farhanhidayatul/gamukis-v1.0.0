import React, { act } from "react";
import { createRoot } from "react-dom/client";
import AdminMonitoring from "../../component/component_admin_monitoring/AdminMonitoring";
import * as adminApi from "../../database/adminApi";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

jest.mock("../../database/adminApi");

describe("AdminMonitoring R5 Telemetry & Avatar Radar", () => {
  let container;
  let root;

  const mockRooms = [
    {
      id: "lobby-1",
      name: "Ruang Utama",
      playerCount: 2,
      suspiciousCount: 1,
      players: [
        {
          id: "manual_10",
          name: "Budi Satria",
          x: 25,
          y: 18,
          direction: "right",
          coins: 15,
          health: 3,
          cheatFlags: 0,
          isGuest: false
        },
        {
          id: "guest_9988",
          name: "Guest Speedy",
          x: 50,
          y: 30,
          direction: "up",
          coins: 5,
          health: 2,
          cheatFlags: 2,
          lastCheatAt: Date.now(),
          isGuest: true
        }
      ]
    }
  ];

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    jest.clearAllMocks();
    adminApi.getRooms.mockResolvedValue(mockRooms);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
  });

  it("renders room summary, suspicious cards, and live player inspector", async () => {
    await act(async () => {
      root.render(<AdminMonitoring rooms={mockRooms} isLoading={false} />);
    });

    expect(container.textContent).toContain("Aktivitas mencurigakan");
    expect(container.textContent).toContain("Ruang Utama");
    expect(container.textContent).toContain("Guest Speedy");
    expect(container.textContent).toContain("INSPEKSI LIVE PLAYER");
    expect(container.textContent).toContain("Live Sync: ON");
  });

  it("selects a player and displays their live coordinate radar and directional indicator", async () => {
    await act(async () => {
      root.render(<AdminMonitoring rooms={mockRooms} isLoading={false} />);
    });

    // Find player buttons in the inspector list
    const playerButtons = container.querySelectorAll(".live-player-inspector__item");
    expect(playerButtons.length).toBe(2);

    // Click on the second player (Guest Speedy)
    await act(async () => {
      playerButtons[1].dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(container.textContent).toContain("Guest Speedy");
    expect(container.textContent).toContain("RADAR TILE MAP");
    expect(container.textContent).toContain("X: 50");
    expect(container.textContent).toContain("Y: 30");
    expect(container.textContent).toContain("UTARA"); // "up" direction label

    // Check visual avatar element presence
    const marker = container.querySelector(".player-tracker-radar__marker");
    expect(marker).not.toBeNull();
    expect(marker.getAttribute("data-direction")).toBe("up");
    expect(container.querySelector(".player-tracker-radar__avatar-container")).not.toBeNull();
  });

  it("filters player list by search input", async () => {
    await act(async () => {
      root.render(<AdminMonitoring rooms={mockRooms} isLoading={false} />);
    });

    const searchInput = container.querySelector(".live-player-inspector__input");
    expect(searchInput).not.toBeNull();

    await act(async () => {
      const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
      nativeSetter.call(searchInput, "Budi");
      searchInput.dispatchEvent(new Event("input", { bubbles: true }));
    });

    const scrollList = container.querySelector(".live-player-inspector__players-scroll");
    expect(scrollList.textContent).toContain("Budi Satria");
    expect(scrollList.textContent).not.toContain("Guest Speedy");
  });

  it("allows toggling live stream sync state", async () => {
    await act(async () => {
      root.render(<AdminMonitoring rooms={mockRooms} isLoading={false} />);
    });

    const liveBtn = container.querySelector(".live-player-inspector__live-btn");
    expect(liveBtn.textContent).toContain("Live Sync: ON");

    await act(async () => {
      liveBtn.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(liveBtn.textContent).toContain("Live Sync: OFF");
  });
});
