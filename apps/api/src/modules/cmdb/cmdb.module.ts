import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CmdbController } from './cmdb.controller';
import { CmdbService } from './cmdb.service';
import { ConfigurationItem } from './entities/ci.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ConfigurationItem])],
  controllers: [CmdbController],
  providers: [CmdbService],
  exports: [CmdbService],
})
export class CmdbModule {}
