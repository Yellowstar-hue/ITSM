import { Injectable, UnauthorizedException, ConflictException, NotFoundException, Logger } from '@nestjs/common';
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
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async validateUser(email: string, password: string): Promise<User | null> {
    try {
      // Primary: findOne with explicit select (overrides select:false in TypeORM 0.3.x)
      let user = await this.userRepository.findOne({
        where: { email, isActive: true },
        select: {
          id: true, email: true, firstName: true, lastName: true,
          role: true, department: true, avatar: true, isActive: true,
          passwordHash: true,
        },
      });

      // Fallback: if TypeORM didn't return passwordHash, query with raw SQL
      // using the actual DB column name from TypeORM metadata
      if (user && !user.passwordHash) {
        this.logger.warn('findOne did not return passwordHash — falling back to raw query');
        const meta = this.userRepository.metadata;
        const col = meta.columns.find(c => c.propertyName === 'passwordHash');
        const colName = col?.databaseName ?? 'passwordHash';
        const rows = await this.userRepository.query(
          `SELECT "${colName}" AS "passwordHash" FROM "users" WHERE "id" = $1 LIMIT 1`,
          [user.id],
        );
        if (rows?.[0]) user.passwordHash = rows[0].passwordHash;
      }

      if (!user || !user.passwordHash) {
        this.logger.warn(`validateUser: user not found or no passwordHash for ${email}`);
        return null;
      }

      const isValid = await bcrypt.compare(password, user.passwordHash);
      if (!isValid) return null;

      this.userRepository.update(user.id, { lastLoginAt: new Date() }).catch(() => {});
      return user;
    } catch (err) {
      this.logger.error('validateUser error: ' + (err?.message ?? String(err)));
      return null;
    }
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
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: { id: true, email: true, firstName: true, lastName: true, role: true, department: true, title: true, phone: true, avatar: true, timezone: true, isActive: true, preferences: true, lastLoginAt: true, createdAt: true, updatedAt: true },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateProfile(userId: string, data: Partial<User>) {
    await this.userRepository.update(userId, data);
    return this.getProfile(userId);
  }

  async getAllUsers() {
    return this.userRepository.find({
      where: { isActive: true },
      order: { firstName: 'ASC' },
      select: { id: true, email: true, firstName: true, lastName: true, role: true, department: true, avatar: true, isActive: true },
    });
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
      // QueryBuilder UPDATE — TypeORM handles column name quoting
      const result = await this.userRepository
        .createQueryBuilder()
        .update(User)
        .set({ passwordHash: pwHash })
        .where('email IN (:...emails)', { emails: demoEmails })
        .execute();

      const rowsUpdated: number = result?.affected ?? 0;

      const user = await this.userRepository
        .createQueryBuilder('u')
        .addSelect('u.passwordHash')
        .where('u.email = :email', { email: 'admin@simplenow.io' })
        .getOne();

      const hashValid = user?.passwordHash ? await bcrypt.compare('admin123', user.passwordHash) : false;
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
    const results: Record<string, any> = {};
    // 1. Get actual column names from pg catalog
    try {
      const cols = await this.userRepository.query(
        `SELECT column_name FROM information_schema.columns WHERE table_name = 'users' ORDER BY ordinal_position`,
      );
      results.tableColumns = cols.map((c: any) => c.column_name);
    } catch (e) {
      results.tableColumnsError = e?.message;
    }
    // 2. Count users
    try {
      const cnt = await this.userRepository.query(`SELECT COUNT(*) AS cnt FROM users`);
      results.userCount = parseInt(cnt[0].cnt, 10);
    } catch (e) {
      results.userCountError = e?.message;
    }
    // 3. QueryBuilder fetch admin
    try {
      const user = await this.userRepository
        .createQueryBuilder('u')
        .addSelect('u.passwordHash')
        .where('u.email = :email', { email: 'admin@simplenow.io' })
        .getOne();
      if (!user) {
        results.adminExists = false;
      } else {
        const hashValid = user.passwordHash ? await bcrypt.compare('admin123', user.passwordHash) : false;
        results.adminExists = true;
        results.isActive = user.isActive;
        results.hashPrefix = user.passwordHash?.substring(0, 7) ?? 'MISSING';
        results.hashLen = user.passwordHash?.length ?? 0;
        results.hashValid = hashValid;
        results.verdict = hashValid ? 'LOGIN SHOULD WORK' : 'HASH MISMATCH — call /api/auth/reset-demo';
      }
    } catch (e) {
      results.queryBuilderError = e?.message;
    }
    return results;
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
