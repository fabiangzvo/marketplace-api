import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PassportModule } from '@nestjs/passport';

import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { User, UserRole } from '../users/entities/user.entity';
import {
  UnauthorizedException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockImplementation((password: string) => password),
  compare: jest.fn().mockImplementation(() => true),
}));

const mockUser: User = {
  id: 1,
  email: 'test@example.com',
  password: 'hashed_password',
  name: 'Test User',
  createdAt: new Date(),
  updatedAt: new Date(),
  role: UserRole.SELLER,
  products: [],
};

const credentials: LoginDto = {
  email: 'test@example.com',
  password: 'test_password',
};

const mockRegisterDto: RegisterDto = {
  email: 'test@example.com',
  password: 'test_password',
  name: 'Test User',
};

const mockUserRepository = () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  count: jest.fn(),
});

describe('AuthService - Unit Tests', () => {
  let service: AuthService;
  let usersService: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        PassportModule,
        JwtModule.register({
          secret: 'test-secret',
          signOptions: { expiresIn: '30d' },
        }),
      ],
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useFactory: mockUserRepository,
        },
        {
          provide: UsersService,
          useValue: {
            findByEmail: jest.fn(),
            create: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest
              .fn()
              .mockImplementation(
                (payload: { sub: number }) => `jwt-token-${payload.sub}`,
              ),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    it('should return user without password when credentials are valid', async () => {
      jest.spyOn(usersService, 'findByEmail').mockResolvedValue(mockUser);

      const result = await service.validateUser(
        mockUser.email,
        'test_password',
      );

      expect(bcrypt.compare).toHaveBeenCalledTimes(1);
      expect(bcrypt.compare).toHaveBeenCalledWith(
        'test_password',
        mockUser.password,
      );
      expect(result).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
        createdAt: mockUser.createdAt,
        updatedAt: mockUser.updatedAt,
        role: mockUser.role,
        products: mockUser.products,
      });
    });

    it('should return null when user is not found', async () => {
      jest.spyOn(usersService, 'findByEmail').mockResolvedValue(null);

      const result = await service
        .validateUser(credentials.email, credentials.password)
        .catch((e: Error) => e);

      expect(result).toBeInstanceOf(NotFoundException);
      expect(bcrypt.compare).toHaveBeenCalledTimes(0);
    });

    it('should return null when password is invalid', async () => {
      jest.spyOn(bcrypt, 'compare').mockImplementation(() => false);
      jest.spyOn(usersService, 'findByEmail').mockResolvedValue(mockUser);

      const result = await service.validateUser(
        credentials.email,
        'wrong_password',
      );

      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('should return access token and user data when credentials are valid', async () => {
      jest.spyOn(service, 'validateUser').mockResolvedValue(mockUser);

      const result = await service.login(credentials);

      expect(result).toEqual({
        access_token: 'jwt-token-1',
        user: {
          email: 'test@example.com',
          sub: 1,
          name: 'Test User',
        },
      });
    });

    it('should throw UnauthorizedException when credentials are invalid', async () => {
      jest.spyOn(usersService, 'findByEmail').mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockImplementation(() => false);

      await expect(service.login(credentials)).rejects.toThrow(
        new UnauthorizedException('Invalid credentials'),
      );
    });

    it('should throw NotFoundException when user is not found', async () => {
      jest.spyOn(usersService, 'findByEmail').mockResolvedValue(null);

      await expect(service.login(credentials)).rejects.toThrow(
        new NotFoundException('user not found'),
      );
    });
  });

  describe('register', () => {
    it('should return access token and user data when registration is successful', async () => {
      jest.spyOn(usersService, 'findByEmail').mockResolvedValue(null);
      jest.spyOn(usersService, 'create').mockResolvedValue(mockUser);

      const result = await service.register(mockRegisterDto);

      expect(result.access_token).toEqual('jwt-token-1');
      expect(result.user).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
        createdAt: mockUser.createdAt,
        updatedAt: mockUser.updatedAt,
        role: mockUser.role,
        products: mockUser.products,
      });
    });

    it('should throw ConflictException when user email already exists', async () => {
      const conflictError = new ConflictException(
        `Email: ${mockUser.email} is already registered`,
      );
      jest.spyOn(usersService, 'create').mockRejectedValue(conflictError);

      await expect(service.register(mockRegisterDto)).rejects.toThrow(
        conflictError,
      );
    });

    it('should throw error when registration fails', async () => {
      jest
        .spyOn(usersService, 'create')
        .mockRejectedValue(new Error('Error unknown'));

      await expect(service.register(mockRegisterDto)).rejects.toThrow(
        new Error('Error al registrar usuario'),
      );
    });
  });
});
