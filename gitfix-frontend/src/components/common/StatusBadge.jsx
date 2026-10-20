import React from 'react';
import {
  Clock,
  GitBranch,
  Database,
  Search,
  Sparkles,
  FlaskConical,
  RefreshCw,
  GitPullRequest,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Loader2,
} from 'lucide-react';
import { getStatusMeta, isJobRunning, JOB_STATUS } from '../../constants/jobStatus';

const ICONS = {
  Clock,
  GitBranch,
  Database,
  Search,
  Sparkles,
  FlaskConical,
  RefreshCw,
  GitPullRequest,
  CheckCircle2,
  XCircle,
  HelpCircle,
};

export const StatusBadge = ({ status, showIcon = true, size = 'md' }) => {
  const meta = getStatusMeta(status);
  const running = isJobRunning(status);
  const IconComponent = running && status !== JOB_STATUS.QUEUED ? Loader2 : (ICONS[meta.icon] || HelpCircle);

  const style = {
    color: meta.color,
    backgroundColor: meta.bg,
    borderColor: meta.border,
    boxShadow: running ? `0 0 10px ${meta.glow}` : 'none',
  };

  const iconSize = size === 'sm' ? 12 : 14;

  return (
    <span
      className={`status-badge ${running ? 'running' : ''}`}
      style={style}
      title={meta.label}
    >
      {showIcon && (
        <IconComponent
          size={iconSize}
          className={running && status !== JOB_STATUS.QUEUED ? 'spin-icon' : ''}
        />
      )}
      <span>{meta.label}</span>
    </span>
  );
};

export default StatusBadge;
