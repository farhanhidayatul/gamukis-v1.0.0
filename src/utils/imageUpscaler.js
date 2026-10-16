/**
 * imageUpscaler.js
 * 
 * Fitur konversi dan peningkatan resolusi otomatis untuk gambar PNG beresolusi kecil
 * di seluruh halaman website Gamukis.
 * 
 * Cara kerja:
 * 1. Mendeteksi aset PNG yang memiliki resolusi kecil (intrinsic width/height < 128px)
 *    atau elemen bertanda kelas khusus (.stats-medal, .img-crisp-hires, dll).
 * 2. Mengonversi gambar tersebut secara client-side menggunakan HTML5 Canvas dengan
 *    nearest-neighbor pixel preservation / high-DPI scaling sehingga menjadi tajam dan tidak buram.
 * 3. Mengaktifkan optimasi CSS (image-rendering: pixelated / crisp-edges) agar browser
 *    tidak melakukan bilinear blur.
 * 4. Berjalan otomatis di seluruh halaman melalui initGlobalImageUpscaler().
 */

import React, { useState, useEffect } from "react";

/**
 * Mengonversi gambar PNG beresolusi kecil menjadi data URL beresolusi tinggi (crisp high-res).
 * @param {string} src - URL atau path gambar sumber
 * @param {number} minDimension - Target resolusi minimum dimensi terbesar (default 384px)
 * @returns {Promise<string>} Promise yang menghasilkan dataURL gambar resolusi tinggi
 */
export const upscalePngToHighRes = (src, minDimension = 384) => {
  return new Promise((resolve, reject) => {
    if (!src) {
      return resolve(src);
    }

    // Jika sudah data URL berukuran besar atau SVG, tidak perlu diubah
    if (typeof src === "string" && (src.startsWith("data:image/svg") || src.endsWith(".svg"))) {
      return resolve(src);
    }

    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      const naturalW = img.naturalWidth || img.width;
      const naturalH = img.naturalHeight || img.height;

      // Jika gambar sudah cukup besar (>= minDimension), gunakan aslinya
      if (naturalW >= minDimension && naturalH >= minDimension) {
        return resolve(src);
      }

      // Hitung skala pengali (integer multiple untuk hasil paling tajam)
      const maxDim = Math.max(naturalW, naturalH);
      const scale = Math.max(2, Math.ceil(minDimension / (maxDim || 1)));

      const targetW = naturalW * scale;
      const targetH = naturalH * scale;

      try {
        const canvas = document.createElement("canvas");
        canvas.width = targetW;
        canvas.height = targetH;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          return resolve(src);
        }

        // Matikan smoothing agar piksel tajam & bersih tanpa blur
        ctx.imageSmoothingEnabled = false;
        if (ctx.webkitImageSmoothingEnabled !== undefined) {
          ctx.webkitImageSmoothingEnabled = false;
        }
        if (ctx.mozImageSmoothingEnabled !== undefined) {
          ctx.mozImageSmoothingEnabled = false;
        }
        if (ctx.msImageSmoothingEnabled !== undefined) {
          ctx.msImageSmoothingEnabled = false;
        }

        ctx.clearRect(0, 0, targetW, targetH);
        ctx.drawImage(img, 0, 0, targetW, targetH);

        const highResDataUrl = canvas.toDataURL("image/png");
        resolve(highResDataUrl);
      } catch (err) {
        // Fallback aman jika canvas terblokir security origin
        resolve(src);
      }
    };

    img.onerror = () => {
      // Fallback ke src original jika gagal memuat
      resolve(src);
    };

    img.src = src;
  });
};

/**
 * Meningkatkan kualitas elemen HTMLImageElement jika gambar bertipe PNG dan beresolusi kecil.
 * @param {HTMLImageElement} imgEl 
 */
