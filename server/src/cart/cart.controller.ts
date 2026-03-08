import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { CartService } from './cart.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserDocument } from '../users/schemas/user.schema';

@Controller('cart')
@UseGuards(JwtAuthGuard)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  getCart(@CurrentUser() user: UserDocument) {
    return this.cartService.getCart(String(user._id));
  }

  @Post('add')
  addItem(@CurrentUser() user: UserDocument, @Body() dto: AddToCartDto) {
    return this.cartService.addItem(String(user._id), dto);
  }

  @Patch('update')
  updateItem(
    @CurrentUser() user: UserDocument,
    @Body() dto: { productId: string; quantity: number },
  ) {
    return this.cartService.updateItem(String(user._id), dto.productId, {
      quantity: dto.quantity,
    });
  }

  @Delete('remove/:productId')
  removeItem(@CurrentUser() user: UserDocument, @Param('productId') productId: string) {
    return this.cartService.removeItem(String(user._id), productId);
  }
}
