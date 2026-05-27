import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RefreshDto {
  @ApiProperty({ example: 'eyJhbGciOi...', description: 'The refresh token issued during login or registration' })
  @IsString()
  @IsNotEmpty()
  refreshToken!: string;
}
