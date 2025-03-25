import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TestModule } from './test/test.module';
import { ConfigModule } from './config/config.module';

@Module({
  imports: [ConfigModule, TestModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
