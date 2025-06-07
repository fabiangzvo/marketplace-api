import {
  Injectable,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CreateProductDto } from './dto/create-product.dto';
import { QueryProductDto } from './dto/query-product.dto';
import { Product } from './entities/product.entity';
import { User, UserRole } from '../users/entities/user.entity';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async create(
    createProductDto: CreateProductDto,
    user: User,
  ): Promise<Product> {
    if (user.role !== UserRole.SELLER)
      throw new ForbiddenException('only sellers can create products');

    const existingSku = await this.productRepository.findOne({
      where: { sku: createProductDto.sku.toUpperCase() },
    });

    if (existingSku) throw new BadRequestException('El SKU ya existe');

    const product = this.productRepository.create({
      ...createProductDto,
      seller: user,
    });

    return await this.productRepository.save(product);
  }

  async findAll(queryDto: QueryProductDto, user?: User) {
    const {
      page = 1,
      limit = 10,
      search,
      minPrice,
      maxPrice,
      sortBy,
      order,
    } = queryDto;

    const queryBuilder = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.seller', 'seller');

    if (search)
      queryBuilder.andWhere(
        '(LOWER(product.name) LIKE LOWER(:search) OR LOWER(product.sku) LIKE LOWER(:search))',
        { search: `%${search}%` },
      );

    if (minPrice !== undefined)
      queryBuilder.andWhere('product.price >= :minPrice', { minPrice });

    if (maxPrice !== undefined)
      queryBuilder.andWhere('product.price <= :maxPrice', { maxPrice });

    if (user && user.role === UserRole.SELLER)
      queryBuilder.andWhere('product.seller = :userId', { userId: user.id });

    queryBuilder.orderBy(`product.${sortBy}`, order);

    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    const [products, total] = await queryBuilder.getManyAndCount();

    return {
      data: products,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findBySeller(sellerId: string, queryDto: QueryProductDto) {
    const { page = 1, limit = 10, sortBy, order } = queryDto;

    const queryBuilder = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.seller', 'seller')
      .where('seller.id = :sellerId', { sellerId });

    queryBuilder.orderBy(`product.${sortBy}`, order);

    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    const [products, total] = await queryBuilder.getManyAndCount();

    return {
      data: products,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async remove(id: string, user: User): Promise<void> {
    if (user.role !== UserRole.SELLER) {
      throw new ForbiddenException('only sellers can delete products');
    }

    const product = await this.productRepository.findOne({
      where: { id },
      relations: ['seller'],
    });

    if (!product) {
      throw new BadRequestException('product not found');
    }

    if (product.seller.id !== user.id) {
      throw new ForbiddenException('you can only delete your own products');
    }

    await this.productRepository.delete(id);
  }
}
