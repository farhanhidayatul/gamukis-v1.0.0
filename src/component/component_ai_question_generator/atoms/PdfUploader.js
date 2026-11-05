import React, { useRef, useState } from "react";
import "./PdfUploader.css";

/**
 * PdfUploader — atom component for selecting or drag-and-dropping a PDF file.
 * Props:
 *   onFile(file, error) — called when a valid PDF is chosen or dropped (or with error)
 *   isLoading           — disables input while uploading
 *   error               — error string to display
 *   maxMb               — maximum file size in MB (default 25)
 *   maxPages            — page-limit hint shown in UI (default 150)
 */
const PdfUploader = ({
  onFile,
  isLoading = false,
  error = "",
  maxMb = 25,
  maxPages = 150
}) => {
  const inputRef = useRef(null);
  const dragCounterRef = useRef(0);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState("");

  const validateAndPassFile = (file) => {
    if (!file) return;

    const isPdf =
      file.type === "application/pdf" ||
      file.name?.toLowerCase().endsWith(".pdf");

    if (!isPdf) {
      setSelectedFileName("");
      onFile(null, "File harus berformat PDF (.pdf).");
      return;
    }

    const maxBytes = maxMb * 1024 * 1024;
    if (file.size > maxBytes) {
      setSelectedFileName("");
      onFile(null, `Ukuran file melebihi batas ${maxMb} MB.`);
      return;
    }

    setSelectedFileName(file.name);
    onFile(file);
  };

  const handleChange = (e) => {
    const file = e.target.files?.[0];
    validateAndPassFile(file);
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isLoading) return;
    dragCounterRef.current += 1;
    if (e.dataTransfer?.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isLoading) return;
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = "copy";
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isLoading) return;
    dragCounterRef.current -= 1;
    if (dragCounterRef.current <= 0) {
      dragCounterRef.current = 0;
      setIsDragging(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current = 0;
    setIsDragging(false);
    if (isLoading) return;

    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      validateAndPassFile(files[0]);
    }
  };

  return (
    <div
      className={`pdf-uploader${isLoading ? " pdf-uploader--loading" : ""}${error ? " pdf-uploader--error" : ""}${isDragging ? " pdf-uploader--dragging" : ""}`}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <label className="pdf-uploader__label" htmlFor="pdf-uploader-input">
        <div className="pdf-uploader__icon" aria-hidden="true">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: isDragging ? "#1976D2" : selectedFileName ? "#16803C" : "#767676" }}>
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="12" y1="18" x2="12" y2="12"></line>
            <line x1="9" y1="15" x2="15" y2="15"></line>
          </svg>
        </div>
        <span className="pdf-uploader__title">
          {isLoading
            ? "Mengunggah PDF..."
            : isDragging
            ? "Lepaskan File PDF di Sini"
            : selectedFileName
            ? `File Dipilih: ${selectedFileName}`
            : "Tarik & Lepaskan File PDF di Sini"}
        </span>
        <span className="pdf-uploader__sub">
          {isDragging
            ? "Lepaskan kursor untuk meletakkan file"
            : "atau Klik untuk Menelusuri File Komputer"}
        </span>
        <span className="pdf-uploader__hint">
          Maks. {maxMb} MB • Maks. {maxPages} halaman • Format .PDF
        </span>
        <input
          id="pdf-uploader-input"
          ref={inputRef}
          type="file"
          accept=".pdf"
          disabled={isLoading}
          className="pdf-uploader__input"
          onChange={handleChange}
          data-testid="pdf-uploader-input"
        />
      </label>
      {error && (
        <p className="pdf-uploader__error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};

export default PdfUploader;
