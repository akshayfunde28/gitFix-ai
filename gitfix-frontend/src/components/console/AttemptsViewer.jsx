import React, { useState } from 'react';
import {
  FileCode,
  CheckCircle2,
  XCircle,
  Sparkles,
  FlaskConical,
  Code2,
  Copy,
  Check,
  FileJson,
  Eye,
  Terminal,
} from 'lucide-react';
import DiffHelper from '../../utils/DiffHelper';

export const AttemptsViewer = ({ attempts = [], isLoading = false }) => {
  const [selectedAttemptIndex, setSelectedAttemptIndex] = useState(0);
  const [activeFileIndex, setActiveFileIndex] = useState(0);
  const [activeTab, setActiveTab] = useState('patch'); // 'patch' | 'testLogs'
  const [viewMode, setViewMode] = useState('formatted'); // 'formatted' | 'rawJson'
  const [copiedFile, setCopiedFile] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);

  if (isLoading) {
    return (
      <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
        Loading generated patches and sandbox test results...
      </div>
    );
  }

  if (!attempts || attempts.length === 0) {
    return (
      <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <Sparkles size={32} style={{ opacity: 0.3, marginBottom: '10px' }} />
        <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-main)' }}>
          No Patch Attempts Yet
        </div>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
          Once the pipeline reaches the AI GENERATING and Docker TESTING stages, surgical code patches and build logs will appear here.
        </p>
      </div>
    );
  }

  const currentAttempt = attempts[selectedAttemptIndex] || attempts[0];
  const parsedPatch = DiffHelper.parsePatch(currentAttempt.patch);
  const files = parsedPatch.files || [];
  const currentFile = files[activeFileIndex] || files[0];

  // Helper to split explanation into readable multi-line sentences
  const formatExplanationSentences = (text) => {
    if (!text) return [];
    // Split on period followed by space, or newlines, keeping clean sentences
    return text
      .split(/(?<=[.?!])\s+|\n+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  };

  const sentences = formatExplanationSentences(parsedPatch.explanation);

  // Copy code of current file
  const handleCopyCode = () => {
    if (!currentFile?.content) return;
    navigator.clipboard.writeText(currentFile.content);
    setCopiedFile(true);
    setTimeout(() => setCopiedFile(false), 2000);
  };

  // Copy raw JSON patch
  const handleCopyRawJson = () => {
    const rawJsonStr = typeof currentAttempt.patch === 'object'
      ? JSON.stringify(currentAttempt.patch, null, 2)
      : (() => {
          try {
            return JSON.stringify(JSON.parse(currentAttempt.patch), null, 2);
          } catch {
            return String(currentAttempt.patch);
          }
        })();
    navigator.clipboard.writeText(rawJsonStr);
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  // Raw JSON representation
  const rawJsonFormatted = typeof currentAttempt.patch === 'object'
    ? JSON.stringify(currentAttempt.patch, null, 2)
    : (() => {
        try {
          return JSON.stringify(JSON.parse(currentAttempt.patch), null, 2);
        } catch {
          return String(currentAttempt.patch);
        }
      })();

  return (
    <div className="patch-view-container">
      {/* Attempt Selector Pills */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          borderBottom: '1px solid var(--border-subtle)',
          paddingBottom: '14px',
        }}
      >
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>
            ATTEMPTS:
          </span>
          {attempts.map((attempt, index) => {
            const passed = attempt.testPassed;
            return (
              <button
                key={attempt.id || index}
                onClick={() => {
                  setSelectedAttemptIndex(index);
                  setActiveFileIndex(0);
                }}
                className="btn btn-secondary"
                style={{
                  padding: '6px 12px',
                  fontSize: '0.8rem',
                  borderRadius: 'var(--radius-md)',
                  background:
                    selectedAttemptIndex === index
                      ? 'var(--bg-surface-elevated)'
                      : 'rgba(255, 255, 255, 0.02)',
                  borderColor:
                    selectedAttemptIndex === index
                      ? 'var(--sky-400)'
                      : 'var(--border-subtle)',
                  color:
                    selectedAttemptIndex === index
                      ? 'var(--sky-400)'
                      : 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                {passed ? (
                  <CheckCircle2 size={14} color="var(--emerald-400)" />
                ) : (
                  <XCircle size={14} color="var(--rose-400)" />
                )}
                <span>Attempt #{attempt.attemptNo || index + 1}</span>
              </button>
            );
          })}
        </div>

        {/* View Switcher: Patch vs Docker Sandbox Test Logs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div className="inspector-tabs">
            <button
              className={`inspector-tab-btn ${activeTab === 'patch' ? 'active' : ''}`}
              onClick={() => setActiveTab('patch')}
            >
              <Code2 size={14} />
              <span>Code Patch ({files.length} {files.length === 1 ? 'file' : 'files'})</span>
            </button>
            <button
              className={`inspector-tab-btn ${activeTab === 'testLogs' ? 'active' : ''}`}
              onClick={() => setActiveTab('testLogs')}
            >
              <FlaskConical size={14} />
              <span>Docker Sandbox Logs</span>
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'patch' ? (
        <>
          {/* AI Explanation Box - Multi-line, Readable, Structured (Addresses User Request) */}
          {parsedPatch.explanation && (
            <div className="patch-explanation-box">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                <div className="patch-explanation-title">
                  <Sparkles size={16} />
                  <span>Ollama AI Surgical Reasoning & Diagnosis</span>
                </div>
                {/* Formatted vs Raw JSON toggle */}
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    className="btn btn-secondary"
                    style={{
                      padding: '3px 9px',
                      fontSize: '0.72rem',
                      background: viewMode === 'formatted' ? 'rgba(6, 182, 212, 0.2)' : 'transparent',
                      color: viewMode === 'formatted' ? 'var(--cyan-400)' : 'var(--text-muted)',
                      borderColor: viewMode === 'formatted' ? 'var(--cyan-400)' : 'var(--border-subtle)',
                    }}
                    onClick={() => setViewMode('formatted')}
                  >
                    <Eye size={12} />
                    <span>Readable Breakdown</span>
                  </button>
                  <button
                    className="btn btn-secondary"
                    style={{
                      padding: '3px 9px',
                      fontSize: '0.72rem',
                      background: viewMode === 'rawJson' ? 'rgba(6, 182, 212, 0.2)' : 'transparent',
                      color: viewMode === 'rawJson' ? 'var(--cyan-400)' : 'var(--text-muted)',
                      borderColor: viewMode === 'rawJson' ? 'var(--cyan-400)' : 'var(--border-subtle)',
                    }}
                    onClick={() => setViewMode('rawJson')}
                  >
                    <FileJson size={12} />
                    <span>Raw JSON</span>
                  </button>
                </div>
              </div>

              {viewMode === 'formatted' ? (
                /* Multi-line, bulleted sentence breakdown so there is zero horizontal scroll */
                <div className="patch-explanation-text">
                  {sentences.map((sentence, idx) => (
                    <div key={idx} className="explanation-sentence-item">
                      <span className="explanation-bullet" />
                      <span>{sentence}</span>
                    </div>
                  ))}
                </div>
              ) : (
                /* Multi-line pretty-printed JSON code block with copy button */
                <div style={{ position: 'relative', marginTop: '6px' }}>
                  <button
                    className="btn btn-secondary"
                    style={{ position: 'absolute', top: '8px', right: '8px', padding: '4px 8px', fontSize: '0.7rem', zIndex: 2 }}
                    onClick={handleCopyRawJson}
                  >
                    {copiedJson ? <Check size={12} color="var(--emerald-400)" /> : <Copy size={12} />}
                    <span>{copiedJson ? 'Copied' : 'Copy JSON'}</span>
                  </button>
                  <pre
                    style={{
                      background: 'var(--bg-terminal)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      padding: '12px 16px',
                      fontSize: '0.78rem',
                      fontFamily: 'var(--font-mono)',
                      color: '#38bdf8',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      maxHeight: '260px',
                      overflowY: 'auto',
                    }}
                  >
                    <code>{rawJsonFormatted}</code>
                  </pre>
                </div>
              )}
            </div>
          )}

          {/* Files Selector & Code Diff View */}
          {files.length > 0 ? (
            <div className="patch-diff-grid">
              {/* File list tree */}
              <div
                style={{
                  background: 'var(--bg-terminal)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '8px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  maxHeight: '520px',
                  overflowY: 'auto',
                }}
              >
                <div
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color: 'var(--text-muted)',
                    padding: '6px 8px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  Modified Files ({files.length})
                </div>
                {files.map((file, idx) => {
                  const base = DiffHelper.getBaseName(file.filePath);
                  const dir = DiffHelper.getDirectory(file.filePath);
                  const isSelected = idx === activeFileIndex;

                  return (
                    <button
                      key={idx}
                      onClick={() => setActiveFileIndex(idx)}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-start',
                        padding: '8px 10px',
                        borderRadius: 'var(--radius-sm)',
                        background: isSelected ? 'rgba(56, 189, 248, 0.12)' : 'transparent',
                        border: isSelected ? '1px solid var(--sky-400)' : '1px solid transparent',
                        textAlign: 'left',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', width: '100%' }}>
                        <FileCode size={14} color={isSelected ? 'var(--sky-400)' : 'var(--text-muted)'} />
                        <span
                          style={{
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            color: isSelected ? 'var(--text-main)' : 'var(--text-secondary)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {base}
                        </span>
                      </div>
                      {dir && (
                        <span
                          style={{
                            fontSize: '0.7rem',
                            color: 'var(--text-dim)',
                            marginTop: '2px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            width: '100%',
                          }}
                        >
                          {dir}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* File Content Preview with Line Numbers & Copy Button */}
              {currentFile && (
                <div className="file-diff-card">
                  <div className="file-diff-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                      <span style={{ color: 'var(--sky-400)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {currentFile.filePath}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                      <span
                        style={{
                          padding: '2px 8px',
                          borderRadius: 'var(--radius-full)',
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          background:
                            currentFile.action === 'CREATE'
                              ? 'rgba(16, 185, 129, 0.2)'
                              : 'rgba(56, 189, 248, 0.2)',
                          color:
                            currentFile.action === 'CREATE'
                              ? 'var(--emerald-400)'
                              : 'var(--sky-400)',
                        }}
                      >
                        {currentFile.action || 'MODIFY'}
                      </span>

                      <button
                        className="btn btn-secondary"
                        style={{ padding: '3px 8px', fontSize: '0.72rem' }}
                        onClick={handleCopyCode}
                        title="Copy file code"
                      >
                        {copiedFile ? <Check size={12} color="var(--emerald-400)" /> : <Copy size={12} />}
                        <span>{copiedFile ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Multi-line Code Block with Clean Line Numbers */}
                  <div
                    style={{
                      maxHeight: '480px',
                      overflowY: 'auto',
                      overflowX: 'auto',
                      background: 'var(--bg-terminal)',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.8rem',
                      lineHeight: '1.6',
                      padding: '12px 0',
                    }}
                  >
                    {(currentFile.content || '').split('\n').map((line, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          padding: '0 16px',
                          transition: 'background 0.1s ease',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        <span
                          style={{
                            width: '36px',
                            textAlign: 'right',
                            color: 'var(--text-dim)',
                            marginRight: '16px',
                            userSelect: 'none',
                            fontSize: '0.75rem',
                            flexShrink: 0,
                          }}
                        >
                          {idx + 1}
                        </span>
                        <span
                          style={{
                            color: line.trim().startsWith('@')
                              ? 'var(--amber-400)'
                              : line.trim().startsWith('package') || line.trim().startsWith('import')
                              ? 'var(--text-muted)'
                              : line.trim().startsWith('public') || line.trim().startsWith('private')
                              ? 'var(--sky-400)'
                              : '#cbd5e1',
                            whiteSpace: 'pre',
                            wordBreak: 'normal',
                          }}
                        >
                          {line || ' '}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              No individual file diffs found for this attempt.
            </div>
          )}
        </>
      ) : (
        /* Test Logs Tab */
        <div className="file-diff-card">
          <div className="file-diff-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FlaskConical size={16} />
              <span>Docker Sandbox: `mvn clean test` (eclipse-temurin-21)</span>
            </div>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '2px 8px',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.72rem',
                fontWeight: 700,
                background: currentAttempt.testPassed
                  ? 'rgba(16, 185, 129, 0.2)'
                  : 'rgba(244, 63, 94, 0.2)',
                color: currentAttempt.testPassed
                  ? 'var(--emerald-400)'
                  : 'var(--rose-400)',
              }}
            >
              {currentAttempt.testPassed ? 'BUILD SUCCESS' : 'BUILD FAILED'}
            </span>
          </div>
          <pre
            className="file-code-block"
            style={{ maxHeight: '500px', color: '#e2e8f0', whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflowX: 'auto' }}
          >
            <code>
              {currentAttempt.testLogs || 'No Docker sandbox logs recorded for this attempt.'}
            </code>
          </pre>
        </div>
      )}
    </div>
  );
};

export default AttemptsViewer;
