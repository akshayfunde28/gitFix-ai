/**
 * API Endpoints & Base Configuration for GitFix AI
 * Follows Spring Boot 3 REST controller path conventions.
 */

// If running behind Vite dev server proxy or direct backend URL
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

export const ENDPOINTS = {
  // Connection management
  CONNECTIONS: {
    BASE: '/api/connections',
    BY_ID: (id) => `/api/connections/${encodeURIComponent(id)}`,
    WEBHOOK: (id) => `/api/connections/${encodeURIComponent(id)}/webhook`,
  },

  // Job orchestration & tracking
  JOBS: {
    BASE: '/api/jobs',
    MANUAL: '/api/jobs/manual',
    BY_ID: (id) => `/api/jobs/${encodeURIComponent(id)}`,
    LOGS: (id) => `/api/jobs/${encodeURIComponent(id)}/logs`,
    ATTEMPTS: (id) => `/api/jobs/${encodeURIComponent(id)}/attempts`,
    RETRY: (id) => `/api/jobs/${encodeURIComponent(id)}/retry`,
  },

  // Actuator & Health
  SYSTEM: {
    HEALTH: '/actuator/health',
  },
};

export const REQUEST_TIMEOUT_MS = 25000;
