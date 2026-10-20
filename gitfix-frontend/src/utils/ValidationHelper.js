/**
 * Form validation and sanity check helper
 */
export class ValidationHelper {
  /**
   * Validates GitHub repo format: 'owner/repo'
   */
  static isValidRepoFullName(repo) {
    if (!repo || typeof repo !== 'string') return false;
    const trimmed = repo.trim();
    const regex = /^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/;
    return regex.test(trimmed);
  }

  /**
   * Validates GitHub Personal Access Token format
   */
  static isValidGithubToken(token) {
    if (!token || typeof token !== 'string') return false;
    const trimmed = token.trim();
    // GitHub PATs start with ghp_, github_pat_, or classic 40 hex chars
    return trimmed.length >= 20;
  }

  /**
   * Validates issue number is a positive integer
   */
  static isValidIssueNumber(num) {
    const parsed = parseInt(num, 10);
    return !isNaN(parsed) && parsed > 0 && String(parsed) === String(num).trim();
  }
}

export default ValidationHelper;
