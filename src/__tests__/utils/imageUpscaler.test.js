import React, { act } from "react";
import { createRoot } from "react-dom/client";
import {
  upscalePngToHighRes,
  enhanceImageElement,
  initGlobalImageUpscaler,
  CrispImage
} from "../../utils/imageUpscaler";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

describe("Image Upscaler Utility", () => {
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

  test("upscalePngToHighRes handles empty src gracefully", async () => {
    const res = await upscalePngToHighRes("");
    expect(res).toBe("");
  });

  test("upscalePngToHighRes bypasses SVG sources", async () => {
    const svgPath = "images/icon.svg";
    const res = await upscalePngToHighRes(svgPath);
    expect(res).toBe(svgPath);
  });

  test("enhanceImageElement marks element as enhanced and sets pixelated rendering for icons", () => {
    const img = document.createElement("img");
    img.src = "test.png";
    img.className = "stats-rank-icon";
    Object.defineProperty(img, "naturalWidth", { value: 20 });
    Object.defineProperty(img, "naturalHeight", { value: 20 });

    enhanceImageElement(img);

    expect(img.dataset.hiresEnhanced).toBe("true");
    expect(img.style.imageRendering).toBe("pixelated");
  });

  test("enhanceImageElement keeps stats-medal smooth (imageRendering: auto) without forced pixelation", () => {
    const medalImg = document.createElement("img");
    medalImg.src = "lencana_newbie.png";
    medalImg.className = "stats-medal";
    Object.defineProperty(medalImg, "naturalWidth", { value: 933 });
    Object.defineProperty(medalImg, "naturalHeight", { value: 1080 });

    enhanceImageElement(medalImg);

    expect(medalImg.dataset.hiresEnhanced).toBe("true");
    expect(medalImg.style.imageRendering).toBe("auto");
  });

  test("initGlobalImageUpscaler initializes without exception", () => {
    expect(() => initGlobalImageUpscaler()).not.toThrow();
  });

  test("CrispImage renders with img-crisp-hires class and pixelated style", () => {
    act(() => {
      root.render(<CrispImage src="test_badge.png" alt="Test Badge" className="custom-badge" />);
    });
    const img = container.querySelector("img");
    expect(img).not.toBeNull();
    expect(img.getAttribute("alt")).toBe("Test Badge");
    expect(img.classList.contains("img-crisp-hires")).toBe(true);
    expect(img.classList.contains("custom-badge")).toBe(true);
    expect(img.style.imageRendering).toBe("pixelated");
  });
});

