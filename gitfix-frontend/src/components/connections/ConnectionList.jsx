import React, { useState } from 'react';
import {
  GitBranch,
  Key,
  Trash2,
  Zap,
  CheckCircle2,
  Copy,
  ExternalLink,
  Plus,
  ShieldCheck,
  Webhook,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import DateHelper from '../../utils/DateHelper';
import EmptyState from '../common/EmptyState';

export const ConnectionList = () => {
  const {
    connections,
    isConnectionsLoading,
    deleteConnection,
    registerWebhook,
    setIsConnectModalOpen,
    setIsTriggerModalOpen,
    setSelectedConnectionId,
    addToast,
  } = useApp();

  const [copiedId, setCopiedId] = useState(null);
  const [busyWebhookId, setBusyWebhookId] = useState(null);

  const handleCopySecret = (secret, id) => {
    navigator.clipboard.writeText(secret);
    setCopiedId(id);
    addToast({ type: 'info', title: 'Secret Copied', message: 'Webhook secret copied to clipboard' });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleRegisterWebhook = async (id, repoName) => {
    setBusyWebhookId(id);
    try {
      await registerWebhook(id, repoName);
    } finally {
      setBusyWebhookId(null);
    }
  };

  const handleDelete = async (id, repoName) => {
    if (window.confirm(`Are you sure you want to disconnect repository ${repoName}?`)) {
      await deleteConnection(id, repoName);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Banner */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div>
          <h2 style={{ fontSize: '1.4rem' }}>Connected GitHub Repositories</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '2px' }}>
            Registered repositories are monitored for GitHub issue webhooks or manual AI fixes.
          </p>
        </div>
        <button
          className="btn btn-glow-cyan"
          onClick={() => setIsConnectModalOpen(true)}
        >
          <Plus size={16} />
          <span>Connect New Repository</span>
        </button>
      </div>

      {connections.length === 0 ? (
        <EmptyState
          icon={GitBranch}
          title="No GitHub Repositories Connected"
          description="Link your GitHub repositories with a Personal Access Token (PAT). Tokens are stored encrypted with AES-256 GCM."
          actionLabel="+ Connect First Repository"
          onAction={() => setIsConnectModalOpen(true)}
        />
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))',
            gap: '18px',
          }}
        >
          {connections.map((conn) => {
            const githubUrl = `https://github.com/${conn.repoFullName}`;
            return (
              <div
                key={conn.id}
                style={{
                  background: 'var(--bg-card)',
                  backdropFilter: 'var(--glass-blur)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <div>
                    <a
                      href={githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '1.05rem',
                        fontWeight: 700,
                        color: 'var(--text-main)',
                      }}
                    >
                      <GitBranch size={18} color="var(--sky-400)" />
                      <span>{conn.repoFullName}</span>
                      <ExternalLink size={13} color="var(--text-muted)" />
                    </a>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      Connected {DateHelper.formatDateTime(conn.createdAt)}
                    </div>
                  </div>

                  <span
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      color: 'var(--emerald-400)',
                      background: 'rgba(16, 185, 129, 0.12)',
                      padding: '3px 8px',
                      borderRadius: 'var(--radius-full)',
                    }}
                  >
                    <ShieldCheck size={12} />
                    <span>AES-256 Secured</span>
                  </span>
                </div>

                {/* Webhook Secret box */}
                <div
                  style={{
                    background: 'rgba(8, 12, 20, 0.6)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '10px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Key size={14} color="var(--amber-400)" />
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                        Webhook Secret (HMAC-SHA256)
                      </span>
                      <span
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.8rem',
                          color: 'var(--text-secondary)',
                        }}
                      >
                        {conn.webhookSecret ? `${conn.webhookSecret.substring(0, 8)}••••••••••••` : 'None'}
                      </span>
                    </div>
                  </div>

                  {conn.webhookSecret && (
                    <button
                      className="btn-icon-only"
                      onClick={() => handleCopySecret(conn.webhookSecret, conn.id)}
                      title="Copy Secret"
                    >
                      {copiedId === conn.id ? <CheckCircle2 size={14} color="var(--emerald-400)" /> : <Copy size={14} />}
                    </button>
                  )}
                </div>

                {/* Card Actions */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderTop: '1px solid var(--border-subtle)',
                    paddingTop: '12px',
                  }}
                >
                  <button
                    className="btn btn-secondary"
                    style={{ fontSize: '0.78rem', padding: '6px 12px' }}
                    onClick={() => handleRegisterWebhook(conn.id, conn.repoFullName)}
                    disabled={busyWebhookId === conn.id}
                    title="Auto-register webhook on GitHub"
                  >
                    <Webhook size={14} color="var(--purple-400)" />
                    <span>{busyWebhookId === conn.id ? 'Registering...' : 'Auto-Register Webhook'}</span>
                  </button>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      className="btn btn-secondary"
                      style={{ fontSize: '0.78rem', padding: '6px 12px', color: 'var(--sky-400)' }}
                      onClick={() => {
                        setSelectedConnectionId(conn.id);
                        setIsTriggerModalOpen(true);
                      }}
                      title="Trigger Fix for this repository"
                    >
                      <Zap size={14} />
                      <span>Trigger Fix</span>
                    </button>

                    <button
                      className="btn-icon-only"
                      style={{ color: 'var(--rose-400)' }}
                      onClick={() => handleDelete(conn.id, conn.repoFullName)}
                      title="Disconnect repository"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ConnectionList;
