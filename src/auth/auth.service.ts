import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { User } from '../users/entities/user.entity';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(
    email: string,
    password: string,
  ): Promise<Omit<User, 'password'> | null> {
    const user = await this.usersService.findByEmail(email);

    if (!user) throw new NotFoundException('user not found');

    if (await bcrypt.compare(password, user.password)) {
      const { password: _, ...result } = user;

      return result;
    }

    return null;
  }

  async login(user: LoginDto) {
    const validateUser = await this.validateUser(user.email, user.password);

    if (!validateUser) throw new UnauthorizedException('Invalid credentials');

    const payload = {
      email: validateUser.email,
      sub: validateUser.id,
      name: validateUser.name,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: payload,
    };
  }

  async register(
    registerDto: RegisterDto,
  ): Promise<{ access_token: string; user: Omit<User, 'password'> }> {
    try {
      const newUser = await this.usersService.create(registerDto);

      const { password: _, ...userWithoutPassword } = newUser;

      const payload = {
        email: newUser.email,
        sub: newUser.id,
        name: newUser.name,
      };

      return {
        access_token: this.jwtService.sign(payload),
        user: userWithoutPassword,
      };
    } catch (error) {
      if (error instanceof ConflictException) throw error;

      throw new Error('Error al registrar usuario');
    }
  }
}
