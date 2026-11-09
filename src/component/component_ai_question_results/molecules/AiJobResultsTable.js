import AiJobStatusBadge from "../atoms/AiJobStatusBadge";
import "./AiJobResultsTable.css";

const formatDateTime = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
};

const shortJobId = (jobId) => {
  const value = String(jobId || "");
  return value.length > 12 ? `${value.slice(0, 12)}…` : value || "—";
};

const getPurposeLabel = (purpose) =>
  purpose === "class_generation" ? "Kelas" : "Tes Admin";

const getModelLabel = (modelConfig) => {
  const parts = [modelConfig?.provider, modelConfig?.model].filter(Boolean);
  return parts.length ? parts.join(" / ") : "—";
};

const AiJobResultsTable = ({
  jobs,
  page,
  pageSize,
  total,
  isLoading,
  errorMessage,
  onPageChange,
  selectedJobId,
  onPreviewJob
}) => {
  if (isLoading) return <p className="ai-results-message">Memuat hasil AI...</p>;
  if (errorMessage) return <p className="ai-results-message ai-results-message--error">{errorMessage}</p>;
  if (!jobs.length) return <p className="ai-results-message">Belum ada hasil pembuatan soal AI untuk kriteria ini.</p>;

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="ai-results-table-card">
      <div className="ai-results-table-scroll">
        <table className="ai-results-table">
          <thead>
            <tr>
              <th scope="col">Dibuat</th>
              <th scope="col">Job</th>
              <th scope="col">Jenis</th>
              <th scope="col">Subjek</th>
              <th scope="col">Kelas</th>
              <th scope="col">Status</th>
              <th scope="col">Kandidat</th>
              <th scope="col">Halaman</th>
              <th scope="col">Model</th>
              <th scope="col">Selesai / kendala</th>
              <th scope="col">Soal</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((job) => (
              <tr key={job.jobId || job.id} className={selectedJobId === (job.jobId || job.id) ? "ai-results-table__row--selected" : ""}>
                <td>{formatDateTime(job.createdAt)}</td>
                <td><code title={job.jobId || job.id}>{shortJobId(job.jobId || job.id)}</code></td>
                <td>{getPurposeLabel(job.purpose)}</td>
                <td>{job.subjectKey || "—"}</td>
                <td>{job.classId || "—"}</td>
                <td><AiJobStatusBadge status={job.status} /></td>
                <td>{Number(job.candidateCount || 0)}</td>
                <td>{job.pageCount || "—"}</td>
                <td>{getModelLabel(job.modelConfig)}</td>
                <td>
                  {job.failureCode || job.failureReason
                    ? `${job.failureCode || "Kendala"}${job.failureReason ? `: ${job.failureReason}` : ""}`
                    : formatDateTime(job.completedAt)}
                </td>
                <td>
                  <button type="button" className="ai-results-table__preview-button" onClick={() => onPreviewJob(job)}>
                    Pratinjau soal
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="ai-results-pagination" aria-label="Pagination hasil AI">
        <span>Halaman {page} dari {totalPages} · {total} job</span>
        <div>
          <button type="button" onClick={() => onPageChange(page - 1)} disabled={page <= 1}>Sebelumnya</button>
          <button type="button" onClick={() => onPageChange(page + 1)} disabled={page >= totalPages}>Berikutnya</button>
        </div>
      </div>
    </div>
  );
};

export default AiJobResultsTable;
