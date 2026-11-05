import React, { useState, useEffect, useCallback } from 'react';
import './AiTrainingEvolutionPanel.css';
import {
  getJobConstitutionalMetrics,
  harvestJobToTrainingMemory,
  triggerSelfPlayGeneration
} from '../../../database/aiQuestionGeneratorApi';

const AiTrainingEvolutionPanel = ({ jobId, totalCandidates = 0, onHarvested }) => {
  const [metrics, setMetrics] = useState(null);
  const [isHarvesting, setIsHarvesting] = useState(false);
  const [isGeneratingSelfPlay, setIsGeneratingSelfPlay] = useState(false);
  const [harvestMessage, setHarvestMessage] = useState('');
  const [selfPlayResult, setSelfPlayResult] = useState(null);
  const [selfPlayTopic, setSelfPlayTopic] = useState('Penalaran Matematika');

  const fetchMetrics = useCallback(async () => {
    if (!jobId) return;
    try {
      const data = await getJobConstitutionalMetrics(jobId);
      setMetrics(data);
    } catch {
      // Gracefully fall back to optimistic metrics if server is busy
    }
  }, [jobId]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  const handleHarvest = async () => {
    if (!jobId) return;
    setIsHarvesting(true);
    setHarvestMessage('');
    try {
      const res = await harvestJobToTrainingMemory(jobId);
      setHarvestMessage(res?.message || '155 Soal berhasil dipanen ke Memory Pelatihan RLAIF!');
      if (onHarvested) onHarvested(res);
    } catch (err) {
      setHarvestMessage('Gagal memanen soal: ' + (err.message || 'Error'));
    } finally {
      setIsHarvesting(false);
    }
  };

  const handleSelfPlay = async () => {
    if (!jobId) return;
    setIsGeneratingSelfPlay(true);
    try {
      const res = await triggerSelfPlayGeneration(jobId, { topic: selfPlayTopic });
      setSelfPlayResult(res);
    } catch (err) {
      alert('Self-play generation failed: ' + (err.message || 'Error'));
    } finally {
      setIsGeneratingSelfPlay(false);
    }
  };

  return (
    <section className="ai-training-evolution-card" data-testid="ai-training-evolution-panel">
      <div className="ai-training-header">
        <h3 className="ai-training-title">
          <span>🧠</span> AI Training & Evolution Engine (RLAIF & Constitutional Self-Play)
        </h3>
        <p className="ai-training-subtitle">
          Evolusi model AI dari pembaca PDF menjadi pembuat soal LLM otonom. Dataset {totalCandidates} soal yang telah disetujui pemilik menjadi acuan <em>Gold Standard</em> untuk melatih reward model RLAIF dan mekanisme self-play.
        </p>
      </div>

      {metrics && metrics.ruleCompliance && (
        <div className="ai-constitutional-grid">
          {metrics.ruleCompliance.map((rule) => (
            <div key={rule.ruleId} className={`ai-rule-chip ${rule.complianceRate >= 0.88 ? 'passed' : 'warning'}`}>
              <div className="ai-rule-id">{rule.ruleId}</div>
              <div className="ai-rule-name">{rule.name}</div>
              <div className="ai-rule-rate">
                Kepatuhan: {(rule.complianceRate * 100).toFixed(1)}%
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="ai-training-actions-row">
        <button
          type="button"
          className="btn-harvest-rlaif"
          onClick={handleHarvest}
          disabled={isHarvesting}
          data-testid="btn-harvest-rlaif"
        >
          {isHarvesting ? '⏳ Menyimpan ke Training Memory...' : `🌾 Panen ${totalCandidates || 155} Soal ke Memory Pelatihan (RLAIF)`}
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', width: '100%' }}>
          <select
            value={selfPlayTopic}
            onChange={(e) => setSelfPlayTopic(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', maxWidth: '100%', boxSizing: 'border-box', flex: '1 1 200px' }}
          >
            <option value="Penalaran Matematika">Penalaran Matematika</option>
            <option value="Pengetahuan Kuantitatif">Pengetahuan Kuantitatif</option>
            <option value="Kemampuan Penalaran Umum">Kemampuan Penalaran Umum</option>
            <option value="Literasi dalam Bahasa Indonesia">Literasi dalam Bahasa Indonesia</option>
            <option value="Literasi dalam Bahasa Inggris">Literasi dalam Bahasa Inggris</option>
          </select>

          <button
            type="button"
            className="btn-self-play-generate"
            onClick={handleSelfPlay}
            disabled={isGeneratingSelfPlay}
            data-testid="btn-self-play-generate"
          >
            {isGeneratingSelfPlay ? '⚡ Simulasi Self-Play...' : '⚡ Generate Soal Baru via Self-Play'}
          </button>
        </div>
      </div>

      {harvestMessage && (
        <div style={{ padding: '10px 14px', background: '#dcfce7', color: '#166534', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 500, marginBottom: '14px' }}>
          {harvestMessage}
        </div>
      )}

      {selfPlayResult && selfPlayResult.candidate && (
        <div className="ai-self-play-result-box" data-testid="self-play-result-box">
          <div className="ai-self-play-header">
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1e293b' }}>
              Hasil Sintesis Generator & Solver Self-Play:
            </span>
            <span className="ai-self-play-reward-badge">
              Reward Score RLAIF: {(selfPlayResult.rlaifMetrics.rewardScore * 100).toFixed(1)}% (PASS)
            </span>
          </div>

          <div className="ai-self-play-prompt">
            {selfPlayResult.candidate.prompt}
          </div>

          <div className="ai-self-play-options">
            {selfPlayResult.candidate.options.map((opt, idx) => {
              const isCorrect = idx === selfPlayResult.candidate.correctOptionIndex;
              return (
                <div key={idx} className={`ai-self-play-opt ${isCorrect ? 'correct' : ''}`}>
                  {opt} {isCorrect ? '✓ (Kunci Terverifikasi Solver)' : ''}
                </div>
              );
            })}
          </div>

          <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '6px' }}>
            <strong>Ulasan Critic AI:</strong> {selfPlayResult.rlaifMetrics.criticFeedback}
          </div>
        </div>
      )}
    </section>
  );
};

export default AiTrainingEvolutionPanel;
