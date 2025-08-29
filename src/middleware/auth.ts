import { NextRequest } from 'next/server';
import { headers } from 'next/headers';

/**
 * Authentication middleware for API routes
 * Provides security layers for sensitive endpoints
 */

export interface AuthContext {
  isAuthenticated: boolean;
  userId?: string;
  sessionId?: string;
}

/**
 * Simple API key authentication
 * In production, this should use proper JWT tokens or session management
 */
export async function authenticateApiRequest(request: NextRequest): Promise<AuthContext> {
  const apiKey = request.headers.get('x-api-key');
  const authHeader = request.headers.get('authorization');
  
  // For development - simple API key check
  const validApiKey = process.env.API_SECRET_KEY || 'dev-key-othello-dojo';
  
  if (apiKey === validApiKey) {
    return {
      isAuthenticated: true,
      sessionId: 'api-session'
    };
  }
  
  // Check for Bearer token (for future JWT implementation)
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    // TODO: Implement JWT validation
    // For now, accept any bearer token in development
    if (process.env.NODE_ENV === 'development' && token) {
      return {
        isAuthenticated: true,
        sessionId: token
      };
    }
  }
  
  return {
    isAuthenticated: false
  };
}

/**
 * Rate limiting middleware
 * Prevents abuse of API endpoints
 */
const requestCounts = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 100; // requests per window
const RATE_WINDOW = 60000; // 1 minute

export function checkRateLimit(clientId: string): boolean {
  const now = Date.now();
  const clientData = requestCounts.get(clientId);
  
  if (!clientData || now > clientData.resetTime) {
    requestCounts.set(clientId, { count: 1, resetTime: now + RATE_WINDOW });
    return true;
  }
  
  if (clientData.count >= RATE_LIMIT) {
    return false;
  }
  
  clientData.count++;
  return true;
}

/**
 * Input sanitization helpers
 */
export function sanitizeGameId(gameId: string): string | null {
  // Only allow alphanumeric characters and hyphens
  if (!/^[a-zA-Z0-9-]+$/.test(gameId) || gameId.length > 50) {
    return null;
  }
  return gameId;
}

export function sanitizeInput<T>(input: T, allowedFields: (keyof T)[]): Partial<T> {
  const sanitized: Partial<T> = {};
  
  for (const field of allowedFields) {
    if (input[field] !== undefined) {
      sanitized[field] = input[field];
    }
  }
  
  return sanitized;
}

/**
 * Error response helpers with no sensitive data exposure
 */
export function createSecureErrorResponse(message: string, statusCode: number = 400) {
  // Never expose internal error details in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  return new Response(
    JSON.stringify({
      error: isDevelopment ? message : 'An error occurred',
      timestamp: new Date().toISOString(),
      ...(isDevelopment && { details: message })
    }),
    {
      status: statusCode,
      headers: {
        'Content-Type': 'application/json',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block'
      }
    }
  );
}
