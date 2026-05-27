import { IsString, IsNotEmpty, IsArray, IsEnum, IsBoolean, IsOptional } from 'class-validator';
import { ProjectType } from '../entities/template.entity';

export class UpdateTemplateDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  techStack?: string[];

  @IsEnum(ProjectType)
  @IsOptional()
  projectType?: ProjectType;

  @IsString()
  @IsOptional()
  content?: string;

  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;

  @IsString()
  @IsNotEmpty()
  changelog!: string; // Mandatory changelog string for versioning
}
