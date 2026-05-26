import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import Redis from 'ioredis';
import { User } from '../users/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';

@Injectable()
export class AuthService {
  private redis: Redis;

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {
    this.redis = new Redis({
      host: process.env.GATEWAY_REDIS_HOST || 'localhost',
      port: parseInt(process.env.GATEWAY_REDIS_PORT || '6379', 10),
    });
  }

  // Helper method to set custom Redis client in tests
  setRedisClient(redisClient: Redis) {
    this.redis = redisClient;
  }

  async register(registerDto: RegisterDto) {
    const { email, password } = registerDto;

    const existingUser = await this.userRepository.findOne({ where: { email } });
    if (existingUser) {
      throw new ConflictException('Email already in use');
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = this.userRepository.create({
      email,
      passwordHash,
    });

    await this.userRepository.save(user);

    const tokens = this.generateTokens(user.id, user.email);

    return {
      success: true,
      data: {
        ...tokens,
        user: {
          id: user.id,
          email: user.email,
        },
      },
      error: null,
      meta: {},
    };
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = this.generateTokens(user.id, user.email);

    return {
      success: true,
      data: {
        ...tokens,
        user: {
          id: user.id,
          email: user.email,
        },
      },
      error: null,
      meta: {},
    };
  }

  async refresh(refreshDto: RefreshDto) {
    const { refreshToken } = refreshDto;

    try {
      // 1. Verify token signature
      const payload = this.jwtService.verify(refreshToken, {
        secret: process.env.GATEWAY_JWT_REFRESH_SECRET || 'dev_jwt_refresh_secret_key_vibeguard_67890',
      });

      // 2. Check blacklist in Redis
      const isBlacklisted = await this.redis.get(`blacklist:${refreshToken}`);
      if (isBlacklisted) {
        throw new UnauthorizedException('Token is blacklisted');
      }

      // 3. Generate new access token
      const accessToken = this.jwtService.sign(
        { sub: payload.sub, email: payload.email },
        {
          secret: process.env.GATEWAY_JWT_SECRET || 'dev_jwt_access_secret_key_vibeguard_12345',
          expiresIn: (process.env.GATEWAY_JWT_ACCESS_EXPIRATION || '15m') as any,
        },
      );

      return {
        success: true,
        data: {
          accessToken,
        },
        error: null,
        meta: {},
      };
    } catch (err) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(refreshDto: RefreshDto) {
    const { refreshToken } = refreshDto;

    try {
      // Verify token
      const payload = this.jwtService.verify(refreshToken, {
        secret: process.env.GATEWAY_JWT_REFRESH_SECRET || 'dev_jwt_refresh_secret_key_vibeguard_67890',
      });

      // Add to Redis blacklist (7 days TTL)
      const ttl = 7 * 24 * 60 * 60; // 7 days in seconds
      await this.redis.set(`blacklist:${refreshToken}`, '1', 'EX', ttl);

      return {
        success: true,
        data: {
          message: 'Logged out successfully',
        },
        error: null,
        meta: {},
      };
    } catch (err) {
      // Even if token is expired, we accept it as logged out
      return {
        success: true,
        data: {
          message: 'Logged out successfully',
        },
        error: null,
        meta: {},
      };
    }
  }

  private generateTokens(userId: string, email: string) {
    const payload = { sub: userId, email };

    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.GATEWAY_JWT_SECRET || 'dev_jwt_access_secret_key_vibeguard_12345',
      expiresIn: (process.env.GATEWAY_JWT_ACCESS_EXPIRATION || '15m') as any,
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.GATEWAY_JWT_REFRESH_SECRET || 'dev_jwt_refresh_secret_key_vibeguard_67890',
      expiresIn: (process.env.GATEWAY_JWT_REFRESH_EXPIRATION || '7d') as any,
    });

    return {
      accessToken,
      refreshToken,
    };
  }
}
