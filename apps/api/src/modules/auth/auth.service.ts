import { Injectable, UnauthorizedException, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { User, UserRole } from './entities/user.entity';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async validateUser(email: string, password: string): Promise<User | null> {
    // Raw SQL to bypass TypeORM select:false and any ORM quirks
    const rows = await this.userRepository.query(
      `SELECT id, email, "firstName", "lastName", role, department, avatar, "isActive", "passwordHash"
       FROM users WHERE email = $1 AND "isActive" = true LIMIT 1`,
      [email],
    );
    if (!rows || rows.length === 0) return null;
    const row = rows[0];
    if (!row.passwordHash) return null;
    const isValid = await bcrypt.compare(password, row.passwordHash);
    if (!isValid) return null;
    await this.userRepository.query(
      `UPDATE users SET "lastLoginAt" = NOW() WHERE id = $1`,
      [row.id],
    );
    return row as User;
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    if (!user) throw new UnauthorizedException('Invalid email or password');
    return this.generateTokens(user);
  }

  async register(registerDto: RegisterDto) {
    const exists = await this.userRepository.findOne({ where: { email: registerDto.email } });
    if (exists) throw new ConflictException('Email already registered');

    const user = this.userRepository.create({
      ...registerDto,
      passwordHash: registerDto.password,
      role: registerDto.role || UserRole.AGENT,
    });
    await user.hashPassword();
    const saved = await this.userRepository.save(user);
    return this.generateTokens(saved);
  }

  private generateTokens(user: User) {
    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_SECRET', 'simplenow-secret-key'),
      expiresIn: this.configService.get('JWT_EXPIRY', '24h'),
    });
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_REFRESH_SECRET', 'simplenow-refresh-key'),
      expiresIn: this.configService.get('JWT_REFRESH_EXPIRY', '7d'),
    });
    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        department: user.department,
        avatar: user.avatar,
      },
    };
  }

  async getProfile(userId: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateProfile(userId: string, data: Partial<User>) {
    await this.userRepository.update(userId, data);
    return this.getProfile(userId);
  }

  async getAllUsers() {
    return this.userRepository.find({ where: { isActive: true }, order: { firstName: 'ASC' } });
  }

  async resetDemoPasswords() {
    try {
      const pwHash = await bcrypt.hash('admin123', 12);
      const demoEmails = [
        'admin@simplenow.io',
        'sarah.agent@simplenow.io',
        'james.agent@simplenow.io',
        'priya.agent@simplenow.io',
        'viewer@simplenow.io',
      ];
      // Single bulk UPDATE — bypasses ALL TypeORM hooks, stores exact hash
      const placeholders = demoEmails.map((_, i) => `$${i + 2}`).join(', ');
      const result = await this.userRepository.query(
        `UPDATE users SET "passwordHash" = $1 WHERE email IN (${placeholders})`,
        [pwHash, ...demoEmails],
      );
      const rowsUpdated: number = result?.rowCount ?? result?.[1] ?? 0;

      const user = await this.userRepository.createQueryBuilder('user')
        .addSelect('user.passwordHash')
        .where('user.email = :email', { email: 'admin@simplenow.io' })
        .getOne();

      const hashValid = user ? await bcrypt.compare('admin123', user.passwordHash) : false;
      return {
        message: 'Demo passwords reset to admin123',
        rowsUpdated,
        adminExists: !!user,
        hashPrefix: user?.passwordHash?.substring(0, 7) ?? 'NOT FOUND',
        hashValid,
      };
    } catch (err) {
      return {
        message: 'Reset failed — check DB connection',
        error: err?.message ?? String(err),
        rowsUpdated: 0,
        adminExists: false,
        hashValid: false,
      };
    }
  }

  async debugAuth() {
    try {
      const rows = await this.userRepository.query(
        `SELECT id, email, "isActive", "passwordHash",
                LEFT("passwordHash", 7) AS "hashPrefix",
                LENGTH("passwordHash") AS "hashLen"
         FROM users WHERE email = 'admin@simplenow.io' LIMIT 1`,
      );
      if (!rows || rows.length === 0) {
        return { adminExists: false, userCount: await this.userRepository.query('SELECT COUNT(*) FROM users') };
      }
      const row = rows[0];
      const hashValid = row.passwordHash ? await bcrypt.compare('admin123', row.passwordHash) : false;
      return {
        adminExists: true,
        isActive: row.isActive,
        hashPrefix: row.hashPrefix,
        hashLen: row.hashLen,
        hashValid,
        verdict: hashValid ? 'LOGIN SHOULD WORK' : 'HASH MISMATCH — call /api/auth/reset-demo',
      };
    } catch (err) {
      return { error: err?.message ?? String(err) };
    }
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'passwordHash'],
    });
    if (!user) throw new NotFoundException('User not found');
    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) throw new UnauthorizedException('Current password is incorrect');
    const newHash = await bcrypt.hash(newPassword, 12);
    await this.userRepository.update(userId, { passwordHash: newHash });
    return { message: 'Password changed successfully' };
  }
}
