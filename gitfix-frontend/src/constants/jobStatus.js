/**
 * GitFix AI - Pipeline & Job Status Constants
 * Maps directly to backend Job.Status enum and pipeline progression steps.
 */

export const JOB_STATUS = Object.freeze({
  QUEUED: 'QUEUED',
  CLONING: 'CLONING',
  INDEXING: 'INDEXING',
  RETRIEVING: 'RETRIEVING',
  GENERATING: 'GENERATING',
  TESTING: 'TESTING',
  RETRYING: 'RETRYING',
  CREATING_PR: 'CREATING_PR',
  PR_CREATED: 'PR_CREATED',
  FAILED: 'FAILED',
});

/**
 * Standard progression steps for the pipeline timeline
 */
export const PIPELINE_STEPS = [
  { key: 'QUEUED', label: 'Queued', description: 'Job enqueued for processing' },
  { key: 'CLONING', label: 'Cloning', description: 'Shallow git clone via JGit' },
  { key: 'INDEXING', label: 'Indexing', description: 'Semantic vector store embedding' },
  { key: 'RETRIEVING', label: 'Retrieval', description: 'Top-K chunk semantic search' },
  { key: 'GENERATING', label: 'AI Patch', description: 'Ollama Qwen2.5-Coder generation' },
  { key: 'TESTING', label: 'Sandbox Test', description: 'Isolated Docker mvn clean test' },
  { key: 'CREATING_PR', label: 'Branch & PR', description: 'Git branch commit & GitHub PR' },
  { key: 'PR_CREATED', label: 'PR Created', description: 'PR opened for human review' },
];

/**
 * Visual styling and metadata for each status
 */
export const STATUS_META = {
  [JOB_STATUS.QUEUED]: {
    label: 'Queued',
    color: '#f59e0b', // Amber
    bg: 'rgba(245, 158, 11, 0.12)',
    border: 'rgba(245, 158, 11, 0.3)',
    glow: 'rgba(245, 158, 11, 0.4)',
    icon: 'Clock',
    isInProgress: true,
    isTerminal: false,
    order: 0,
  },
  [JOB_STATUS.CLONING]: {
    label: 'Cloning Repo',
    color: '#38bdf8', // Sky Blue
    bg: 'rgba(56, 189, 248, 0.12)',
    border: 'rgba(56, 189, 248, 0.3)',
    glow: 'rgba(56, 189, 248, 0.4)',
    icon: 'GitBranch',
    isInProgress: true,
    isTerminal: false,
    order: 1,
  },
  [JOB_STATUS.INDEXING]: {
    label: 'Vector Indexing',
    color: '#a855f7', // Purple
    bg: 'rgba(168, 85, 247, 0.12)',
    border: 'rgba(168, 85, 247, 0.3)',
    glow: 'rgba(168, 85, 247, 0.4)',
    icon: 'Database',
    isInProgress: true,
    isTerminal: false,
    order: 2,
  },
  [JOB_STATUS.RETRIEVING]: {
    label: 'Semantic Search',
    color: '#6366f1', // Indigo
    bg: 'rgba(99, 102, 241, 0.12)',
    border: 'rgba(99, 102, 241, 0.3)',
    glow: 'rgba(99, 102, 241, 0.4)',
    icon: 'Search',
    isInProgress: true,
    isTerminal: false,
    order: 3,
  },
  [JOB_STATUS.GENERATING]: {
    label: 'AI Patch Generation',
    color: '#06b6d4', // Cyan
    bg: 'rgba(6, 182, 212, 0.12)',
    border: 'rgba(6, 182, 212, 0.3)',
    glow: 'rgba(6, 182, 212, 0.4)',
    icon: 'Sparkles',
    isInProgress: true,
    isTerminal: false,
    order: 4,
  },
  [JOB_STATUS.TESTING]: {
    label: 'Sandbox Testing',
    color: '#f97316', // Orange
    bg: 'rgba(249, 115, 22, 0.12)',
    border: 'rgba(249, 115, 22, 0.3)',
    glow: 'rgba(249, 115, 22, 0.4)',
    icon: 'FlaskConical',
    isInProgress: true,
    isTerminal: false,
    order: 5,
  },
  [JOB_STATUS.RETRYING]: {
    label: 'Retrying Patch',
    color: '#eab308', // Yellow
    bg: 'rgba(234, 179, 8, 0.12)',
    border: 'rgba(234, 179, 8, 0.3)',
    glow: 'rgba(234, 179, 8, 0.4)',
    icon: 'RefreshCw',
    isInProgress: true,
    isTerminal: false,
    order: 5,
  },
  [JOB_STATUS.CREATING_PR]: {
    label: 'Creating PR',
    color: '#3b82f6', // Blue
    bg: 'rgba(59, 130, 246, 0.12)',
    border: 'rgba(59, 130, 246, 0.3)',
    glow: 'rgba(59, 130, 246, 0.4)',
    icon: 'GitPullRequest',
    isInProgress: true,
    isTerminal: false,
    order: 6,
  },
  [JOB_STATUS.PR_CREATED]: {
    label: 'PR Created',
    color: '#10b981', // Emerald Green
    bg: 'rgba(16, 185, 129, 0.12)',
    border: 'rgba(16, 185, 129, 0.3)',
    glow: 'rgba(16, 185, 129, 0.4)',
    icon: 'CheckCircle2',
    isInProgress: false,
    isTerminal: true,
    order: 7,
  },
  [JOB_STATUS.FAILED]: {
    label: 'Failed',
    color: '#ef4444', // Red
    bg: 'rgba(239, 68, 68, 0.12)',
    border: 'rgba(239, 68, 68, 0.3)',
    glow: 'rgba(239, 68, 68, 0.4)',
    icon: 'XCircle',
    isInProgress: false,
    isTerminal: true,
    order: -1,
  },
};

/**
 * Returns metadata object for a given status with safe fallback
 */
export const getStatusMeta = (status) => {
  if (!status) {
    return {
      label: 'Unknown',
      color: '#94a3b8',
      bg: 'rgba(148, 163, 184, 0.1)',
      border: 'rgba(148, 163, 184, 0.2)',
      glow: 'transparent',
      icon: 'HelpCircle',
      isInProgress: false,
      isTerminal: false,
      order: -1,
    };
  }
  return STATUS_META[status] || {
    label: status,
    color: '#94a3b8',
    bg: 'rgba(148, 163, 184, 0.1)',
    border: 'rgba(148, 163, 184, 0.2)',
    glow: 'transparent',
    icon: 'HelpCircle',
    isInProgress: false,
    isTerminal: false,
    order: -1,
  };
};

/**
 * Check if a job status indicates an active execution in progress
 */
export const isJobRunning = (status) => {
  if (!status) return false;
  return status !== JOB_STATUS.PR_CREATED && status !== JOB_STATUS.FAILED;
};
