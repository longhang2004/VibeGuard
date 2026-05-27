import { IsString, IsNotEmpty, IsArray, IsEnum, IsBoolean, IsOptional } from 'class-validator';
import { ProjectType } from '../entities/template.entity';

export class CreateTemplateDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsArray()
  @IsString({ each: true })
  techStack!: string[];

  @IsEnum(ProjectType)
  projectType!: ProjectType;

  @IsString()
  @IsNotEmpty()
  content!: string;

  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;
}
