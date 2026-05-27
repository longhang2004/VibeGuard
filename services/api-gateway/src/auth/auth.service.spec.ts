import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { User } from '../users/user.entity';
import { REDIS_CLIENT } from '../common/providers/redis.provider';
import * as bcrypt from 'bcrypt';

// Mock bcrypt
jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: Repository<User>;
  let jwtService: JwtService;

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
    sign: jest.fn(),
    verify: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
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

    service = module.get<AuthService>(AuthService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should successfully register a new user and return tokens', async () => {
      const registerDto = { email: 'test@example.com', password: 'password123' };
      const savedUser = { id: 'uuid-123', email: 'test@example.com', passwordHash: 'hashed_pw' };

      mockUserRepository.findOne.mockResolvedValue(null);
      mockUserRepository.create.mockReturnValue(savedUser);
      mockUserRepository.save.mockResolvedValue(savedUser);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_pw');

      mockJwtService.sign
        .mockReturnValueOnce('access_token_123') // 1st call: Access Token
        .mockReturnValueOnce('refresh_token_123'); // 2nd call: Refresh Token

      const result = await service.register(registerDto);

      expect(result.success).toBe(true);
      expect(result.data.accessToken).toBe('access_token_123');
      expect(result.data.refreshToken).toBe('refresh_token_123');
      expect(result.data.user.id).toBe('uuid-123');
      expect(userRepository.findOne).toHaveBeenCalledWith({ where: { email: registerDto.email } });
      expect(userRepository.create).toHaveBeenCalled();
      expect(userRepository.save).toHaveBeenCalled();
    });

    it('should throw ConflictException if email is already taken', async () => {
      const registerDto = { email: 'taken@example.com', password: 'password123' };
      mockUserRepository.findOne.mockResolvedValue({ id: 'uuid-existing' });

      await expect(service.register(registerDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    it('should successfully log in and return tokens', async () => {
      const loginDto = { email: 'test@example.com', password: 'password123' };
      const existingUser = { id: 'uuid-123', email: 'test@example.com', passwordHash: 'hashed_pw' };

      mockUserRepository.findOne.mockResolvedValue(existingUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockJwtService.sign
        .mockReturnValueOnce('access_token_123')
        .mockReturnValueOnce('refresh_token_123');

      const result = await service.login(loginDto);

      expect(result.success).toBe(true);
      expect(result.data.accessToken).toBe('access_token_123');
      expect(result.data.user.id).toBe('uuid-123');
    });

    it('should throw UnauthorizedException if user is not found', async () => {
      const loginDto = { email: 'nonexistent@example.com', password: 'password123' };
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if password is invalid', async () => {
      const loginDto = { email: 'test@example.com', password: 'wrongpassword' };
      const existingUser = { id: 'uuid-123', email: 'test@example.com', passwordHash: 'hashed_pw' };

      mockUserRepository.findOne.mockResolvedValue(existingUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refresh', () => {
    it('should return a new access token if refresh token is valid', async () => {
      const refreshDto = { refreshToken: 'valid_refresh_token' };
      const payload = { sub: 'uuid-123', email: 'test@example.com' };

      mockJwtService.verify.mockReturnValue(payload);
      mockRedis.get.mockResolvedValue(null); // not blacklisted
      mockJwtService.sign.mockReturnValue('new_access_token');

      const result = await service.refresh(refreshDto);

      expect(result.success).toBe(true);
      expect(result.data.accessToken).toBe('new_access_token');
      expect(mockRedis.get).toHaveBeenCalledWith('blacklist:valid_refresh_token');
    });

    it('should throw UnauthorizedException if refresh token is blacklisted', async () => {
      const refreshDto = { refreshToken: 'blacklisted_token' };
      const payload = { sub: 'uuid-123', email: 'test@example.com' };

      mockJwtService.verify.mockReturnValue(payload);
      mockRedis.get.mockResolvedValue('1'); // blacklisted

      await expect(service.refresh(refreshDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException with "Token is blacklisted" message', async () => {
      const refreshDto = { refreshToken: 'blacklisted_token' };
      const payload = { sub: 'uuid-123', email: 'test@example.com' };

      mockJwtService.verify.mockReturnValue(payload);
      mockRedis.get.mockResolvedValue('1');

      await expect(service.refresh(refreshDto)).rejects.toThrow('Token is blacklisted');
    });

    it('should throw UnauthorizedException if verification fails', async () => {
      const refreshDto = { refreshToken: 'invalid_token' };
      mockJwtService.verify.mockImplementation(() => {
        throw new Error('invalid signature');
      });

      await expect(service.refresh(refreshDto)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('logout', () => {
    it('should blacklist the refresh token in Redis and return success', async () => {
      const refreshDto = { refreshToken: 'logout_token' };
      const payload = { sub: 'uuid-123', email: 'test@example.com' };

      mockJwtService.verify.mockReturnValue(payload);
      mockRedis.set.mockResolvedValue('OK');

      const result = await service.logout(refreshDto);

      expect(result.success).toBe(true);
      expect(mockRedis.set).toHaveBeenCalledWith(
        'blacklist:logout_token',
        '1',
        'EX',
        604800, // 7 days in seconds
      );
    });
  });
});
