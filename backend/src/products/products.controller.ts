import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Logger,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/schemas/user.schema';

@Controller('products')
export class ProductsController {
  private readonly logger = new Logger(ProductsController.name);

  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  @Get()
  findAll() {
    this.logger.log('GET /api/products');
    return this.productsService.findAll();
  }

  /** Serve BSON-stored catalog image (Mongo); no Zoho call. */
  @Get('image/:zohoItemId')
  async streamProductImage(
    @Param('zohoItemId') zohoItemId: string,
    @Res() res: Response,
  ): Promise<void> {
    const hit = await this.productsService.getCachedImageBinary(zohoItemId);
    if (!hit) {
      res.redirect(302, ProductsService.FALLBACK_IMAGE_URL);
      return;
    }
    res.setHeader('Content-Type', hit.contentType);
    res.setHeader(
      'Cache-Control',
      'public, max-age=86400, stale-while-revalidate=604800',
    );
    res.send(hit.data);
  }

  @Get('by-mongo-id/:id')
  findOneByMongoId(@Param('id') id: string) {
    return this.productsService.findByMongoId(id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productsService.findOneWithCachedDescription(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.productsService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }
}
