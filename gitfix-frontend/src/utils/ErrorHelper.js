/**
 * Utility for parsing and formatting backend error responses and validation messages.
 */
export class ErrorHelper {
  /**
   * Extracts clean, human-readable error title and message
   */
  static parseError(error) {
    if (!error) return { title: 'Unknown Error', message: 'An unexplained error occurred.' };

    if (typeof error === 'string') {
      return { title: 'Error', message: error };
    }

    let title = 'Operation Failed';
    let message = error.message || 'An unexpected error occurred.';

    if (error.status === 400) {
      title = 'Bad Request';
    } else if (error.status === 404) {
      title = 'Not Found';
    } else if (error.status === 408) {
      title = 'Request Timeout';
    } else if (error.status === 500) {
      title = 'Internal Server Error';
    } else if (error.status === 0) {
      title = 'Connection Refused';
      message = 'Cannot communicate with GitFix backend on port 8080. Check if the backend is running.';
    }

    // Check for nested validation errors map
    if (error.validationErrors && typeof error.validationErrors === 'object') {
      const fieldErrors = Object.entries(error.validationErrors)
        .map(([field, msg]) => `• ${field}: ${msg}`)
        .join('\n');
      if (fieldErrors) {
        message = `${message}\n\n${fieldErrors}`;
      }
    }

    return { title, message };
  }
}

export default ErrorHelper;
