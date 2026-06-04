import { Controller, Get } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Controller('health')
export class HealthController {
  constructor(private dataSource: DataSource) {}

  @Get()
  async check() {
    const start = Date.now();
    let database = {
      status: 'down',
      host: 'unknown',
      latency: 'N/A',
    };

    try {
      await this.dataSource.query('SELECT 1');
      database = {
        status: 'up',
        host: this.dataSource.options.type,
        latency: `${Date.now() - start}ms`,
      };
    } catch (error) {
      database = {
        ...database,
        latency: `${Date.now() - start}ms`,
      };
    }

    const memory = process.memoryUsage();

    return {
      status: database.status === 'up' ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      info: {
        uptime: `${Math.floor(process.uptime())}s`,
        memory: `${Math.round(memory.rss / 1024 / 1024)} MB RSS`,
        database,
      },
    };
  }
}
