import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsInt,
  Min,
  MaxLength,
  MinLength,
  Matches,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(255)
  @Transform(({ value }: { value: string }) => value?.trim())
  name: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(100)
  @Matches(/^[A-Z0-9-_]+$/, {
    message:
      'SKU must contain only uppercase letters, numbers, hyphens, and underscores',
  })
  @Transform(({ value }: { value: string }) => value?.toUpperCase().trim())
  sku: string;

  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  @Type(() => Number)
  price: number;

  @IsInt()
  @IsNotEmpty()
  @Min(0)
  @Type(() => Number)
  quantity: number = 0;
}
