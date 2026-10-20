import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Search,
  RefreshCw,
  Zap,
  X,
} from 'lucide-react';
import JobCard from './JobCard';
import EmptyState from '../common/EmptyState';
import { useApp } from '../../context/AppContext';
import { isJobRunning, JOB_STATUS } from '../../constants/jobStatus';

export const JobList = ({ inspectorHeight }) => {
  const {
    jobs,
    selectedJobId,
    setSelectedJobId,
    selectedConnectionId,
    setSelectedConnectionId,
    connections,
    isJobsLoading,
    fetchJobs,
    setIsTriggerModalOpen,
    statusFilter,
    setStatusFilter,
    addToast,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const headerControlsRef = useRef(null);
  const [headerHeight, setHeaderHeight] = useState(160);

  // Measure top controls height to dynamically bound card list to console section height
  useEffect(() => {
    if (headerControlsRef.current) {
      setHeaderHeight(headerControlsRef.current.offsetHeight);
    }
  }, [selectedConnectionId, statusFilter, searchQuery]);

  // 1. Calculate live counts for each filter category
  const baseJobsForCounts = useMemo(() => {
    if (selectedConnectionId === 'all') return jobs;
    return jobs.filter((j) => j.connectionId === selectedConnectionId);
  }, [jobs, selectedConnectionId]);

  const counts = useMemo(() => {
    const total = baseJobsForCounts.length;
    const running = baseJobsForCounts.filter((j) => isJobRunning(j.status)).length;
    const prCreated = baseJobsForCounts.filter((j) => j.status === JOB_STATUS.PR_CREATED).length;
    const failed = baseJobsForCounts.filter((j) => j.status === JOB_STATUS.FAILED).length;
    return { total, running, prCreated, failed };
  }, [baseJobsForCounts]);

  // 2. Filter jobs based on repo selection, status, and search query
  // AND Sort: Active/Running activities FIRST, followed by other activities newest first
  const filteredJobs = useMemo(() => {
    const list = jobs.filter((job) => {
      // 1. Repo filter
      if (selectedConnectionId !== 'all' && job.connectionId !== selectedConnectionId) {
        return false;
      }

      // 2. Status filter
      if (statusFilter === 'RUNNING' && !isJobRunning(job.status)) {
        return false;
      }
      if (statusFilter === 'PR_CREATED' && job.status !== JOB_STATUS.PR_CREATED) {
        return false;
      }
      if (statusFilter === 'FAILED' && job.status !== JOB_STATUS.FAILED) {
        return false;
      }

      // 3. Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const repo = (job.repoFullName || '').toLowerCase();
        const title = (job.issueTitle || '').toLowerCase();
        const issueNum = String(job.issueNumber || '');
        if (!repo.includes(query) && !title.includes(query) && !issueNum.includes(query)) {
          return false;
        }
      }

      return true;
    });

    // "show active activity first and other after it"
    return list.sort((a, b) => {
      const aRunning = isJobRunning(a.status);
      const bRunning = isJobRunning(b.status);
      if (aRunning && !bRunning) return -1;
      if (!aRunning && bRunning) return 1;

      // Both running or both finished -> sort by createdAt newest first
      const timeA = new Date(a.createdAt || 0).getTime();
      const timeB = new Date(b.createdAt || 0).getTime();
      return timeB - timeA;
    });
  }, [jobs, selectedConnectionId, statusFilter, searchQuery]);

  const handleManualRefresh = async () => {
    await fetchJobs();
    addToast({ type: 'info', title: 'Feed Refreshed', message: 'Pipeline history updated', duration: 2500 });
  };

  const selectedRepoName = connections.find((c) => c.id === selectedConnectionId)?.repoFullName;

  // Compute dynamic max-height:
  // Starts scrolling when cards exceed console log section height!
  const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 1024;
  const dynamicScrollHeight = isDesktop && inspectorHeight
    ? `${Math.max(340, inspectorHeight - headerHeight - 14)}px`
    : undefined;

  return (
    <div className="jobs-feed-panel">
      {/* Top Controls Header Wrapper (Measured by ref) */}
      <div ref={headerControlsRef} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* Header & Controls */}
        <div className="panel-header">
          <h2 className="panel-title">
            <span>Pipeline Activities</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              ({filteredJobs.length} of {jobs.length} runs)
            </span>
          </h2>
          <button
            className="btn-icon-only"
            onClick={handleManualRefresh}
            title="Refresh job list"
            disabled={isJobsLoading}
            id="btn-joblist-refresh"
          >
            <RefreshCw size={14} className={isJobsLoading ? 'spin-icon' : ''} />
          </button>
        </div>

        {/* Active Repo Filter Warning Pill (if specific repo is chosen) */}
        {selectedConnectionId !== 'all' && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'rgba(56, 189, 248, 0.08)',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              borderRadius: 'var(--radius-sm)',
              padding: '6px 10px',
              fontSize: '0.75rem',
              color: 'var(--sky-400)',
            }}
          >
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              Repo: <strong>{selectedRepoName || selectedConnectionId}</strong>
            </span>
            <button
              onClick={() => setSelectedConnectionId('all')}
              style={{
                background: 'transparent',
                color: 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                gap: '2px',
                cursor: 'pointer',
                flexShrink: 0,
              }}
              title="Show jobs from all repositories"
            >
              <X size={12} />
              <span>All Repos</span>
            </button>
          </div>
        )}

        {/* Search Bar */}
        <div className="search-filter-bar">
          <Search size={16} color="var(--text-muted)" />
          <input
            type="text"
            className="search-input"
            placeholder="Filter by issue #, repo, or title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            id="input-job-search"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{ background: 'transparent', color: 'var(--text-muted)', fontSize: '0.75rem' }}
            >
              Clear
            </button>
          )}
        </div>

        {/* Filter Chips with Real-Time Count Badges */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {[
            { key: 'ALL', label: 'All Activities', count: counts.total },
            { key: 'RUNNING', label: 'In-Progress', count: counts.running, isLive: counts.running > 0 },
            { key: 'PR_CREATED', label: 'PR Created', count: counts.prCreated },
            { key: 'FAILED', label: 'Failed', count: counts.failed },
          ].map((chip) => {
            const isActive = statusFilter === chip.key;
            return (
              <button
                key={chip.key}
                onClick={() => setStatusFilter(chip.key)}
                className="btn btn-secondary"
                style={{
                  padding: '4px 10px',
                  fontSize: '0.75rem',
                  borderRadius: 'var(--radius-full)',
                  background: isActive ? 'var(--bg-surface-elevated)' : 'transparent',
                  borderColor: isActive ? 'var(--sky-400)' : 'var(--border-subtle)',
                  color: isActive ? 'var(--sky-400)' : 'var(--text-secondary)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
                id={`filter-chip-${chip.key.toLowerCase()}`}
              >
                {chip.isLive && (
                  <span
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: 'var(--emerald-400)',
                      boxShadow: '0 0 6px var(--emerald-400)',
                      animation: 'pulse-dot 1.5s infinite ease-in-out',
                    }}
                  />
                )}
                <span>{chip.label}</span>
                <span
                  style={{
                    background: isActive ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.06)',
                    padding: '1px 6px',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    color: isActive ? 'var(--sky-400)' : 'var(--text-muted)',
                  }}
                >
                  {chip.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Direct Activities Feed: Starts scrolling when cards exceed console log section height! */}
      {filteredJobs.length === 0 ? (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '44px 20px',
            textAlign: 'center',
            background: 'var(--bg-card)',
            borderRadius: 'var(--radius-lg)',
            border: '1px dashed var(--border-medium)',
            gap: '12px',
          }}
        >
          <div
            style={{
              width: '50px',
              height: '50px',
              borderRadius: '50%',
              background: 'rgba(56, 189, 248, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--sky-400)',
            }}
          >
            <Zap size={24} />
          </div>

          <h3 style={{ fontSize: '1.05rem', color: 'var(--text-main)' }}>
            {jobs.length === 0
              ? 'No Activities Yet'
              : `No Activities Match '${statusFilter}'`}
          </h3>

          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', maxWidth: '380px' }}>
            {jobs.length === 0
              ? 'Trigger an issue fix to watch GitFix AI clone, embed, generate a patch, and create a PR.'
              : counts.running > 0
              ? `You have ${counts.running} pipeline currently active! Switch to 'In-Progress' or 'All Activities' to view it.`
              : 'No pipeline activities match your selected filter or search query.'}
          </p>

          {/* Quick Resolution Buttons */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center', marginTop: '6px' }}>
            {counts.running > 0 && (
              <button
                className="btn btn-glow-cyan"
                style={{ padding: '6px 14px', fontSize: '0.8rem' }}
                onClick={() => setStatusFilter('RUNNING')}
              >
                <span>View Active ({counts.running})</span>
              </button>
            )}

            {statusFilter !== 'ALL' && (
              <button
                className="btn btn-secondary"
                style={{ padding: '6px 14px', fontSize: '0.8rem' }}
                onClick={() => setStatusFilter('ALL')}
              >
                <span>Show All Activities ({counts.total})</span>
              </button>
            )}

            {selectedConnectionId !== 'all' && (
              <button
                className="btn btn-secondary"
                style={{ padding: '6px 14px', fontSize: '0.8rem' }}
                onClick={() => setSelectedConnectionId('all')}
              >
                <span>Show All Repositories</span>
              </button>
            )}

            {searchQuery && (
              <button
                className="btn btn-secondary"
                style={{ padding: '6px 14px', fontSize: '0.8rem' }}
                onClick={() => setSearchQuery('')}
              >
                <span>Clear Search</span>
              </button>
            )}

            {jobs.length === 0 && (
              <button
                className="btn btn-glow-cyan"
                onClick={() => setIsTriggerModalOpen(true)}
              >
                <span>⚡ Trigger First Fix</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        <div
          className="job-list-scroll-container"
          style={dynamicScrollHeight ? { maxHeight: dynamicScrollHeight } : {}}
        >
          {filteredJobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              isSelected={job.id === selectedJobId}
              onSelect={(id) => setSelectedJobId(id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default JobList;
