import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { createProxyMiddleware, RequestHandler } from 'http-proxy-middleware';

interface ProxyRoute {
  prefix: string;
  targetEnv: string;
  defaultTarget: string;
}

@Injectable()
export class ProxyMiddleware implements NestMiddleware {
  private proxyCache: Map<string, RequestHandler> = new Map();

  private readonly routes: ProxyRoute[] = [
    {
      prefix: '/api/context',
      targetEnv: 'CONTEXT_SERVICE_URL',
      defaultTarget: 'http://context-service:3001',
    },
    {
      prefix: '/api/scanner',
      targetEnv: 'SCANNER_SERVICE_URL',
      defaultTarget: 'http://security-scanner:8080',
    },
    {
      prefix: '/api/analytics',
      targetEnv: 'ANALYTICS_SERVICE_URL',
      defaultTarget: 'http://analytics-service:3002',
    },
    {
      prefix: '/api/notifications',
      targetEnv: 'NOTIFICATION_SERVICE_URL',
      defaultTarget: 'http://notification-service:3003',
    },
  ];

  use(req: Request, res: Response, next: NextFunction) {
    const path = req.path;

    const route = this.routes.find((r) => path.startsWith(r.prefix));
    if (!route) {
      return next();
    }

    const proxy = this.getOrCreateProxy(route);
    return proxy(req, res, next);
  }

  private getOrCreateProxy(route: ProxyRoute): RequestHandler {
    const cached = this.proxyCache.get(route.prefix);
    if (cached) {
      return cached;
    }

    const target = process.env[route.targetEnv] || route.defaultTarget;

    const pathRewrite: Record<string, string> = route.prefix === '/api/context'
      ? { '^/api/context': '' }
      : { '^/api': '' };

    const proxy = createProxyMiddleware({
      target,
      changeOrigin: true,
      pathRewrite,
      on: {
        proxyReq: (proxyReq: any) => {
          // X-User-Id is already set by JwtAuthGuard on the original request headers
          const userId = proxyReq.getHeader('x-user-id');
          if (userId) {
            proxyReq.setHeader('X-User-Id', userId);
          }
        },
      },
    });

    this.proxyCache.set(route.prefix, proxy);
    return proxy;
  }
}
