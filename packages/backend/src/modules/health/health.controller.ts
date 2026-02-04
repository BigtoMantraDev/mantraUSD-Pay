import { Controller, Get } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  MemoryHealthIndicator,
} from '@nestjs/terminus';
import { ConfigService } from '@nestjs/config';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private memory: MemoryHealthIndicator,
    private configService: ConfigService,
  ) {}

  @Get()
  @HealthCheck()
  @ApiOperation({
    summary: 'Health check',
    description: 'Check service health including memory usage',
  })
  @ApiResponse({
    status: 200,
    description: 'Service is healthy',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' },
        info: { type: 'object' },
      },
    },
  })
  @ApiResponse({
    status: 503,
    description: 'Service is unhealthy',
  })
  check() {
    const memoryHeapMB = this.configService.get<number>('health.memoryHeapMB')!;
    const memoryHeapBytes = memoryHeapMB * 1024 * 1024;
    
    return this.health.check([
      // Check memory usage (heap threshold)
      // Configurable via HEALTH_MEMORY_HEAP_MB env var (default: 512MB)
      () => this.memory.checkHeap('memory_heap', memoryHeapBytes),
    ]);
  }
}
