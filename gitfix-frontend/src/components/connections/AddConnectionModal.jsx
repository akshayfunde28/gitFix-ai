import React, { useState } from 'react';
import { GitBranch, Key, ShieldCheck, Eye, EyeOff, AlertCircle } from 'lucide-react';
import Modal from '../common/Modal';
import { useApp } from '../../context/AppContext';
import ValidationHelper from '../../utils/ValidationHelper';

export const AddConnectionModal = () => {
  const { isConnectModalOpen, setIsConnectModalOpen, createConnection } = useApp();

  const [repoFullName, setRepoFullName] = useState('');
  const [githubToken, setGithubToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!ValidationHelper.isValidRepoFullName(repoFullName)) {
      setError("Repository must follow the 'owner/repository' format (e.g. akshayfunde28/git_Hub_Actions).");
      return;
    }

    if (!ValidationHelper.isValidGithubToken(githubToken)) {
      setError('Please provide a valid GitHub Personal Access Token (classic or fine-grained).');
      return;
    }

    setIsSubmitting(true);
    try {
      await createConnection({
        repoFullName: repoFullName.trim(),
        githubToken: githubToken.trim(),
      });
      setRepoFullName('');
      setGithubToken('');
    } catch (err) {
      setError(err.message || 'Failed to connect repository.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isConnectModalOpen}
      onClose={() => setIsConnectModalOpen(false)}
      title="Connect GitHub Repository"
      subtitle="Register repository and Personal Access Token for autonomous branch & PR creation."
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

          {/* Repo Full Name */}
          <div className="form-group">
            <label className="form-label">
              <GitBranch size={14} />
              <span>Repository Full Name</span>
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. akshayfunde28/git_Hub_Actions"
              value={repoFullName}
              onChange={(e) => setRepoFullName(e.target.value)}
              required
            />
            <div className="form-help">
              Format: <code>owner/repository-name</code>
            </div>
          </div>

          {/* GitHub Token */}
          <div className="form-group">
            <label className="form-label">
              <Key size={14} />
              <span>GitHub Personal Access Token (PAT)</span>
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showToken ? 'text' : 'password'}
                className="form-input"
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                value={githubToken}
                onChange={(e) => setGithubToken(e.target.value)}
                style={{ width: '100%', paddingRight: '40px' }}
                required
              />
              <button
                type="button"
                onClick={() => setShowToken(!showToken)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  color: 'var(--text-muted)',
                }}
                aria-label="Toggle token visibility"
              >
                {showToken ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <div className="form-help">
              Requires <code>repo</code> and <code>workflow</code> permissions so GitFix can commit code and open Pull Requests.
            </div>
          </div>

          {/* Security Note */}
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              padding: '12px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              fontSize: '0.78rem',
              color: 'var(--emerald-400)',
            }}
          >
            <ShieldCheck size={18} style={{ flexShrink: 0, marginTop: 1 }} />
            <div>
              <strong>Hardware-grade Encryption:</strong> Tokens are encrypted at rest with <strong>AES-256 GCM</strong> before saving into PostgreSQL and are never returned in any API response.
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setIsConnectModalOpen(false)}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Verifying & Saving...' : 'Connect Repository'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default AddConnectionModal;
