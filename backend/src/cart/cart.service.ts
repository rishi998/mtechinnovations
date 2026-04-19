import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Cart, CartDocument } from './schemas/cart.schema';
import { ProductsService } from '../products/products.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

@Injectable()
export class CartService {
  constructor(
    @InjectModel(Cart.name)
    private readonly cartModel: Model<CartDocument>,
    private readonly productsService: ProductsService,
  ) {}

  private toObjectId(id: string): Types.ObjectId {
    return new Types.ObjectId(id);
  }

  async getOrCreateCart(userId: string): Promise<CartDocument> {
    let cart = await this.cartModel
      .findOne({ userId: this.toObjectId(userId) })
      .populate('items.productId')
      .exec();
    if (!cart) {
      cart = await this.cartModel.create({
        userId: this.toObjectId(userId),
        items: [],
      });
    }
    return cart;
  }

  async addItem(userId: string, dto: AddToCartDto): Promise<CartDocument> {
    const product = await this.productsService.findOne(dto.productId);
    const pid = String(product._id);
    const cart = await this.getOrCreateCart(userId);
    const existingIndex = cart.items.findIndex(
      (i: { productId: any }) => String(i.productId?._id || i.productId) === pid,
    );
    const qty = dto.quantity ?? 1;
    if (existingIndex >= 0) {
      cart.items[existingIndex].quantity += qty;
    } else {
      cart.items.push({
        productId: product._id as any,
        quantity: qty,
      });
    }
    await cart.save();
    return this.getOrCreateCart(userId);
  }

  async updateItem(
    userId: string,
    productId: string,
    dto: UpdateCartItemDto,
  ): Promise<CartDocument> {
    const product = await this.productsService.findOne(productId);
    const pid = String(product._id);
    const cart = await this.getOrCreateCart(userId);
    const idx = cart.items.findIndex(
      (i: { productId: any }) => String(i.productId?._id || i.productId) === pid,
    );
    if (idx < 0) return cart;
    if (dto.quantity <= 0) {
      cart.items.splice(idx, 1);
    } else {
      cart.items[idx].quantity = dto.quantity;
    }
    await cart.save();
    return this.getOrCreateCart(userId);
  }

  async removeItem(userId: string, productId: string): Promise<CartDocument> {
    const product = await this.productsService.findOne(productId);
    const pid = String(product._id);
    const cart = await this.getOrCreateCart(userId);
    cart.items = cart.items.filter(
      (i: { productId: any }) => String(i.productId?._id || i.productId) !== pid,
    );
    await cart.save();
    return this.getOrCreateCart(userId);
  }

  async getCart(userId: string): Promise<CartDocument> {
    return this.getOrCreateCart(userId);
  }

  async clearCart(userId: string): Promise<CartDocument> {
    const cart = await this.getOrCreateCart(userId);
    cart.items = [];
    await cart.save();
    return this.getOrCreateCart(userId);
  }
}
