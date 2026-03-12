import { IsString, IsEnum, IsOptional, IsArray, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TicketType, TicketPriority } from '../entities/ticket.entity';

export class CreateTicketDto {
  @ApiProperty({ enum: TicketType })
  @IsEnum(TicketType)
  type: TicketType;

  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsString()
  description: string;

  @ApiProperty({ enum: TicketPriority, required: false })
  @IsOptional()
  @IsEnum(TicketPriority)
  priority?: TicketPriority;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  subcategory?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  affectedService?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  assigneeId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsArray()
  tags?: string[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  urgency?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  impact?: string;

  // Change-specific
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  changeType?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  scheduledStartAt?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  scheduledEndAt?: string;
}
