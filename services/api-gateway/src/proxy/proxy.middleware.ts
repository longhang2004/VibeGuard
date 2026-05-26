import { Injectable, NestMiddleware } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { createProxyMiddleware } from 'http-proxy-middleware';

@Injectable()
export class ProxyMiddleware implements NestMiddleware {
  constructor(private readonly jwtService: JwtService) {}

  use(req: any, res: any, next: () => void) {
    const path = req.path;

    let target = '';
    let pathRewrite = {};

    if (path.startsWith('/api/context')) {
      target = process.env.CONTEXT_SERVICE_URL || 'http://localhost:3001';
      pathRewrite = { '^/api/context': '' }; // E.g., /api/context/templates -> /templates
    } else if (path.startsWith('/api/scanner')) {
      target = process.env.SCANNER_SERVICE_URL || 'http://localhost:8080';
      pathRewrite = { '^/api/scanner': '' }; // E.g., /api/scanner/scan -> /scan
    } else if (path.startsWith('/api/analytics')) {
      target = process.env.ANALYTICS_SERVICE_URL || 'http://localhost:3002';
      pathRewrite = { '^/api': '' }; // E.g., /api/analytics/scans/trend -> /analytics/scans/trend
    }

    if (!target) {
      return next();
    }

    // 1. Optional JWT parsing & User Identification
    let userId: string | undefined = undefined;
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const payload = this.jwtService.verify(token, {
          secret: process.env.GATEWAY_JWT_SECRET || 'dev_jwt_access_secret_key_vibeguard_12345',
        });
        userId = payload.sub;
      } catch (err) {
        // Suppress invalid token error for proxy route.
        // Downstream services will enforce authentication if X-User-Id is missing.
      }
    }

    // 2. Instantiate and run Proxy Middleware
    const proxy = createProxyMiddleware({
      target,
      changeOrigin: true,
      pathRewrite,
      on: {
        proxyReq: (proxyReq: any) => {
          if (userId) {
            proxyReq.setHeader('X-User-Id', userId);
          }
        },
      },
    });

    return proxy(req, res, next);
  }
}
