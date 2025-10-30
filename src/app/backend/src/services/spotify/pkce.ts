import { createHash, randomBytes } from 'crypto';

/**
 * Generate a code verifier for PKCE (Proof Key for Code Exchange)
 * Should be a cryptographically secure random string between 43-128 characters
 */
export function generateCodeVerifier(): string {
  const verifier = randomBytes(32).toString('base64url');
  return verifier;
}

/**
 * Generate a code challenge from a code verifier using SHA256
 */
export function generateCodeChallenge(verifier: string): string {
  const hash = createHash('sha256').update(verifier).digest('base64url');
  return hash;
}

/**
 * Validate that a code verifier meets PKCE requirements
 * - Must be between 43 and 128 characters
 * - Must contain only ASCII letters, digits, and the characters -._~
 */
export function validateCodeVerifier(verifier: string): boolean {
  if (verifier.length < 43 || verifier.length > 128) {
    return false;
  }

  // Check for valid characters only (RFC 7636)
  const validChars = /^[A-Za-z0-9\-._~]+$/;
  return validChars.test(verifier);
}
