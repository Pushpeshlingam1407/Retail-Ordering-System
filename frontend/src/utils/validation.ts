// ─── Email Validation ──────────────────────────────────────────────────────────
// RFC 5322–inspired strict check: local@domain.tld
const EMAIL_REGEX = /^[a-zA-Z0-9](?:[a-zA-Z0-9._%+\-]*[a-zA-Z0-9])?@[a-zA-Z0-9](?:[a-zA-Z0-9\-]*[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9\-]*[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;

export function validateEmail(value: string): string {
  const v = value.trim();
  if (!v)               return 'Email is required.';
  if (!EMAIL_REGEX.test(v)) return 'Enter a valid email address (e.g. user@example.com).';
  return '';
}

// ─── Password Validation ───────────────────────────────────────────────────────
// Rules: min 8 chars, 1 uppercase, 1 lowercase, 1 digit, 1 special character
export interface PasswordRuleResult {
  label: string;
  met: boolean;
}

export const PASSWORD_RULES: Array<{ label: string; test: (p: string) => boolean }> = [
  { label: 'At least 8 characters',           test: p => p.length >= 8 },
  { label: 'At least one uppercase letter (A–Z)', test: p => /[A-Z]/.test(p) },
  { label: 'At least one lowercase letter (a–z)', test: p => /[a-z]/.test(p) },
  { label: 'At least one number (0–9)',        test: p => /[0-9]/.test(p) },
  { label: 'At least one special character (!@#$…)', test: p => /[^a-zA-Z0-9]/.test(p) },
];

export function validatePassword(value: string): string {
  if (!value) return 'Password is required.';
  const failed = PASSWORD_RULES.filter(r => !r.test(value));
  if (failed.length > 0) {
    return failed.map(r => r.label).join('; ') + '.';
  }
  return '';
}

export function getPasswordRuleResults(value: string): PasswordRuleResult[] {
  return PASSWORD_RULES.map(r => ({ label: r.label, met: r.test(value) }));
}

export function isPasswordValid(value: string): boolean {
  return PASSWORD_RULES.every(r => r.test(value));
}
