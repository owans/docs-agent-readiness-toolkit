// biome-ignore lint/suspicious/noControlCharactersInRegex: Security output sanitization must match control characters.
const CONTROL_CHARACTERS = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f-\u009f]/gu;
const BIDI_CONTROLS = /[\u202a-\u202e\u2066-\u2069]/gu;
// biome-ignore lint/suspicious/noControlCharactersInRegex: ANSI escape removal intentionally matches escape and bell.
const ANSI_ESCAPE = /\u001b(?:\[[0-?]*[ -/]*[@-~]|\][^\u0007]*(?:\u0007|\u001b\\))/gu;

export function sanitizeText(value: string): string {
  return value
    .replace(ANSI_ESCAPE, "")
    .replace(CONTROL_CHARACTERS, "\uFFFD")
    .replace(BIDI_CONTROLS, "\uFFFD");
}

export function markdownText(value: string): string {
  return sanitizeText(value)
    .replace(/[\r\n\t]+/gu, " ")
    .replaceAll("\\", "\\\\")
    .replaceAll("`", "\\`")
    .replaceAll("|", "\\|")
    .replaceAll("[", "\\[")
    .replaceAll("]", "\\]")
    .replaceAll("<", "\\<")
    .replaceAll(">", "\\>");
}
