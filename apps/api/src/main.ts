import 'dotenv/config';
import { telemetry } from './telemetry.js';
import {
  context,
  propagation,
  ROOT_CONTEXT,
  SpanKind,
  SpanStatusCode,
  trace,
} from '@opentelemetry/api';
import type { Request, Response, NextFunction } from 'express';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

async function bootstrap() {
  // Better Auth reads the raw body; AuthModule re-adds the JSON and form parsers elsewhere.
  const app = await NestFactory.create(AppModule, { bodyParser: false });
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (!telemetry || req.path === '/health') return next();
    const parent = propagation.extract(ROOT_CONTEXT, req.headers);
    const span = trace.getTracer('unigym.http').startSpan(
      `HTTP ${req.method}`,
      {
        kind: SpanKind.SERVER,
        attributes: { 'http.request.method': req.method },
      },
      parent,
    );
    const started = performance.now();
    context.with(trace.setSpan(parent, span), () => {
      let finished = false;
      const finish = () => {
        if (finished) return;
        finished = true;
        const route =
          typeof req.route?.path === 'string' ? req.route.path : 'unmatched';
        span.updateName(`${req.method} ${route}`);
        span.setAttributes({
          'http.route': route,
          'http.response.status_code': res.statusCode,
        });
        if (res.statusCode >= 500 || !res.writableFinished)
          span.setStatus({ code: SpanStatusCode.ERROR });
        console.log(
          JSON.stringify({
            event: 'http.request.completed',
            service: 'unigym-api',
            route,
            method: req.method,
            status_code: res.statusCode,
            duration_ms: Math.round(performance.now() - started),
            trace_id: span.spanContext().traceId,
            span_id: span.spanContext().spanId,
          }),
        );
        span.end();
      };
      res.once('finish', finish);
      res.once('close', finish);
      next();
    });
  });
  app.enableShutdownHooks();
  await app.listen(process.env.PORT ?? 3001);
}
await bootstrap();
