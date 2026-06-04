import { Body, Controller, Post, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiTags, ApiBody } from '@nestjs/swagger';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @ApiBody({ schema: { example: { email: 'user@example.com', password: 'password' } } })
  async login(@Body() req: LoginDto) {
    const user = await this.authService.validateUser(req.email, req.password);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }
    return this.authService.login(user);
  }

  @Post('register')
  @ApiBody({ schema: { example: { email: 'user@example.com', password: 'password', name: 'User Name' } } })
  async register(@Body() body: RegisterDto) {
    return this.authService.register(body);
  }
}
