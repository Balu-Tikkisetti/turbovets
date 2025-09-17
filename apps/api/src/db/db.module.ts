import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import config from './ormconfig';


@Global()
@Module({
  imports: [TypeOrmModule.forRoot(config)],
  providers: [],
  exports: [TypeOrmModule],
})
export class DbModule {}
