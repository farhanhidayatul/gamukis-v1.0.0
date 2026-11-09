import './AiServiceToggle.css';

const AiServiceToggle = ({
  serviceStatus,
  loading,
  onStart,
  onStop,
  onRefresh,
  ollamaStatus
}) => {
  const status = serviceStatus?.status || (serviceStatus?.online ? 'ready' : 'stopped');
  const isReady = status === 'ready';
  const isStarting = status === 'starting' || loading;

  let badgeLabel = 'Layanan AI Nonaktif (Hemat Daya)';
  if (isReady) badgeLabel = 'Layanan AI Aktif & Siap';
  else if (isStarting) badgeLabel = 'Sedang Menyalakan Layanan AI...';

  const subtitle = serviceStatus?.message || (
    isReady
      ? 'Container AI dan database aktif memproses ekstraksi soal.'
      : 'Nyalakan layanan untuk memproses PDF atau generate soal baru.'
  );

  const ollama = ollamaStatus || serviceStatus?.ollama;

  return (
    <div className="ai-service-toggle-card" data-testid="ai-service-toggle">
      <div className="ai-service-status-group">
        <div
          className={`ai-status-indicator ${isStarting ? 'starting' : isReady ? 'ready' : 'stopped'}`}
          data-testid="ai-service-indicator"
        />
        <div>
          <h4 className="ai-service-title-text" data-testid="ai-service-title">
            {badgeLabel}
          </h4>
          <p className="ai-service-subtitle-text">{subtitle}</p>
        </div>
      </div>

      <div className="ai-service-actions">
        <button
          type="button"
          className="ai-btn-refresh-status"
          onClick={onRefresh}
          disabled={loading}
          title="Perbarui status koneksi AI"
        >
          🔄 Cek Status
        </button>

        {isReady ? (
          <button
            type="button"
            className="ai-btn-toggle-power power-off"
            onClick={onStop}
            disabled={loading}
            data-testid="btn-toggle-ai-stop"
          >
            ⏹ Matikan AI (Hemat Daya)
          </button>
        ) : (
          <button
            type="button"
            className="ai-btn-toggle-power power-on"
            onClick={onStart}
            disabled={loading}
            data-testid="btn-toggle-ai-start"
          >
            {isStarting ? '⏳ Menyalakan...' : '▶ Nyalakan Layanan AI'}
          </button>
        )}
      </div>

      {/* Ollama Local AI Worker Live Status Subpanel */}
      {ollama && (
        <div
          className="ai-ollama-live-status-subpanel"
          data-testid="ai-ollama-status"
          style={{
            gridColumn: '1 / -1',
            marginTop: '12px',
            paddingTop: '12px',
            borderTop: '1px solid #e1e5ea',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', minWidth: 0 }}>
            <span
              style={{
                display: 'inline-block',
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: ollama.online ? '#16803c' : '#94a3b8',
                boxShadow: ollama.online ? '0 0 8px rgba(22, 128, 60, 0.6)' : 'none',
                flexShrink: 0
              }}
            />
            <strong style={{ fontSize: '0.86rem', color: '#1e293b', overflowWrap: 'anywhere', wordBreak: 'break-word' }}>
              🤖 Ollama Local AI Worker ({ollama.endpoint || 'http://localhost:11434'}):
            </strong>
            <span
              style={{
                fontSize: '0.74rem',
                padding: '2px 8px',
                borderRadius: '999px',
                background: ollama.online ? (ollama.isBusy ? '#dbeafe' : '#dcfce7') : '#f1f5f9',
                color: ollama.online ? (ollama.isBusy ? '#1e40af' : '#166534') : '#64748b',
                fontWeight: 700,
                border: ollama.online ? (ollama.isBusy ? '1px solid #bfdbfe' : '1px solid #bbf7d0') : '1px solid #e2e8f0'
              }}
            >
              {ollama.online
                ? (ollama.isBusy ? '⚡ Sedang Bekerja (Inferencing)' : '🟢 Aktif & Siap')
                : '⚪ Offline (Port 11434)'}
            </span>
          </div>

          {ollama.online && Array.isArray(ollama.models) && ollama.models.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.76rem', color: '#64748b' }}>Model Lokal:</span>
              {ollama.models.map((m) => {
                const isGamukisR1 = m.name.includes('gamukis-r1');
                const isGamukisQwen = m.name.includes('gamukis-qwen');
                return (
                  <span
                    key={m.name}
                    style={{
                      fontSize: '0.72rem',
                      padding: '2px 8px',
                      borderRadius: '6px',
                      background: isGamukisR1 ? '#fef08a' : isGamukisQwen ? '#e0e7ff' : '#f8fafc',
                      color: isGamukisR1 ? '#854d0e' : isGamukisQwen ? '#3730a3' : '#334155',
                      border: isGamukisR1 ? '1px solid #fde047' : isGamukisQwen ? '1px solid #c7d2fe' : '1px solid #cbd5e1',
                      fontWeight: isGamukisR1 || isGamukisQwen ? 700 : 500
                    }}
                    title={`Model: ${m.name}`}
                  >
                    {isGamukisR1 ? `🌟 ${m.name}` : isGamukisQwen ? `⚡ ${m.name}` : m.name}
                  </span>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AiServiceToggle;
