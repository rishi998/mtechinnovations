import { Controller, Post, Get, Put, Body, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UpdateAddressesDto } from './dto/update-addresses.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { UserDocument } from '../users/schemas/user.schema';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async profile(@CurrentUser() user: UserDocument) {
    return this.authService.getProfile(String(user._id));
  }

  @Put('addresses')
  @UseGuards(JwtAuthGuard)
  async updateAddresses(
    @CurrentUser() user: UserDocument,
    @Body() dto: UpdateAddressesDto,
  ) {
    return this.authService.updateAddresses(String(user._id), dto);
  }
}
