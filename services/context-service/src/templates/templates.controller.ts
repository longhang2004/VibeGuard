import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Body, 
  Param, 
  Query, 
  Headers, 
  HttpCode, 
  HttpStatus,
  BadRequestException
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader } from '@nestjs/swagger';
import { TemplatesService } from './templates.service';
import { TemplateGeneratorService } from './template-generator.service';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';
import { GenerateTemplateDto } from './dto/generate-template.dto';
import { ProjectType } from './entities/template.entity';

@ApiTags('templates')
@Controller('templates')
export class TemplatesController {
  constructor(
    private readonly templatesService: TemplatesService,
    private readonly generatorService: TemplateGeneratorService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new context template' })
  @ApiHeader({ name: 'x-user-id', description: 'The authenticated user ID', required: true })
  @ApiResponse({ status: 201, description: 'Template successfully created.' })
  async create(
    @Body() createTemplateDto: CreateTemplateDto,
    @Headers('x-user-id') userId: string,
  ) {
    if (!userId) {
      throw new BadRequestException('User identification header (X-User-Id) is required');
    }
    const template = await this.templatesService.create(createTemplateDto, userId);
    return {
      success: true,
      data: template,
      error: null,
      meta: {},
    };
  }

  @Get()
  @ApiOperation({ summary: 'List public templates with filtering and cursor pagination' })
  @ApiHeader({ name: 'x-user-id', description: 'Optional authenticated user ID', required: false })
  async findAll(
    @Query('projectType') projectType?: ProjectType,
    @Query('techStack') techStackRaw?: string | string[],
    @Query('limit') limitRaw?: string,
    @Query('cursor') cursor?: string,
    @Headers('x-user-id') userId?: string,
  ) {
    const limit = limitRaw ? parseInt(limitRaw, 10) : 10;
    
    // Parse techStack parameter which can be a string, array, or undefined
    let techStack: string[] | undefined = undefined;
    if (techStackRaw) {
      techStack = Array.isArray(techStackRaw) 
        ? techStackRaw 
        : [techStackRaw];
    }

    const result = await this.templatesService.findAll(projectType, techStack, limit, cursor, userId);
    return {
      success: true,
      data: result.items,
      error: null,
      meta: {
        nextCursor: result.nextCursor,
        hasNextPage: result.hasNextPage,
      },
    };
  }

  @Get('trending')
  @ApiOperation({ summary: 'Get top 10 trending templates based on stars in last 7 days' })
  async findTrending() {
    const trending = await this.templatesService.findTrending();
    return {
      success: true,
      data: trending,
      error: null,
      meta: {},
    };
  }

  @Post('generate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate CLAUDE.md markdown content from techStack and conventions' })
  generate(@Body() generateDto: GenerateTemplateDto) {
    const markdown = this.generatorService.generate(
      generateDto.projectName,
      generateDto.projectType,
      generateDto.techStack,
      generateDto.conventions,
    );
    return {
      success: true,
      data: {
        content: markdown,
      },
      error: null,
      meta: {},
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get template detail with content' })
  @ApiHeader({ name: 'x-user-id', description: 'Optional authenticated user ID', required: false })
  async findOne(
    @Param('id') id: string,
    @Headers('x-user-id') userId?: string,
  ) {
    const template = await this.templatesService.findOne(id, userId);
    return {
      success: true,
      data: template,
      error: null,
      meta: {},
    };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update template content (Owner only)' })
  @ApiHeader({ name: 'x-user-id', description: 'The authenticated owner ID', required: true })
  async update(
    @Param('id') id: string,
    @Body() updateTemplateDto: UpdateTemplateDto,
    @Headers('x-user-id') userId: string,
  ) {
    if (!userId) {
      throw new BadRequestException('User identification header (X-User-Id) is required');
    }
    const template = await this.templatesService.update(id, updateTemplateDto, userId);
    return {
      success: true,
      data: template,
      error: null,
      meta: {},
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete template (Owner only)' })
  @ApiHeader({ name: 'x-user-id', description: 'The authenticated owner ID', required: true })
  async remove(
    @Param('id') id: string,
    @Headers('x-user-id') userId: string,
  ) {
    if (!userId) {
      throw new BadRequestException('User identification header (X-User-Id) is required');
    }
    const result = await this.templatesService.remove(id, userId);
    return {
      success: true,
      data: result,
      error: null,
      meta: {},
    };
  }

  @Get(':id/versions')
  @ApiOperation({ summary: 'List all versions for a template' })
  async findVersions(@Param('id') id: string) {
    const versions = await this.templatesService.findVersions(id);
    return {
      success: true,
      data: versions,
      error: null,
      meta: {},
    };
  }

  @Get(':id/versions/:version')
  @ApiOperation({ summary: 'Get template content at a specific version' })
  async findVersionContent(
    @Param('id') id: string,
    @Param('version') version: string,
  ) {
    const content = await this.templatesService.findVersionContent(id, version);
    return {
      success: true,
      data: content,
      error: null,
      meta: {},
    };
  }

  @Post(':id/star')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Star a template' })
  @ApiHeader({ name: 'x-user-id', description: 'The authenticated user ID', required: true })
  async star(
    @Param('id') id: string,
    @Headers('x-user-id') userId: string,
  ) {
    if (!userId) {
      throw new BadRequestException('User identification header (X-User-Id) is required');
    }
    const result = await this.templatesService.star(id, userId);
    return {
      success: true,
      data: result,
      error: null,
      meta: {},
    };
  }

  @Delete(':id/star')
  @ApiOperation({ summary: 'Unstar a template' })
  @ApiHeader({ name: 'x-user-id', description: 'The authenticated user ID', required: true })
  async unstar(
    @Param('id') id: string,
    @Headers('x-user-id') userId: string,
  ) {
    if (!userId) {
      throw new BadRequestException('User identification header (X-User-Id) is required');
    }
    const result = await this.templatesService.unstar(id, userId);
    return {
      success: true,
      data: result,
      error: null,
      meta: {},
    };
  }
}
