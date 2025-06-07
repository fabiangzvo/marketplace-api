import {
  Controller,
  Get,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Query,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { User } from '../users/entities/user.entity';
import { GetUser } from '../auth/get-user/get-user.decorator';
import { QueryProductDto } from './dto/query-product.dto';
import { OptionalJwtAuthGuard } from '../auth/guards/optionalJwt.guard';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard)
  create(@GetUser() user: User, @Body() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto, user);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @UseGuards(OptionalJwtAuthGuard)
  findAll(@Query() queryDto: QueryProductDto, @GetUser() user?: User) {
    return this.productsService.findAll(queryDto, user);
  }
}
