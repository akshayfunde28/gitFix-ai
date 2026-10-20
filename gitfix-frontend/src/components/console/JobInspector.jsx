import React, { useState } from 'react';
import {
  Terminal,
  Code2,
  RefreshCw,
} from 'lucide-react';
import PipelineStepper from '../jobs/PipelineStepper';
import LiveLogViewer from './LiveLogViewer';
import AttemptsViewer from './AttemptsViewer';
import EmptyState from '../common/EmptyState';
import { useApp } from '../../context/AppContext';

export const JobInspector = () => {
  const {
    selectedJob,
    logs,
    attempts,
    isLogsLoading,
    isAttemptsLoading,
    fetchLogs,
    fetchAttempts,
    fetchJobs,
    setIsTriggerModalOpen,
    addToast,
  } = useApp();

  const [activeConsoleTab, setActiveConsoleTab] = useState('terminal'); // 'terminal' | 'patch'

  if (!selectedJob) {
    return (
      <EmptyState
        icon={Terminal}
        title="No Pipeline Job Selected"
        description="Select a job from the Pipelines feed or trigger a new autonomous bug fix to inspect live logs and patches."
        actionLabel="⚡ Trigger Fix"
        onAction={() => setIsTriggerModalOpen(true)}
      />
    );
  }

  const handleRefresh = async () => {
    if (selectedJob?.id) {
      await Promise.all([
        fetchLogs(selectedJob.id),
        fetchAttempts(selectedJob.id),
        fetchJobs(true),
      ]);
      addToast({
        type: 'info',
        title: 'Inspector Synced',
        message: `Updated logs and attempts for #${selectedJob.issueNumber}`,
        duration: 2500,
      });
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* 8-Step Pipeline Progress Stepper */}
      <PipelineStepper job={selectedJob} />

      {/* Main Console Box */}
      <div className="inspector-panel">
        {/* Header Tabs: Terminal vs Patch & Sandbox Tests */}
        <div className="inspector-header">
          <div className="inspector-tabs">
            <button
              className={`inspector-tab-btn ${activeConsoleTab === 'terminal' ? 'active' : ''}`}
              onClick={() => setActiveConsoleTab('terminal')}
              id="tab-btn-console-logs"
            >
              <Terminal size={15} />
              <span>Live Console Logs ({logs.length})</span>
            </button>
            <button
              className={`inspector-tab-btn ${activeConsoleTab === 'patch' ? 'active' : ''}`}
              onClick={() => setActiveConsoleTab('patch')}
              id="tab-btn-patch-diffs"
            >
              <Code2 size={15} />
              <span>AI Patch & Sandbox Diffs ({attempts.length})</span>
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              className="btn btn-secondary"
              style={{ padding: '6px 12px', fontSize: '0.78rem' }}
              onClick={handleRefresh}
              disabled={isLogsLoading || isAttemptsLoading}
              title="Refresh logs and attempts"
              id="btn-inspector-sync"
            >
              <RefreshCw size={13} className={isLogsLoading || isAttemptsLoading ? 'spin-icon' : ''} />
              <span>Sync</span>
            </button>
          </div>
        </div>

        {/* Content Area */}
        {activeConsoleTab === 'terminal' ? (
          <LiveLogViewer
            logs={logs}
            isLoading={isLogsLoading}
            onRefresh={handleRefresh}
          />
        ) : (
          <AttemptsViewer
            attempts={attempts}
            isLoading={isAttemptsLoading}
          />
        )}
      </div>
    </div>
  );
};

export default JobInspector;
