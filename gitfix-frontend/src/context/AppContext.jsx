import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import connectionsService from '../api/connectionsService';
import jobsService from '../api/jobsService';
import systemService from '../api/systemService';
import { isJobRunning, JOB_STATUS } from '../constants/jobStatus';
import { STORAGE_KEYS, POLLING_INTERVALS, TABS } from '../constants/appConfig';
import StorageHelper from '../utils/StorageHelper';
import ErrorHelper from '../utils/ErrorHelper';

const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
  // Navigation & View State - if previous tab was 'architecture', fallback to 'pipelines'
  const [activeTab, setActiveTab] = useState(() => {
    const saved = StorageHelper.get(STORAGE_KEYS.LAST_SELECTED_TAB, TABS.PIPELINES);
    return saved === 'architecture' ? TABS.PIPELINES : saved;
  });

  const [isTriggerModalOpen, setIsTriggerModalOpen] = useState(false);
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);

  // Status Filter in Job Feed (Lifted to context so actions can switch filter)
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Connections State
  const [connections, setConnections] = useState([]);
  const [selectedConnectionId, setSelectedConnectionId] = useState(() => StorageHelper.get(STORAGE_KEYS.ACTIVE_CONNECTION_ID, 'all'));
  const [isConnectionsLoading, setIsConnectionsLoading] = useState(false);

  // Jobs State
  const [jobs, setJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [isJobsLoading, setIsJobsLoading] = useState(false);

  // Inspector State (Logs & Attempts for selectedJobId)
  const [logs, setLogs] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [isLogsLoading, setIsLogsLoading] = useState(false);
  const [isAttemptsLoading, setIsAttemptsLoading] = useState(false);

  // System Health
  const [systemHealth, setSystemHealth] = useState({ status: 'CHECKING', components: null, lastChecked: null });

  // Toast Notifications
  const [toasts, setToasts] = useState([]);

  // Auto-scroll toggle for terminal logs (INITIALLY OFF by default across all sections as requested)
  const [autoScrollLogs, setAutoScrollLogs] = useState(() => StorageHelper.get(STORAGE_KEYS.TERMINAL_AUTO_SCROLL, false));

  // Refs for tracking active polling without stale closures
  const activeJobIdRef = useRef(selectedJobId);
  activeJobIdRef.current = selectedJobId;

  const jobsRef = useRef(jobs);
  jobsRef.current = jobs;

  // Persist tab and connection selections
  useEffect(() => {
    StorageHelper.set(STORAGE_KEYS.LAST_SELECTED_TAB, activeTab);
  }, [activeTab]);

  useEffect(() => {
    StorageHelper.set(STORAGE_KEYS.ACTIVE_CONNECTION_ID, selectedConnectionId);
  }, [selectedConnectionId]);

  useEffect(() => {
    StorageHelper.set(STORAGE_KEYS.TERMINAL_AUTO_SCROLL, autoScrollLogs);
  }, [autoScrollLogs]);

  // Toast Dispatcher Helper
  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(({ type = 'info', title = '', message = '', duration = 4000 }) => {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newToast = { id, type, title, message, duration };
    setToasts((prev) => [...prev, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  // System Health Polling
  const checkHealth = useCallback(async () => {
    try {
      const data = await systemService.getHealth();
      setSystemHealth({
        status: data?.status || 'UP',
        components: data?.components || null,
        lastChecked: new Date().toISOString(),
      });
      return data;
    } catch {
      setSystemHealth({
        status: 'DOWN',
        components: null,
        lastChecked: new Date().toISOString(),
      });
      return null;
    }
  }, []);

  // Fetch Connections
  const fetchConnections = useCallback(async (quiet = false) => {
    if (!quiet) setIsConnectionsLoading(true);
    try {
      const data = await connectionsService.getConnections();
      const list = Array.isArray(data) ? data : [];
      setConnections(list);
      return list;
    } catch (err) {
      const { title, message } = ErrorHelper.parseError(err);
      if (!quiet) addToast({ type: 'error', title, message });
      return [];
    } finally {
      if (!quiet) setIsConnectionsLoading(false);
    }
  }, [addToast]);

  // Fetch Jobs
  const fetchJobs = useCallback(async (quiet = false) => {
    if (!quiet) setIsJobsLoading(true);
    try {
      const data = await jobsService.getJobs();
      const list = Array.isArray(data) ? data : [];
      setJobs(list);

      // Default select the latest job if none is currently selected
      if (!activeJobIdRef.current && list.length > 0) {
        setSelectedJobId(list[0].id);
      }
      return list;
    } catch (err) {
      const { title, message } = ErrorHelper.parseError(err);
      if (!quiet) addToast({ type: 'error', title, message });
      return [];
    } finally {
      if (!quiet) setIsJobsLoading(false);
    }
  }, [addToast]);

  // Fetch Logs for a specific job
  const fetchLogs = useCallback(async (jobId, quiet = false) => {
    if (!jobId) return [];
    if (!quiet) setIsLogsLoading(true);
    try {
      const data = await jobsService.getJobLogs(jobId);
      const logList = Array.isArray(data) ? data : [];
      setLogs(logList);
      return logList;
    } catch {
      return [];
    } finally {
      if (!quiet) setIsLogsLoading(false);
    }
  }, []);

  // Fetch Attempts for a specific job
  const fetchAttempts = useCallback(async (jobId, quiet = false) => {
    if (!jobId) return [];
    if (!quiet) setIsAttemptsLoading(true);
    try {
      const data = await jobsService.getJobAttempts(jobId);
      const attemptList = Array.isArray(data) ? data : [];
      setAttempts(attemptList);
      return attemptList;
    } catch {
      return [];
    } finally {
      if (!quiet) setIsAttemptsLoading(false);
    }
  }, []);

  // When selectedJobId changes, immediately fetch its logs and attempts
  useEffect(() => {
    if (selectedJobId) {
      fetchLogs(selectedJobId);
      fetchAttempts(selectedJobId);
    } else {
      setLogs([]);
      setAttempts([]);
    }
  }, [selectedJobId, fetchLogs, fetchAttempts]);

  // Initial Load: health, connections, jobs
  useEffect(() => {
    checkHealth();
    fetchConnections();
    fetchJobs();

    const healthInterval = setInterval(checkHealth, POLLING_INTERVALS.HEALTH_CHECK_MS);
    return () => clearInterval(healthInterval);
  }, [checkHealth, fetchConnections, fetchJobs]);

  // Dynamic Polling for Active Jobs & Selected Job
  useEffect(() => {
    const pollTimer = setInterval(async () => {
      // Check if any job is currently in progress
      const currentJobs = jobsRef.current;
      const anyRunning = currentJobs.some((j) => isJobRunning(j.status));
      const currentSelectedJob = currentJobs.find((j) => j.id === activeJobIdRef.current);
      const isSelectedRunning = currentSelectedJob && isJobRunning(currentSelectedJob.status);

      if (anyRunning || isSelectedRunning) {
        // Refresh jobs silently
        const updatedList = await fetchJobs(true);

        // If the selected job is running, refresh its logs & attempts silently
        if (activeJobIdRef.current) {
          fetchLogs(activeJobIdRef.current, true);
          fetchAttempts(activeJobIdRef.current, true);

          // Check if it just finished
          const updatedSelected = updatedList?.find((j) => j.id === activeJobIdRef.current);
          if (currentSelectedJob && isJobRunning(currentSelectedJob.status) && updatedSelected && !isJobRunning(updatedSelected.status)) {
            if (updatedSelected.status === JOB_STATUS.PR_CREATED) {
              addToast({
                type: 'success',
                title: 'Pipeline Succeeded! 🎉',
                message: `PR opened for #${updatedSelected.issueNumber}: ${updatedSelected.prUrl || ''}`,
                duration: 9000,
              });
            } else if (updatedSelected.status === JOB_STATUS.FAILED) {
              addToast({
                type: 'error',
                title: 'Pipeline Failed',
                message: updatedSelected.errorMessage || 'Job failed during execution.',
                duration: 9000,
              });
            }
          }
        }
      }
    }, POLLING_INTERVALS.ACTIVE_JOB_MS);

    return () => clearInterval(pollTimer);
  }, [fetchJobs, fetchLogs, fetchAttempts, addToast]);

  // Refresh All Data Helper (Used by header and feed refresh buttons)
  const refreshAll = useCallback(async () => {
    const [healthRes, jobsRes, connsRes] = await Promise.all([
      checkHealth(),
      fetchJobs(),
      fetchConnections(true),
      activeJobIdRef.current ? fetchLogs(activeJobIdRef.current, true) : Promise.resolve(),
      activeJobIdRef.current ? fetchAttempts(activeJobIdRef.current, true) : Promise.resolve(),
    ]);
    addToast({
      type: 'info',
      title: 'Synced with Backend',
      message: `Updated ${jobsRes?.length || 0} pipelines and engine status.`,
      duration: 3000,
    });
  }, [checkHealth, fetchJobs, fetchConnections, fetchLogs, fetchAttempts, addToast]);

  // Actions
  const triggerManualJob = async ({ connectionId, issueNumber }) => {
    try {
      const newJob = await jobsService.triggerManualJob({ connectionId, issueNumber });
      addToast({
        type: 'success',
        title: 'Job Triggered',
        message: `Pipeline queued for Issue #${issueNumber} (${newJob.repoFullName})`,
      });
      // Automatically switch to ALL or RUNNING filter so user immediately sees the running job!
      setStatusFilter('ALL');

      await fetchJobs();
      if (newJob?.id) {
        setSelectedJobId(newJob.id);
        setActiveTab(TABS.INSPECTOR);
      }
      setIsTriggerModalOpen(false);
      return newJob;
    } catch (err) {
      const { title, message } = ErrorHelper.parseError(err);
      addToast({ type: 'error', title, message });
      throw err;
    }
  };

  const retryJob = async (jobId) => {
    try {
      const updatedJob = await jobsService.retryJob(jobId);
      addToast({
        type: 'info',
        title: 'Retry Triggered',
        message: `Re-queued job for Issue #${updatedJob.issueNumber}`,
      });
      // Ensure filter includes running jobs
      setStatusFilter('ALL');
      await fetchJobs();
      if (jobId) {
        setSelectedJobId(jobId);
        fetchLogs(jobId);
      }
      return updatedJob;
    } catch (err) {
      const { title, message } = ErrorHelper.parseError(err);
      addToast({ type: 'error', title, message });
      throw err;
    }
  };

  const createConnection = async (payload) => {
    try {
      const created = await connectionsService.createConnection(payload);
      addToast({
        type: 'success',
        title: 'Repository Connected',
        message: `Successfully linked ${created.repoFullName}`,
      });
      await fetchConnections();
      setSelectedConnectionId(created.id);
      setIsConnectModalOpen(false);
      return created;
    } catch (err) {
      const { title, message } = ErrorHelper.parseError(err);
      addToast({ type: 'error', title, message });
      throw err;
    }
  };

  const deleteConnection = async (id, repoName) => {
    try {
      await connectionsService.deleteConnection(id);
      addToast({
        type: 'info',
        title: 'Repository Disconnected',
        message: `Removed ${repoName || id}`,
      });
      await fetchConnections();
      if (selectedConnectionId === id) {
        setSelectedConnectionId('all');
      }
    } catch (err) {
      const { title, message } = ErrorHelper.parseError(err);
      addToast({ type: 'error', title, message });
      throw err;
    }
  };

  const registerWebhook = async (id, repoName) => {
    try {
      const res = await connectionsService.registerWebhook(id);
      addToast({
        type: 'success',
        title: 'Webhook Registered',
        message: res?.message || `Webhook enabled for ${repoName || id}`,
      });
      await fetchConnections();
      return res;
    } catch (err) {
      const { title, message } = ErrorHelper.parseError(err);
      addToast({ type: 'error', title, message });
      throw err;
    }
  };

  const selectedJob = jobs.find((j) => j.id === selectedJobId) || null;

  const value = {
    // Navigation
    activeTab,
    setActiveTab,
    isTriggerModalOpen,
    setIsTriggerModalOpen,
    isConnectModalOpen,
    setIsConnectModalOpen,

    // Status Filter for Job Feed
    statusFilter,
    setStatusFilter,

    // Connections
    connections,
    selectedConnectionId,
    setSelectedConnectionId,
    isConnectionsLoading,
    fetchConnections,
    createConnection,
    deleteConnection,
    registerWebhook,

    // Jobs
    jobs,
    selectedJobId,
    setSelectedJobId,
    selectedJob,
    isJobsLoading,
    fetchJobs,
    refreshAll,
    triggerManualJob,
    retryJob,

    // Logs & Attempts
    logs,
    attempts,
    isLogsLoading,
    isAttemptsLoading,
    fetchLogs,
    fetchAttempts,
    autoScrollLogs,
    setAutoScrollLogs,

    // Health
    systemHealth,
    checkHealth,

    // Toasts
    toasts,
    addToast,
    removeToast,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

export default AppContext;
