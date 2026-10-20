/**
 * Application-wide settings, storage keys, and polling configurations.
 */

export const STORAGE_KEYS = {
  ACTIVE_CONNECTION_ID: 'gitfix_active_connection_id',
  AUTO_POLL_ENABLED: 'gitfix_auto_poll_enabled',
  TERMINAL_AUTO_SCROLL: 'gitfix_terminal_auto_scroll',
  THEME_PREFERENCE: 'gitfix_theme_preference',
  LAST_SELECTED_TAB: 'gitfix_last_selected_tab',
};

export const POLLING_INTERVALS = {
  ACTIVE_JOB_MS: 2500,       // Poll active/running jobs every 2.5 seconds
  IDLE_JOBS_MS: 12000,       // Poll general jobs list every 12 seconds
  HEALTH_CHECK_MS: 30000,    // Actuator health check every 30 seconds
};

export const TABS = {
  PIPELINES: 'pipelines',
  INSPECTOR: 'inspector',
  CONNECTIONS: 'connections',
};
