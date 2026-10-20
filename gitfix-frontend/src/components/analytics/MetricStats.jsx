import React from 'react';
import {
  GitPullRequest,
  CheckCircle2,
  Activity,
  Layers,
  Clock,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { isJobRunning, JOB_STATUS } from '../../constants/jobStatus';

export const MetricStats = () => {
  const { jobs, connections, selectedConnectionId } = useApp();

  const filteredJobs = selectedConnectionId === 'all'
    ? jobs
    : jobs.filter((j) => j.connectionId === selectedConnectionId);

  const totalRuns = filteredJobs.length;
  const successfulRuns = filteredJobs.filter((j) => j.status === JOB_STATUS.PR_CREATED).length;
  const runningCount = filteredJobs.filter((j) => isJobRunning(j.status)).length;
  const successRate = totalRuns > 0 ? Math.round((successfulRuns / totalRuns) * 100) : 0;

  return (
    <div className="metrics-grid">
      {/* Metric 1: Total Jobs */}
      <div className="metric-card">
        <div
          className="metric-icon-box"
          style={{ background: 'rgba(56, 189, 248, 0.12)', color: 'var(--sky-400)' }}
        >
          <Activity size={22} />
        </div>
        <div className="metric-details">
          <span className="metric-label">Total Pipelines</span>
          <span className="metric-value">{totalRuns}</span>
          <span className="metric-sub">Triggered runs</span>
        </div>
      </div>

      {/* Metric 2: PRs Created & Success Rate */}
      <div className="metric-card">
        <div
          className="metric-icon-box"
          style={{ background: 'rgba(16, 185, 129, 0.12)', color: 'var(--emerald-400)' }}
        >
          <GitPullRequest size={22} />
        </div>
        <div className="metric-details">
          <span className="metric-label">Pull Requests</span>
          <span className="metric-value">{successfulRuns}</span>
          <span className="metric-sub" style={{ color: 'var(--emerald-400)' }}>
            {successRate}% resolution rate
          </span>
        </div>
      </div>

      {/* Metric 3: Currently Running */}
      <div className="metric-card">
        <div
          className="metric-icon-box"
          style={{ background: 'rgba(6, 182, 212, 0.12)', color: 'var(--cyan-400)' }}
        >
          <Sparkles size={22} />
        </div>
        <div className="metric-details">
          <span className="metric-label">Active Fixes</span>
          <span className="metric-value">{runningCount}</span>
          <span className="metric-sub">
            {runningCount > 0 ? 'Live in Docker Sandbox' : 'Idle / Standby'}
          </span>
        </div>
      </div>

      {/* Metric 4: Connected Repositories */}
      <div className="metric-card">
        <div
          className="metric-icon-box"
          style={{ background: 'rgba(168, 85, 247, 0.12)', color: 'var(--purple-400)' }}
        >
          <Layers size={22} />
        </div>
        <div className="metric-details">
          <span className="metric-label">Connected Repos</span>
          <span className="metric-value">{connections.length}</span>
          <span className="metric-sub">Protected by AES-256</span>
        </div>
      </div>
    </div>
  );
};

export default MetricStats;
