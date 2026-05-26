import { IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RefreshDto {
  @ApiProperty({ example: 'eyJhbGciOi...', description: 'The refresh token issued during login or registration' })
  @IsNotEmpty()
  refreshToken!: string;
}
