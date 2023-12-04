---
title: nestjs自定义filters和logger
date: 2023-12-04 23:21:16
tags: nestjs
categories: 后端
---

## 常见的日志库

### pino

性能高比较小的日志库

### winston

性能好而且大而全的日志库，一般用于生产。

[npm: winston](https://www.npmjs.com/package/winston)

[npm: nest-winston](https://www.npmjs.com/package/nest-winston)

winston 文件相关库

[npm: winston-daily-rotate-file](https://www.npmjs.com/package/winston-daily-rotate-file)

## filters

在 nestjs 中，filters 是用来捕获程序中发生的错误。它可以用来

- 收集错误，生成日志
- 格式化错误，返回给用户

### 内置 HTTP 异常

在@nestjs/common 中有着常用的 HttpException 来提供给开发人员使用，通过 throw new 对应的 Exception 来触发。

### 获取 request ip 地址的库

[npm: request-ip](https://www.npmjs.com/package/request-ip)

## 自定义 logger 模块和 filters

首先使用 nest cli 来创建模块

```bash
nest g mo logs
```

编写 logger 模块

```tsx
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as winston from 'winston';
import { WinstonModule, utilities } from 'nest-winston';
import 'winston-daily-rotate-file';

@Module({
  imports: [
    WinstonModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
				// 通过配置文件决定是否保存日志和日志等级
        const app = configService.get('app');
        console.log(app);
        const consoleTransPorts = new winston.transports.Console({
          format: winston.format.combine(
            winston.format.timestamp(),
            utilities.format.nestLike(),
            // winston.format.prettyPrint(),
          ),
        });

        const dailyRotateFile = new winston.transports.DailyRotateFile({
          level: app.log_level,
          dirname: 'logs',
          filename: 'application-%DATE%.log',
          datePattern: 'YYYY-MM-DD-HH',
          zippedArchive: true,
          maxSize: '20m',
          maxFiles: '14d',
          format: winston.format.combine(
            winston.format.timestamp(),
            utilities.format.nestLike(),
            // winston.format.prettyPrint(),
          ),
        });
        return {
          transports: [
            consoleTransPorts,
            ...(app.log_on ? [dailyRotateFile] : []),
          ],
        };
      },
    }),
  ],
})
export class LogsModule {}
```

在 main.ts 中替换 nest 的 log

```tsx
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

async function bootstrap() {
  ...
	// 替换log
  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));
  return await app.listen(APP.port);
}
```

运行之后会发现生效了

![Untitled](https://cdn.statically.io/gh/Lstmxx/picx-images-hosting@master/20231204/Untitled-1.2uhgo1eix6w0.png)

编写 fitlers

```tsx
// /filters/http-exception.filter.ts
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  Inject,
  LoggerService,
} from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
  ) {}
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    // const request = ctx.getRequest();

    this.logger.error(exception.message, exception.stack);

    const status = exception.getStatus();

    response.status(status).json({
      code: status,
      timestamp: new Date().toISOString(),
      message: exception.message || HttpException.name,
    });
    // throw new Error('Method not implemented.');
  }
}
```

main.ts 引入

```tsx
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { HttpExceptionFilter } from './filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {});
	// 获取logger实例
  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));
  // 增加filters
  app.useGlobalFilters(
    new HttpExceptionFilter(app.get(WINSTON_MODULE_NEST_PROVIDER)),
  );
  return await app.listen(APP.port);
}
```
