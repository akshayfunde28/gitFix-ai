import React, { useState, useRef, useEffect } from 'react';
import {
  Terminal,
  Copy,
  Check,
  Search,
  ArrowDownCircle,
  RefreshCw,
  Clock,
  Download,
} from 'lucide-react';
import DateHelper from '../../utils/DateHelper';
import { getStatusMeta } from '../../constants/jobStatus';
import { useApp } from '../../context/AppContext';

export const LiveLogViewer = ({ logs = [], isLoading = false, onRefresh }) => {
  const { autoScrollLogs, setAutoScrollLogs, addToast } = useApp();
  const [filterText, setFilterText] = useState('');
  const [copied, setCopied] = useState(false);
  const terminalEndRef = useRef(null);

  // Auto-scroll to bottom on new logs
  useEffect(() => {
    if (autoScrollLogs && terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScrollLogs]);

  // Copy full logs to clipboard
  const handleCopyLogs = () => {
    if (!logs || logs.length === 0) return;
    const text = logs
      .map((l) => `[${l.timestamp}] [${l.step}] ${l.message}`)
      .join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    addToast({ type: 'info', title: 'Logs Copied', message: 'Full audit log copied to clipboard' });
    setTimeout(() => setCopied(false), 2000);
  };

  // Download log file
  const handleDownloadLogs = () => {
    if (!logs || logs.length === 0) return;
    const text = logs
      .map((l) => `[${l.timestamp}] [${l.step}] ${l.message}`)
      .join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gitfix-job-audit-${Date.now()}.log`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredLogs = logs.filter((log) => {
    if (!filterText.trim()) return true;
    const query = filterText.toLowerCase();
    return (
      (log.step || '').toLowerCase().includes(query) ||
      (log.message || '').toLowerCase().includes(query)
    );
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Subheader / Toolbar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 18px',
          background: 'rgba(8, 12, 20, 0.7)',
          borderBottom: '1px solid var(--border-subtle)',
          flexWrap: 'wrap',
          gap: '10px',
        }}
      >
        {/* Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '1', maxWidth: '300px' }}>
          <div className="search-filter-bar" style={{ width: '100%', padding: '4px 10px' }}>
            <Search size={14} color="var(--text-muted)" />
            <input
              type="text"
              className="search-input"
              style={{ fontSize: '0.8rem' }}
              placeholder="Search console logs..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
            />
          </div>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Auto scroll toggle */}
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.78rem',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              userSelect: 'none',
            }}
          >
            <input
              type="checkbox"
              checked={autoScrollLogs}
              onChange={(e) => setAutoScrollLogs(e.target.checked)}
              style={{ accentColor: 'var(--sky-400)', cursor: 'pointer' }}
            />
            <span>Auto-Scroll</span>
          </label>

          {/* Copy Logs Button */}
          <button
            className="btn btn-secondary"
            style={{ padding: '5px 10px', fontSize: '0.75rem' }}
            onClick={handleCopyLogs}
            disabled={logs.length === 0}
            title="Copy all logs"
          >
            {copied ? <Check size={14} color="var(--emerald-400)" /> : <Copy size={14} />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>

          {/* Download Logs */}
          <button
            className="btn btn-secondary"
            style={{ padding: '5px 10px', fontSize: '0.75rem' }}
            onClick={handleDownloadLogs}
            disabled={logs.length === 0}
            title="Download audit logs"
          >
            <Download size={14} />
            <span>Download</span>
          </button>

          {/* Manual Refresh */}
          {onRefresh && (
            <button
              className="btn-icon-only"
              onClick={onRefresh}
              disabled={isLoading}
              title="Refresh logs"
            >
              <RefreshCw size={14} className={isLoading ? 'spin-icon' : ''} />
            </button>
          )}
        </div>
      </div>

      {/* Terminal Display */}
      <div className="terminal-box">
        {filteredLogs.length === 0 ? (
          <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px 0' }}>
            <Terminal size={28} style={{ opacity: 0.3, marginBottom: '8px' }} />
            <div>No logs recorded for this stage yet.</div>
          </div>
        ) : (
          filteredLogs.map((log) => {
            const stepMeta = getStatusMeta(log.step);
            return (
              <div key={log.id} className="terminal-line">
                <span className="terminal-timestamp" title={log.timestamp}>
                  {DateHelper.formatLogTime(log.timestamp)}
                </span>
                <span
                  className="terminal-step-badge"
                  style={{
                    color: stepMeta.color,
                    background: stepMeta.bg,
                    border: `1px solid ${stepMeta.border}`,
                  }}
                >
                  {log.step}
                </span>
                <span className="terminal-message">{log.message}</span>
              </div>
            );
          })
        )}
        <div ref={terminalEndRef} />
      </div>
    </div>
  );
};

export default LiveLogViewer;
