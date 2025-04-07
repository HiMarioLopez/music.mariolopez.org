/**
 * Rate limit configuration for different API endpoints
 *
 * Categories:
 * - EXTERNAL_API: Endpoints that call external APIs (conservative to respect external API constraints)
 * - ADMIN: Admin-only endpoints (higher limit for privileged operations)
 * - READ: Data retrieval endpoints (moderate limit for common read operations)
 * - WRITE: Data creation/update endpoints (stricter limit to prevent abuse)
 */
export const RATE_LIMITS = {
  EXTERNAL_API: { threshold: 30, windowSeconds: 60 },
  ADMIN: { threshold: 100, windowSeconds: 60 },
  READ: { threshold: 30, windowSeconds: 60 },
  WRITE: { threshold: 10, windowSeconds: 60 },
};
