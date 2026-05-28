type SanitizeOptions = {
  maxLength?: number;
  preserveNewlines?: boolean;
};

const CONTROL_AND_ZERO_WIDTH_CHARS = /[\u0000-\u001f\u007f-\u009f\u200b-\u200f\ufeff]/g;

export function sanitizeUserInput(value: string, options: SanitizeOptions = {}) {
  const maxLength = options.maxLength ?? 1000;
  const lineBreakPlaceholder = "__GM_LINE_BREAK__";

  let sanitized = value.replace(/\r\n?/g, "\n");

  if (options.preserveNewlines) {
    sanitized = sanitized.replace(/\n/g, lineBreakPlaceholder);
  }

  sanitized = sanitized
    .replace(CONTROL_AND_ZERO_WIDTH_CHARS, " ")
    .replace(/[<>]/g, "")
    .replace(/[ \t]+/g, " ");

  if (options.preserveNewlines) {
    sanitized = sanitized
      .replace(new RegExp(`\\s*${lineBreakPlaceholder}\\s*`, "g"), "\n")
      .replace(/\n{3,}/g, "\n\n");
  } else {
    sanitized = sanitized.replace(/\s+/g, " ");
  }

  return sanitized.trim().slice(0, maxLength);
}

export function sanitizeNullableUserInput(value?: string | null, options: SanitizeOptions = {}) {
  if (value == null) return null;
  const sanitized = sanitizeUserInput(value, options);
  return sanitized || null;
}

export function sanitizeSearchInput(value: string, maxLength = 80) {
  return sanitizeUserInput(value, { maxLength })
    .replace(/[,%()]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
