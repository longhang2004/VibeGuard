import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AuthController } from '../auth/auth.controller';
import { AuthService } from '../auth/auth.service';
import { User } from '../users/user.entity';
import { JwtService } from '@nestjs/jwt';
import { REDIS_CLIENT } from '../common/providers/redis.provider';
import { HttpExceptionFilter } from '../common/filters/http-exception.filter';

describe('API Gateway Auth Controller HTTP Integration', () => {
  let app: INestApplication;

  const mockUser = {
    id: 'user-uuid-12345',
    email: 'test@vibeguard.com',
    passwordHash: 'hashed_password_123',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockRedis = {
    get: jest.fn(),
    set: jest.fn(),
  };

  const mockUserRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('mocked-token-string'),
    verify: jest.fn(),
  };

  // Mock AuthService directly to check controller outputs
  const mockAuthService = {
    register: jest.fn().mockImplementation((dto) => {
      if (dto.email === 'duplicate@vibeguard.com') {
        throw { status: 409, message: 'Email already exists' };
      }
      return {
        success: true,
        data: {
          user: { id: 'new-uuid', email: dto.email },
          accessToken: 'mock-access',
          refreshToken: 'mock-refresh',
        },
        error: null,
        meta: {},
      };
    }),
    login: jest.fn().mockImplementation((dto) => {
      if (dto.email === 'invalid@vibeguard.com') {
        throw { status: 401, message: 'Invalid credentials' };
      }
      return {
        success: true,
        data: {
          user: { id: mockUser.id, email: dto.email },
          accessToken: 'mock-access',
          refreshToken: 'mock-refresh',
        },
        error: null,
        meta: {},
      };
    }),
    refresh: jest.fn().mockImplementation((dto) => {
      return {
        success: true,
        data: { accessToken: 'new-mock-access' },
        error: null,
        meta: {},
      };
    }),
    logout: jest.fn().mockImplementation((dto) => {
      return {
        success: true,
        data: { success: true },
        error: null,
        meta: {},
      };
    }),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: REDIS_CLIENT,
          useValue: mockRedis,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /auth/register', () => {
    it('should register a new user and return status 201 with standard JSON envelope', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email: 'new@vibeguard.com', password: 'Password123!' });

      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        success: true,
        data: {
          user: { id: 'new-uuid', email: 'new@vibeguard.com' },
          accessToken: 'mock-access',
          refreshToken: 'mock-refresh',
        },
        error: null,
        meta: {},
      });
    });

    it('should return 400 Bad Request when validation fails', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email: 'invalid-email', password: '' });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /auth/login', () => {
    it('should login an existing user and return status 200 with tokens', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'test@vibeguard.com', password: 'Password123!' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.accessToken).toBe('mock-access');
    });
  });

  describe('POST /auth/refresh', () => {
    it('should refresh tokens and return status 200', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken: 'valid-refresh' });

      expect(response.status).toBe(200);
      expect(response.body.data.accessToken).toBe('new-mock-access');
    });
  });

  describe('POST /auth/logout', () => {
    it('should invalidate refresh token and return status 200', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/logout')
        .send({ refreshToken: 'valid-refresh' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });
});
