import React from 'react';
import {
  ExternalLink,
  RotateCw,
  GitPullRequest,
  Clock,
  AlertCircle,
  ChevronRight,
  GitBranch,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import StatusBadge from '../common/StatusBadge';
import DateHelper from '../../utils/DateHelper';
import { useApp } from '../../context/AppContext';
import { JOB_STATUS, isJobRunning } from '../../constants/jobStatus';
import { TABS } from '../../constants/appConfig';

export const JobCard = ({ job, isSelected, onSelect }) => {
  const { retryJob, setActiveTab, setSelectedJobId } = useApp();

  const handleCardClick = () => {
    onSelect(job.id);
  };

  const handleInspect = (e) => {
    e.stopPropagation();
    setSelectedJobId(job.id);
    setActiveTab(TABS.INSPECTOR);
  };

  const handleRetry = async (e) => {
    e.stopPropagation();
    await retryJob(job.id);
  };

  const isFailed = job.status === JOB_STATUS.FAILED;
  const isPrCreated = job.status === JOB_STATUS.PR_CREATED && job.prUrl;
  const isRunning = isJobRunning(job.status);

  return (
    <div
      className={`job-card ${isSelected ? 'selected' : ''} ${isRunning ? 'active-running' : ''}`}
      onClick={handleCardClick}
    >
      {/* 1. Card Top: Repo & Badges */}
      <div className="job-card-top">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
          <span className="job-repo-name" title={job.repoFullName}>
            <GitBranch size={13} style={{ flexShrink: 0 }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {job.repoFullName}
            </span>
          </span>
          {isRunning && (
            <span
              style={{
                fontSize: '0.65rem',
                fontWeight: 700,
                color: 'var(--cyan-400)',
                background: 'rgba(6, 182, 212, 0.15)',
                border: '1px solid rgba(6, 182, 212, 0.35)',
                padding: '1px 6px',
                borderRadius: 'var(--radius-full)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
                letterSpacing: '0.04em',
                flexShrink: 0,
              }}
            >
              <span
                style={{
                  width: '5px',
                  height: '5px',
                  borderRadius: '50%',
                  background: 'var(--cyan-400)',
                  boxShadow: '0 0 6px var(--cyan-400)',
                  animation: 'pulse-dot 1.5s infinite ease-in-out',
                }}
              />
              <span>ACTIVE</span>
            </span>
          )}
        </div>
        <StatusBadge status={job.status} size="sm" />
      </div>

      {/* 2. Issue Title */}
      <div className="job-issue-title" title={job.issueTitle || `Issue #${job.issueNumber}`}>
        <span style={{ color: 'var(--sky-400)', marginRight: '6px' }}>
          #{job.issueNumber}
        </span>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {job.issueTitle || `Issue #${job.issueNumber}`}
        </span>
      </div>

      {/* 3. Structured Middle Info Box (Fixed Height on all cards for exact uniformity) */}
      {isFailed && job.errorMessage ? (
        <div className="job-card-status-box error" title={job.errorMessage}>
          <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
          <span className="job-card-status-text">{job.errorMessage}</span>
        </div>
      ) : isPrCreated ? (
        <div className="job-card-status-box success">
          <CheckCircle2 size={14} style={{ flexShrink: 0, marginTop: 1 }} />
          <span className="job-card-status-text">
            Sandbox tests PASSED — Pull Request opened and ready for review.
          </span>
        </div>
      ) : isRunning ? (
        <div className="job-card-status-box running">
          <Sparkles size={14} style={{ flexShrink: 0, marginTop: 1 }} />
          <span className="job-card-status-text">
            Autonomous pipeline executing: [{job.status}] in Docker sandbox.
          </span>
        </div>
      ) : (
        <div className="job-card-status-box queued">
          <Clock size={14} style={{ flexShrink: 0, marginTop: 1 }} />
          <span className="job-card-status-text">
            Pipeline job queued — waiting for execution runner.
          </span>
        </div>
      )}

      {/* 4. Meta Footer with Actions */}
      <div className="job-card-meta">
        <div className="meta-item" title={DateHelper.formatDateTime(job.createdAt)}>
          <Clock size={13} />
          <span>{DateHelper.timeAgo(job.createdAt)}</span>
        </div>

        {job.attempts > 0 && (
          <div className="meta-item" title="Patch retry attempts">
            <RotateCw size={13} />
            <span>{job.attempts} {job.attempts === 1 ? 'attempt' : 'attempts'}</span>
          </div>
        )}

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
          {isPrCreated && (
            <a
              href={job.prUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary"
              style={{ padding: '4px 8px', fontSize: '0.72rem', color: 'var(--emerald-400)' }}
              onClick={(e) => e.stopPropagation()}
              title="Open Pull Request on GitHub"
            >
              <GitPullRequest size={12} />
              <span>View PR</span>
              <ExternalLink size={10} />
            </a>
          )}

          {isFailed && (
            <button
              className="btn btn-secondary"
              style={{ padding: '4px 8px', fontSize: '0.72rem', color: 'var(--amber-400)' }}
              onClick={handleRetry}
              title="Retry Pipeline"
            >
              <RotateCw size={12} />
              <span>Retry</span>
            </button>
          )}

          <button
            className="btn btn-secondary"
            style={{ padding: '4px 8px', fontSize: '0.72rem' }}
            onClick={handleInspect}
            title="Inspect logs and diff"
          >
            <span>Inspect</span>
            <ChevronRight size={12} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default JobCard;
