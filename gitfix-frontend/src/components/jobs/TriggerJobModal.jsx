import React, { useState, useEffect } from 'react';
import { Zap, AlertCircle, GitBranch, Hash, Sparkles } from 'lucide-react';
import Modal from '../common/Modal';
import { useApp } from '../../context/AppContext';
import ValidationHelper from '../../utils/ValidationHelper';

export const TriggerJobModal = () => {
  const {
    isTriggerModalOpen,
    setIsTriggerModalOpen,
    connections,
    selectedConnectionId,
    triggerManualJob,
    setIsConnectModalOpen,
  } = useApp();

  const [connectionId, setConnectionId] = useState('');
  const [issueNumber, setIssueNumber] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Set default connection when modal opens
  useEffect(() => {
    if (isTriggerModalOpen) {
      setError('');
      if (selectedConnectionId && selectedConnectionId !== 'all') {
        setConnectionId(selectedConnectionId);
      } else if (connections.length > 0) {
        setConnectionId(connections[0].id);
      }
    }
  }, [isTriggerModalOpen, selectedConnectionId, connections]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!connectionId) {
      setError('Please select a connected GitHub repository.');
      return;
    }

    if (!ValidationHelper.isValidIssueNumber(issueNumber)) {
      setError('Please enter a valid positive GitHub issue number (e.g. 1, 3, 42).');
      return;
    }

    setIsSubmitting(true);
    try {
      await triggerManualJob({
        connectionId,
        issueNumber: parseInt(issueNumber, 10),
      });
      setIssueNumber('');
    } catch (err) {
      setError(err.message || 'Failed to trigger job');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectQuickIssue = (num) => {
    setIssueNumber(String(num));
    setError('');
  };

  return (
    <Modal
      isOpen={isTriggerModalOpen}
      onClose={() => setIsTriggerModalOpen(false)}
      title="Trigger Autonomous Fix"
      subtitle="GitFix AI will clone the repo, retrieve code context, generate a patch, test in Docker, and open a PR."
    >
      <form onSubmit={handleSubmit}>
        <div className="modal-body">
          {error && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(244, 63, 94, 0.1)',
                border: '1px solid rgba(244, 63, 94, 0.3)',
                color: 'var(--rose-400)',
                fontSize: '0.85rem',
              }}
            >
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Repository Selector */}
          <div className="form-group">
            <label className="form-label">
              <GitBranch size={14} />
              <span>Target Repository</span>
            </label>
            {connections.length === 0 ? (
              <div style={{ fontSize: '0.85rem', color: 'var(--amber-400)' }}>
                No repositories connected yet.{' '}
                <button
                  type="button"
                  style={{
                    background: 'transparent',
                    color: 'var(--sky-400)',
                    textDecoration: 'underline',
                  }}
                  onClick={() => {
                    setIsTriggerModalOpen(false);
                    setIsConnectModalOpen(true);
                  }}
                >
                  Connect a repository first
                </button>
              </div>
            ) : (
              <select
                className="form-input"
                value={connectionId}
                onChange={(e) => setConnectionId(e.target.value)}
                required
              >
                {connections.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.repoFullName}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Issue Number Input */}
          <div className="form-group">
            <label className="form-label">
              <Hash size={14} />
              <span>GitHub Issue Number</span>
            </label>
            <input
              type="number"
              min="1"
              className="form-input"
              placeholder="e.g. 1 or 3"
              value={issueNumber}
              onChange={(e) => setIssueNumber(e.target.value)}
              required
            />
            <div className="form-help">
              Enter the GitHub issue ID that contains the bug description or stacktrace.
            </div>
          </div>

          {/* Quick preset chips */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Quick Presets:</span>
            {[1, 2, 3, 42].map((num) => (
              <button
                key={num}
                type="button"
                className="btn btn-secondary"
                style={{ padding: '2px 8px', fontSize: '0.72rem' }}
                onClick={() => handleSelectQuickIssue(num)}
              >
                #{num}
              </button>
            ))}
          </div>
        </div>

        <div className="modal-footer">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setIsTriggerModalOpen(false)}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-glow-cyan"
            disabled={isSubmitting || connections.length === 0}
          >
            <Zap size={16} />
            <span>{isSubmitting ? 'Queueing Pipeline...' : 'Run Pipeline'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default TriggerJobModal;
