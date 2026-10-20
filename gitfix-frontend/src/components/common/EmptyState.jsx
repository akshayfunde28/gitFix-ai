import React from 'react';
import { Sparkles, Terminal, FolderGit2 } from 'lucide-react';

export const EmptyState = ({
  icon: Icon = Sparkles,
  title = 'No Data Available',
  description = 'Get started by running a pipeline or connecting a repository.',
  actionLabel,
  onAction,
}) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '56px 24px',
        textAlign: 'center',
        background: 'var(--bg-card)',
        borderRadius: 'var(--radius-lg)',
        border: '1px dashed var(--border-medium)',
      }}
    >
      <div
        style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: 'rgba(56, 189, 248, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--sky-400)',
          marginBottom: '16px',
        }}
      >
        <Icon size={28} />
      </div>
      <h3 style={{ fontSize: '1.1rem', marginBottom: '6px' }}>{title}</h3>
      <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', maxWidth: '400px', marginBottom: '20px' }}>
        {description}
      </p>
      {actionLabel && onAction && (
        <button className="btn btn-primary" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
