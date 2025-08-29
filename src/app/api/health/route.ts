import { NextRequest, NextResponse } from 'next/server';
import { checkDatabaseHealth } from '@/lib/database';
import { getPublicConfig } from '@/lib/config/environment';
import { checkRateLimit, createSecureErrorResponse } from '@/middleware/auth';

/**
 * GET /api/health - System health check
 * Public endpoint for monitoring system status
 */
export async function GET(request: NextRequest) {
  try {
    // Basic rate limiting even for health checks
    const clientIp = request.headers.get('x-forwarded-for') || 'unknown';
    if (!checkRateLimit(clientIp)) {
      return createSecureErrorResponse('Too many requests', 429);
    }

    const startTime = Date.now();
    
    // Check database health
    const databaseHealth = await checkDatabaseHealth();
    
    // Get safe configuration info
    const config = getPublicConfig();
    
    const healthStatus = {
      status: databaseHealth.status === 'healthy' ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      responseTime: Date.now() - startTime,
      version: process.env.npm_package_version || '1.0.0',
      environment: config.nodeEnv,
      services: {
        database: {
          status: databaseHealth.status,
          latency: databaseHealth.latency,
        },
        api: {
          status: 'healthy',
        }
      },
      // Only include safe configuration
      config: {
        rateLimits: {
          window: config.security.rateLimitWindow,
          max: config.security.rateLimitMax,
        }
      }
    };

    const statusCode = healthStatus.status === 'healthy' ? 200 : 503;
    
    return NextResponse.json(healthStatus, { status: statusCode });

  } catch (error) {
    console.error('Health check failed:', error);
    
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed'
    }, { status: 503 });
  }
}
