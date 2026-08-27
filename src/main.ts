import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import {ValidationPipe} from "@nestjs/common";
import {DocumentBuilder, SwaggerModule} from "@nestjs/swagger";
import cookieParser from "cookie-parser";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

    app.setGlobalPrefix('api');
    app.use(cookieParser());

    app.enableCors({
        origin: process.env.FRONTEND_URL,
        credentials: true,
    });

  app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
  }));

    const swaggerConfig = new DocumentBuilder()
        .setTitle('RoadBook API')
        .setDescription('Backend API for the RoadBook application')
        .setVersion('1.0')
        .addCookieAuth('access_token', {
            type: 'apiKey',
            in: 'cookie',
        })
        .build();

    const document = SwaggerModule.createDocument(
        app,
        swaggerConfig,
    );

    SwaggerModule.setup('api/docs', app, document);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
