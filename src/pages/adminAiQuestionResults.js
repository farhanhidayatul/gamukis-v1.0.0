import React, { useEffect, useState } from "react";
import { getManualUser } from "../database/manualAuth";
import { getAdminAiCandidates, listAdminAiJobs } from "../database/aiQuestionGeneratorApi";
import AiJobResultsTable from "../component/component_ai_question_results/molecules/AiJobResultsTable";
import AiCandidatePreviewList from "../component/component_ai_question_results/molecules/AiCandidatePreviewList";
import "./adminAiQuestionResults.css";

const PAGE_SIZE = 20;
const CANDIDATE_PAGE_SIZE = 20;

const getUserRole = (user) =>
  String(user?.role || user?.userRole || user?.profile?.role || "").toLowerCase();

const AdminAiQuestionResults = () => {
  const [user] = useState(() => getManualUser());
  const [jobs, setJobs] = useState([]);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedJob, setSelectedJob] = useState(null);
  const [candidatePage, setCandidatePage] = useState(1);
  const [candidates, setCandidates] = useState([]);
  const [candidateTotal, setCandidateTotal] = useState(0);
  const [isCandidateLoading, setIsCandidateLoading] = useState(false);
  const [candidateErrorMessage, setCandidateErrorMessage] = useState("");
  const isAdmin = ["admin", "administrator"].includes(getUserRole(user));

  useEffect(() => {
    if (!isAdmin) return undefined;
    let isCurrent = true;
    setIsLoading(true);
    setErrorMessage("");

    listAdminAiJobs({ page, pageSize: PAGE_SIZE, status: status || undefined })
      .then((result) => {
        if (!isCurrent) return;
        setJobs(Array.isArray(result?.jobs) ? result.jobs : []);
        setTotal(Number(result?.total || 0));
      })
      .catch((error) => {
        if (!isCurrent) return;
        setJobs([]);
        setTotal(0);
        setErrorMessage(error?.message || "Hasil AI gagal dimuat.");
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false);
      });

    return () => { isCurrent = false; };
  }, [isAdmin, page, status]);

  useEffect(() => {
    const selectedJobId = selectedJob?.jobId || selectedJob?.id;
    if (!selectedJobId) return undefined;
    let isCurrent = true;
    setIsCandidateLoading(true);
    setCandidateErrorMessage("");

    getAdminAiCandidates(selectedJobId, { page: candidatePage, pageSize: CANDIDATE_PAGE_SIZE })
      .then((result) => {
        if (!isCurrent) return;
        setCandidates(Array.isArray(result?.candidates) ? result.candidates : []);
        setCandidateTotal(Number(result?.total || 0));
      })
      .catch((error) => {
        if (!isCurrent) return;
        setCandidates([]);
        setCandidateTotal(0);
        setCandidateErrorMessage(error?.message || "Pratinjau soal AI gagal dimuat.");
      })
      .finally(() => {
        if (isCurrent) setIsCandidateLoading(false);
      });

    return () => { isCurrent = false; };
  }, [candidatePage, selectedJob]);

  const handlePreviewJob = (job) => {
    setCandidatePage(1);
    setSelectedJob(job);
  };

  if (!isAdmin) return null;

  return (
    <section className="admin-ai-results" aria-label="Hasil AI Pembuat Soal">
      <div className="admin-ai-results__toolbar">
        <div>
          <h2>Hasil pembuatan soal AI</h2>
          <p>Pilih pratinjau soal pada job untuk melihat kandidat yang tersimpan di memory AI.</p>
        </div>
        <label>
          Status
          <select value={status} onChange={(event) => { setPage(1); setSelectedJob(null); setStatus(event.target.value); }}>
            <option value="">Semua status</option>
            <option value="queued">Menunggu</option>
            <option value="processing">Diproses</option>
            <option value="retry_wait">Menunggu ulang</option>
            <option value="candidates_ready">Kandidat siap</option>
            <option value="review">Perlu ditinjau</option>
            <option value="awaiting_continuation">Menunggu lanjutan</option>
            <option value="completed">Selesai</option>
            <option value="failed">Gagal</option>
            <option value="cancelled">Dibatalkan</option>
          </select>
        </label>
      </div>
      <AiJobResultsTable
        jobs={jobs}
        page={page}
        pageSize={PAGE_SIZE}
        total={total}
        isLoading={isLoading}
        errorMessage={errorMessage}
        onPageChange={setPage}
        selectedJobId={selectedJob?.jobId || selectedJob?.id}
        onPreviewJob={handlePreviewJob}
      />
      <AiCandidatePreviewList
        selectedJob={selectedJob}
        candidates={candidates}
        page={candidatePage}
        pageSize={CANDIDATE_PAGE_SIZE}
        total={candidateTotal}
        isLoading={isCandidateLoading}
        errorMessage={candidateErrorMessage}
        onPageChange={setCandidatePage}
      />
    </section>
  );
};

export default AdminAiQuestionResults;
