import { Injectable, NestMiddleware } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request, Response, NextFunction } from 'express';
import * as winston from 'winston';

@Injectable()
export class LoggingMiddleware implements NestMiddleware {
  private logger: winston.Logger;

  constructor(private readonly jwtService: JwtService) {
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: [
        new winston.transports.Console()
      ],
    });
  }

  use(req: Request, res: Response, next: NextFunction) {
    const start = Date.now();
    const { method, path } = req;

    // Optional JWT parsing to extract user ID for logging
    let userId: string | undefined = undefined;
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const payload = this.jwtService.verify(token, {
          secret: process.env.GATEWAY_JWT_SECRET || 'dev_jwt_access_secret_key_vibeguard_12345',
        });
        userId = payload.sub;
      } catch {
        // Suppress logger verification errors
      }
    }

    res.on('finish', () => {
      const duration = Date.now() - start;
      const statusCode = res.statusCode;

      this.logger.info('http_request', {
        method,
        path,
        statusCode,
        responseTime: `${duration}ms`,
        userId,
      });
    });

    next();
  }
}
