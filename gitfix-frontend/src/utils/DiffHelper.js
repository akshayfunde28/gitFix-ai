/**
 * Helper class for parsing and formatting AI-generated patch files and diffs.
 */
export class DiffHelper {
  /**
   * Safely parses the patch string/object returned from the attempts endpoint.
   * Format: { explanation: string, files: [{ filePath, content, action }] }
   */
  static parsePatch(patchRaw) {
    if (!patchRaw) {
      return { explanation: 'No patch generated yet.', files: [] };
    }

    if (typeof patchRaw === 'object') {
      return {
        explanation: patchRaw.explanation || '',
        files: Array.isArray(patchRaw.files) ? patchRaw.files : [],
      };
    }

    try {
      const parsed = JSON.parse(patchRaw);
      return {
        explanation: parsed.explanation || '',
        files: Array.isArray(parsed.files) ? parsed.files : [],
      };
    } catch {
      // Fallback if raw text or markdown
      return {
        explanation: 'Raw patch output',
        files: [
          {
            filePath: 'patch.diff',
            content: String(patchRaw),
            action: 'MODIFY',
          },
        ],
      };
    }
  }

  /**
   * Calculates rough line stats for code content
   */
  static calculateFileStats(content) {
    if (!content) return { lines: 0, chars: 0 };
    const lines = content.split('\n');
    return {
      lines: lines.length,
      chars: content.length,
    };
  }

  /**
   * Extracts clean filename from a path (e.g. src/main/java/Foo.java -> Foo.java)
   */
  static getBaseName(filePath) {
    if (!filePath) return '';
    const parts = filePath.split(/[/\\]/);
    return parts[parts.length - 1];
  }

  /**
   * Extracts directory path (e.g. src/main/java/Foo.java -> src/main/java)
   */
  static getDirectory(filePath) {
    if (!filePath) return '';
    const parts = filePath.split(/[/\\]/);
    if (parts.length <= 1) return '';
    return parts.slice(0, -1).join('/');
  }
}

export default DiffHelper;
