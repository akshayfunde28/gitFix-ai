import React from 'react';
import {
  Clock,
  GitBranch,
  Database,
  Search,
  Sparkles,
  FlaskConical,
  GitPullRequest,
  CheckCircle2,
  XCircle,
  ExternalLink,
  RotateCw,
} from 'lucide-react';
import { PIPELINE_STEPS, getStatusMeta, JOB_STATUS, isJobRunning } from '../../constants/jobStatus';
import StatusBadge from '../common/StatusBadge';
import DateHelper from '../../utils/DateHelper';
import { useApp } from '../../context/AppContext';

const STEP_ICONS = {
  QUEUED: Clock,
  CLONING: GitBranch,
  INDEXING: Database,
  RETRIEVING: Search,
  GENERATING: Sparkles,
  TESTING: FlaskConical,
  CREATING_PR: GitBranch,
  PR_CREATED: GitPullRequest,
};

export const PipelineStepper = ({ job }) => {
  const { retryJob } = useApp();

  if (!job) return null;

  const currentMeta = getStatusMeta(job.status);
  const currentOrder = currentMeta.order;
  const isFailed = job.status === JOB_STATUS.FAILED;
  const isPrCreated = job.status === JOB_STATUS.PR_CREATED;
  const running = isJobRunning(job.status);

  return (
    <div className="pipeline-stepper">
      {/* Header Info */}
      <div className="stepper-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h3 className="stepper-title">
              <span>{job.repoFullName}</span>
              <span style={{ color: 'var(--sky-400)' }}>#{job.issueNumber}</span>
            </h3>
            <StatusBadge status={job.status} />
          </div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            {job.issueTitle || `GitHub Issue #${job.issueNumber}`} • Started {DateHelper.formatDateTime(job.createdAt)}
            {job.updatedAt && ` • Duration: ${DateHelper.duration(job.createdAt, job.updatedAt)}`}
          </div>
        </div>

        {/* Action button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {isPrCreated && job.prUrl && (
            <a
              href={job.prUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary"
              style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}
            >
              <GitPullRequest size={16} />
              <span>Review GitHub PR</span>
              <ExternalLink size={14} />
            </a>
          )}

          {isFailed && (
            <button
              className="btn btn-secondary"
              style={{ color: 'var(--amber-400)', borderColor: 'rgba(245, 158, 11, 0.4)' }}
              onClick={() => retryJob(job.id)}
            >
              <RotateCw size={14} />
              <span>Retry Pipeline</span>
            </button>
          )}
        </div>
      </div>

      {/* Stepper Track */}
      <div className="stepper-track">
        {PIPELINE_STEPS.map((step, index) => {
          const Icon = STEP_ICONS[step.key] || Clock;

          let stepState = 'pending'; // 'pending' | 'completed' | 'current' | 'failed'

          if (isFailed) {
            // If failed, steps up to last known are completed, or mark failed
            if (index < 5) {
              stepState = 'completed';
            } else if (index === 5) {
              stepState = 'failed';
            } else {
              stepState = 'pending';
            }
          } else if (isPrCreated) {
            stepState = 'completed';
          } else if (index < currentOrder) {
            stepState = 'completed';
          } else if (index === currentOrder) {
            stepState = 'current';
          }

          const isLast = index === PIPELINE_STEPS.length - 1;

          return (
            <div key={step.key} className={`step-node ${stepState}`}>
              <div className="step-circle" title={`${step.label}: ${step.description}`}>
                {stepState === 'completed' ? (
                  <CheckCircle2 size={18} color="var(--emerald-400)" />
                ) : stepState === 'failed' ? (
                  <XCircle size={18} color="var(--rose-400)" />
                ) : (
                  <Icon size={16} />
                )}
              </div>
              <span className="step-label">{step.label}</span>

              {/* Connecting line to next node */}
              {!isLast && (
                <div
                  className={`step-connector ${
                    stepState === 'completed' && index < currentOrder ? 'filled' : ''
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PipelineStepper;
