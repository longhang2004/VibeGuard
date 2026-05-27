import { IsString, IsNotEmpty, IsArray, IsEnum, IsOptional } from 'class-validator';
import { ProjectType } from '../entities/template.entity';

export class GenerateTemplateDto {
  @IsString()
  @IsNotEmpty()
  projectName!: string;

  @IsArray()
  @IsString({ each: true })
  techStack!: string[];

  @IsEnum(ProjectType)
  projectType!: ProjectType;

  @IsOptional()
  conventions?: any;
}
