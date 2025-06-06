import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { UsersService } from './users.service';
import { User, UserRole } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockImplementation((password: string) => password),
  compare: jest.fn().mockImplementation(() => true),
}));

const mockUserRepository = () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  count: jest.fn(),
});

type MockRepository = Record<keyof Repository<User>, jest.Mock>;

describe('UsersService - Unit Tests', () => {
  let service: UsersService;
  let repository: MockRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useFactory: mockUserRepository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repository = module.get<MockRepository>(getRepositoryToken(User));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findOne', () => {
    it('should return an user', async () => {
      const user: Omit<User, 'password' | 'products'> = {
        id: 1,
        name: 'John',
        email: 'john@test.com',
        createdAt: new Date(),
        updatedAt: new Date(),
        role: UserRole.SELLER,
      };

      repository.findOne.mockResolvedValue(user);

      const result = await service.findOne(1);

      expect(repository.findOne).toHaveBeenCalledTimes(1);
      expect(result).toEqual(user);
    });

    it('should throw NotFoundException when user not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findOne(1)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(1)).rejects.toThrow('user not found');
    });
  });

  describe('findByEmail', () => {
    it('should return a user by email', async () => {
      const user: Omit<User, 'products'> = {
        id: 1,
        name: 'John',
        email: 'john@test.com',
        password: '123',
        createdAt: new Date(),
        updatedAt: new Date(),
        role: UserRole.SELLER,
      };

      repository.findOne.mockResolvedValue(user);

      const result = await service.findByEmail(user.email);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { email: user.email },
      });
      expect(result).toEqual(user);
    });

    it('should return null when user not found', async () => {
      repository.findOne.mockResolvedValue(null);

      const result = await service.findByEmail('john@test.com');

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create and return a new user', async () => {
      const userData: CreateUserDto = {
        name: 'John',
        email: 'john@test.com',
        password: '123',
      };
      const createdUser = { id: 1, ...userData };

      repository.create.mockReturnValue(createdUser);
      repository.save.mockResolvedValue(createdUser);
      repository.findOne.mockResolvedValue(null);

      const result = await service.create(userData);

      expect(repository.findOne).toHaveBeenCalledTimes(1);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { email: userData.email },
      });
      expect(bcrypt.hash).toHaveBeenCalledWith(userData.password, 12);
      expect(repository.create).toHaveBeenCalledWith(userData);
      expect(repository.save).toHaveBeenCalledWith(createdUser);
      expect(result).toEqual(createdUser);
    });

    it('should throw ConflictException when email is already registered', async () => {
      const userData: CreateUserDto = {
        name: 'John',
        email: 'john@test.com',
        password: '123',
      };
      const existingUser = { id: 1, ...userData };

      repository.findOne.mockResolvedValue(existingUser);

      await expect(service.create(userData)).rejects.toThrow(ConflictException);
      await expect(service.create(userData)).rejects.toThrow(
        `Email: ${userData.email} is already registered`,
      );
    });
  });

  describe('update', () => {
    it('should update and return the user', async () => {
      const userId = 1;
      const updateData: UpdateUserDto = { name: 'John Updated' };
      const initialUser: Omit<User, 'password' | 'products'> = {
        id: 1,
        name: 'John Doe',
        email: 'john@test.com',
        createdAt: new Date(),
        updatedAt: new Date(),
        role: UserRole.SELLER,
      };
      const updatedUser: Omit<User, 'password' | 'products'> = {
        id: 1,
        name: 'John Updated',
        email: 'john@test.com',
        createdAt: new Date(),
        updatedAt: new Date(),
        role: UserRole.SELLER,
      };

      repository.findOne
        .mockResolvedValueOnce(initialUser)
        .mockResolvedValue(updatedUser);

      const result = await service.update(userId, updateData);

      expect(repository.update).toHaveBeenCalledWith(userId, updateData);
      expect(repository.findOne).toHaveBeenCalledTimes(2);
      expect(result).toEqual(updatedUser);
    });

    it('should allow updating email if it is not already registered', async () => {
      const userId = 1;
      const updateData: UpdateUserDto = {
        name: 'John Updated',
        email: 'john@doe.com',
      };
      const initialUser: Omit<User, 'password' | 'products'> = {
        id: 1,
        name: 'John Doe',
        email: 'john@test.com',
        createdAt: new Date(),
        updatedAt: new Date(),
        role: UserRole.SELLER,
      };

      const updatedUser: Omit<User, 'password' | 'products'> = {
        ...initialUser,
        ...updateData,
      };

      repository.findOne
        .mockResolvedValueOnce(initialUser)
        .mockResolvedValueOnce(undefined)
        .mockResolvedValue(updatedUser);

      const result = await service.update(userId, updateData);

      expect(repository.update).toHaveBeenCalledWith(userId, updateData);
      expect(repository.findOne).toHaveBeenCalledTimes(3);
      expect(result).toEqual(updatedUser);
    });

    it('should throw ConflictException if email is already registered', async () => {
      const userId = 1;
      const updateData: UpdateUserDto = {
        name: 'John Updated',
        email: 'beto@test.com',
      };
      const initialUser: Omit<User, 'password'> = {
        id: 1,
        name: 'John Doe',
        email: 'john@test.com',
        createdAt: new Date(),
        updatedAt: new Date(),
        role: UserRole.SELLER,
        products: [],
      };

      const existingUser: Omit<User, 'password'> = {
        id: 2,
        name: 'Beto Doe',
        email: 'beto@test.com',
        createdAt: new Date(),
        updatedAt: new Date(),
        role: UserRole.SELLER,
        products: [],
      };

      repository.findOne
        .mockResolvedValueOnce(initialUser)
        .mockResolvedValueOnce(existingUser);

      await expect(service.update(userId, updateData)).rejects.toThrow(
        new ConflictException(
          `Email: ${updateData.email} is already registered`,
        ),
      );
      expect(repository.findOne).toHaveBeenCalledTimes(2);
    });
  });
});