export const enhanceImageElement = (imgEl) => {
  if (!imgEl || imgEl.dataset.hiresEnhanced === "true") {
    return;
  }

  // Cek apakah src adalah PNG atau memiliki kelas target
  const currentSrc = imgEl.currentSrc || imgEl.src || "";
  const isPng = currentSrc.includes(".png") || currentSrc.startsWith("data:image/png");
  const isMedal = imgEl.classList.contains("stats-medal");
  const isTargetClass = imgEl.classList.contains("stats-rank-icon") ||
                        imgEl.classList.contains("img-crisp-hires");

  if (!isPng && !isTargetClass && !isMedal) {
    return;
  }

  // Terapkan CSS rendering: gunakan pixelated hanya jika bukan stats-medal (lencana)
  if (!isMedal) {
    imgEl.style.imageRendering = "pixelated";
    imgEl.style.webkitOptimizeContrast = "true";
  } else {
    imgEl.style.imageRendering = "auto";
  }

  // Tandai sudah diproses agar tidak re-trigger
  imgEl.dataset.hiresEnhanced = "true";

  const naturalW = imgEl.naturalWidth;
  const naturalH = imgEl.naturalHeight;

  // Jika gambar belum selesai dimuat, tunggu event load
  if (!naturalW || !naturalH) {
    const handleLoad = () => {
      imgEl.removeEventListener("load", handleLoad);
      imgEl.dataset.hiresEnhanced = ""; // reset untuk proses ulang saat loaded
      enhanceImageElement(imgEl);
    };
    imgEl.addEventListener("load", handleLoad, { once: true });
    return;
  }

  // Jika resolusi intrinsic kecil (< 128px) atau tampilannya jauh lebih besar
  const clientW = imgEl.clientWidth || naturalW;
  const clientH = imgEl.clientHeight || naturalH;
  const isSmall = naturalW < 128 || naturalH < 128;
  const isUpscaledInUi = clientW > naturalW * 1.5 || clientH > naturalH * 1.5;

  if (isSmall || isUpscaledInUi || isTargetClass) {
    upscalePngToHighRes(currentSrc, Math.max(384, clientW * 2, clientH * 2))
      .then((highResUrl) => {
        if (highResUrl && highResUrl !== currentSrc) {
          imgEl.src = highResUrl;
          imgEl.dataset.hiresConverted = "true";
        }
      })
      .catch(() => {
        // Abaikan error tanpa mengganggu user
      });
  }
};

/**
 * Menginisialisasi pendeteksi otomatis di seluruh halaman website.
 * Memindai semua <img> di DOM saat ini dan mengamati penambahan elemen gambar baru.
 */
let isUpscalerInitialized = false;

export const initGlobalImageUpscaler = () => {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return;
  }

  if (isUpscalerInitialized) {
    return;
  }
  isUpscalerInitialized = true;

  // Pindai semua gambar yang ada saat ini
  const scanExistingImages = () => {
    const images = document.querySelectorAll("img");
    images.forEach((img) => enhanceImageElement(img));
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", scanExistingImages);
  } else {
    scanExistingImages();
  }

  // Pantau DOM mutation untuk elemen gambar yang baru ditambahkan/dirender React
  if (typeof MutationObserver !== "undefined") {
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === "childList") {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              if (node.tagName === "IMG") {
                enhanceImageElement(node);
              } else if (node.querySelectorAll) {
                const childImages = node.querySelectorAll("img");
                childImages.forEach((img) => enhanceImageElement(img));
              }
            }
          });
        } else if (mutation.type === "attributes" && mutation.target.tagName === "IMG") {
          if (mutation.attributeName === "src") {
            const img = mutation.target;
            if (img.dataset.hiresConverted !== "true") {
              img.dataset.hiresEnhanced = "";
              enhanceImageElement(img);
            }
          }
        }
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["src"]
    });
  }
};

/**
 * Custom React Hook untuk mendapatkan versi resolusi tinggi dari suatu asset gambar PNG.
 * @param {string} src - Sumber gambar
 * @param {number} minDimension - Resolusi target (default 384px)
 * @returns {string} URL atau dataURL resolusi tinggi
 */
export const useCrispImage = (src, minDimension = 384) => {
  const [highResSrc, setHighResSrc] = useState(src);

  useEffect(() => {
    let isMounted = true;
    if (!src) {
      setHighResSrc(src);
      return;
    }

    upscalePngToHighRes(src, minDimension).then((res) => {
      if (isMounted && res) {
        setHighResSrc(res);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [src, minDimension]);

  return highResSrc;
};

/**
 * Komponen React CrispImage untuk merender gambar PNG resolusi tinggi secara otomatis.
 */
export const CrispImage = ({
  src,
  alt = "",
  className = "",
  minDimension = 384,
  style = {},
  ...props
}) => {
  const crispSrc = useCrispImage(src, minDimension);

  return (
    <img
      src={crispSrc}
      alt={alt}
      className={`img-crisp-hires ${className}`.trim()}
      style={{
        imageRendering: "pixelated",
        ...style
      }}
      data-hires-converted={crispSrc !== src ? "true" : "false"}
      {...props}
    />
  );
};

export default {
  upscalePngToHighRes,
  enhanceImageElement,
  initGlobalImageUpscaler,
  useCrispImage,
  CrispImage
};

