/**
 * Service for GitFix Pipeline Jobs
 * Orchestrates manual triggers, status tracking, log streaming, and attempt inspections.
 */
import apiClient from './apiClient';
import { ENDPOINTS } from '../constants/apiEndpoints';

class JobsService {
  /**
   * Fetch all pipeline jobs (sorted newest first)
   */
  async getJobs() {
    return apiClient.get(ENDPOINTS.JOBS.BASE);
  }

  /**
   * Fetch detailed job status by ID
   * @param {string} jobId
   */
  async getJobById(jobId) {
    return apiClient.get(ENDPOINTS.JOBS.BY_ID(jobId));
  }

  /**
   * Trigger a job manually by issue number and connection ID
   * @param {{ connectionId: string, issueNumber: number|string }} payload
   */
  async triggerManualJob(payload) {
    const formatted = {
      connectionId: payload.connectionId,
      issueNumber: parseInt(payload.issueNumber, 10),
    };
    return apiClient.post(ENDPOINTS.JOBS.MANUAL, formatted);
  }

  /**
   * Fetch step-by-step audit logs for a job
   * @param {string} jobId
   */
  async getJobLogs(jobId) {
    return apiClient.get(ENDPOINTS.JOBS.LOGS(jobId));
  }

  /**
   * Fetch attempts, patch JSON & sandbox test logs per retry
   * @param {string} jobId
   */
  async getJobAttempts(jobId) {
    return apiClient.get(ENDPOINTS.JOBS.ATTEMPTS(jobId));
  }

  /**
   * Retry a failed job
   * @param {string} jobId
   */
  async retryJob(jobId) {
    return apiClient.post(ENDPOINTS.JOBS.RETRY(jobId));
  }
}

export const jobsService = new JobsService();
export default jobsService;
