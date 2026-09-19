export function validateName(value: string, label: string): string | null {
  if (value.trim().length === 0) return `${label} is required.`;
  if (value.trim().length > 40) return `${label} cannot exceed 40 characters.`;
  return null;
}

export function validateNickName(value: string): string | null {
  if (value.trim().length === 0) return 'Nickname is required.';
  if (value.trim().length > 20) return 'Nickname cannot exceed 20 characters.';
  return null;
}

export function validateEmail(value: string): string | null {
  if (value.trim().length === 0) return 'Email is required.';
  return null;
}

export function validatePassword(value: string): string | null {
  if (value.length === 0) return 'Password is required.';
  if (value.length < 8) return 'Password needs at least 8 characters.';
  if (value.length > 72) return 'Password cannot exceed 72 characters.';
  return null;
}

export function validateIdentifier(value: string): string | null {
  if (value.trim().length === 0) return 'Enter your nickname or email.';
  return null;
}
