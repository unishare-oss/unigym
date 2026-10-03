import { Controller, Get } from '@nestjs/common';
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';
import { AppService } from './app.service.js';

@Controller()
@AllowAnonymous()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('health')
  getHello(): string {
    return this.appService.getHello();
  }

  /** The same check through the web app's /api proxy. */
  @Get('api/health')
  getApiHealth(): string {
    return this.appService.getHello();
  }
}
