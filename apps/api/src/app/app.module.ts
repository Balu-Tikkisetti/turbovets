import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from '../user/user.module';
import { AuthModule } from '../auth/auth.module';
import { DbModule } from '../db/db.module';
import { TaskModule } from '../task/task.module';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { AnalyticsModule } from '../analytics/analytics.module';
import { DepartmentModule } from '../department/department.module';
import { StatisticsModule } from '../statistics/statistics.module';

@Module({
  imports: [
    DbModule,
    UserModule,
    TaskModule,
    AuthModule,
    AuditLogModule,
    AnalyticsModule,
    DepartmentModule,
    StatisticsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}