import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

async function bootstrap() {
  // Better Auth reads the raw body; AuthModule re-adds the JSON and form parsers elsewhere.
  const app = await NestFactory.create(AppModule, { bodyParser: false });
  app.enableShutdownHooks();
  await app.listen(process.env.PORT ?? 3001);
}
await bootstrap();
