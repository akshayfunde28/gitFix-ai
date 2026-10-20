/**
 * Helper class for formatting timestamps, durations, and human-friendly time-ago representations.
 */
export class DateHelper {
  /**
   * Formats an ISO date into full readable date & time (e.g., Oct 20, 2026, 1:38 PM)
   */
  static formatDateTime(isoString) {
    if (!isoString) return '—';
    try {
      const date = new Date(isoString);
      if (isNaN(date.getTime())) return isoString;
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      }).format(date);
    } catch {
      return isoString;
    }
  }

  /**
   * Formats time only with milliseconds for console logs (e.g., 13:40:34.518)
   */
  static formatLogTime(isoString) {
    if (!isoString) return '--:--:--';
    try {
      const date = new Date(isoString);
      if (isNaN(date.getTime())) return isoString;
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      const ms = String(date.getMilliseconds()).padStart(3, '0');
      return `${hours}:${minutes}:${seconds}.${ms}`;
    } catch {
      return isoString;
    }
  }

  /**
   * Returns human-readable relative time (e.g., '2 minutes ago', 'just now')
   */
  static timeAgo(isoString) {
    if (!isoString) return '—';
    try {
      const date = new Date(isoString);
      if (isNaN(date.getTime())) return isoString;
      const now = new Date();
      const diffSecs = Math.floor((now - date) / 1000);

      if (diffSecs < 5) return 'just now';
      if (diffSecs < 60) return `${diffSecs}s ago`;

      const diffMins = Math.floor(diffSecs / 60);
      if (diffMins < 60) return `${diffMins}m ago`;

      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;

      const diffDays = Math.floor(diffHours / 24);
      if (diffDays < 30) return `${diffDays}d ago`;

      return this.formatDateTime(isoString);
    } catch {
      return isoString;
    }
  }

  /**
   * Computes human-friendly duration between two ISO timestamps
   */
  static duration(startIso, endIso) {
    if (!startIso) return '—';
    try {
      const start = new Date(startIso);
      const end = endIso ? new Date(endIso) : new Date();
      if (isNaN(start.getTime()) || isNaN(end.getTime())) return '—';

      const diffMs = Math.max(0, end - start);
      const totalSecs = Math.floor(diffMs / 1000);

      const minutes = Math.floor(totalSecs / 60);
      const seconds = totalSecs % 60;

      if (minutes === 0) {
        return `${seconds}s`;
      }
      return `${minutes}m ${seconds}s`;
    } catch {
      return '—';
    }
  }
}

export default DateHelper;
