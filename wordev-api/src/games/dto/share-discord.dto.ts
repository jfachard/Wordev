import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class ShareDiscordDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  shareText!: string;
}
