import bcrypt from 'bcrypt';
import { AppError, ErrorCode } from './errors';

const SALT_ROUNDS = 12;

// Password requirements
const MIN_LENGTH = 8;
const HAS_LETTER_REGEX = /[a-zA-Z]/;
const HAS_NUMBER_REGEX = /[0-9]/;
const HAS_SPECIAL_REGEX = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/;

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Validate password strength
 * Requirements:
 * - At least 8 characters
 * - Contains at least one letter (a-z, A-Z)
 * - Contains at least one number (0-9)
 * - Contains at least one special character
 */
export function validatePasswordStrength(password: string): PasswordValidationResult {
  const errors: string[] = [];

  if (password.length < MIN_LENGTH) {
    errors.push(`Password must be at least ${MIN_LENGTH} characters long`);
  }

  if (!HAS_LETTER_REGEX.test(password)) {
    errors.push('Password must contain at least one letter');
  }

  if (!HAS_NUMBER_REGEX.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (!HAS_SPECIAL_REGEX.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}


/**
 * Check if password is strong enough, throws AppError if not
 */
export function assertPasswordStrength(password: string): void {
  const result = validatePasswordStrength(password);
  if (!result.isValid) {
    throw new AppError(ErrorCode.WEAK_PASSWORD, result.errors.join('. '), 400, {
      requirements: {
        minLength: MIN_LENGTH,
        requireLetter: true,
        requireNumber: true,
        requireSpecialChar: true,
      },
      errors: result.errors,
    });
  }
}

/**
 * Check if a password meets the minimum requirements (quick check)
 */
export function isStrongPassword(password: string): boolean {
  return validatePasswordStrength(password).isValid;
}

/**
 * Generate a random password that meets all requirements
 * Useful for password reset or initial setup
 */
export function generateRandomPassword(length: number = 12): string {
  const letters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const special = '!@#$%^&*';

  // Ensure at least one of each required type
  let password = '';
  password += letters[Math.floor(Math.random() * letters.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += special[Math.floor(Math.random() * special.length)];

  // Fill the rest with random characters from all types
  const allChars = letters + numbers + special;
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }

  // Shuffle the password
  return password
    .split('')
    .sort(() => Math.random() - 0.5)
    .join('');
}
