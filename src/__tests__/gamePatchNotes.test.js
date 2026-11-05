import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import Game from "../pages/game";

jest.mock("../component/Navbar", () => () => <nav data-testid="main-navbar" />);

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

describe("Game Patch Notes & Changelog Hub (/game)", () => {
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

  const renderGame = () =>
    act(() => {
      root.render(
        <MemoryRouter>
          <Game />
        </MemoryRouter>
      );
    });

  it("renders header, latest patch version v1.4.0, and CTA play button", () => {
    renderGame();

    expect(container.textContent).toContain("Catatan Pembaruan & Patch Game");
    expect(container.textContent).toContain("v1.4.0");
    expect(container.textContent).toContain("TERBARU");

    const playCta = container.querySelector(".game-patch-play-cta");
    expect(playCta).not.toBeNull();
    expect(playCta.getAttribute("href")).toBe("/gamePage");
  });

  it("filters changelog items by category when tag buttons are clicked", () => {
    renderGame();

    const netcodeBtn = Array.from(
      container.querySelectorAll(".game-patch-filter-btn")
    ).find((btn) => btn.textContent.includes("Gameplay & Netcode"));

    expect(netcodeBtn).not.toBeUndefined();

    act(() => {
      netcodeBtn.click();
    });

    expect(netcodeBtn.classList.contains("active")).toBe(true);
    expect(container.textContent).toContain("NETCODE");
  });
});
