import { Context, SpanOptions, trace, Tracer, Span, ROOT_CONTEXT, propagation, defaultTextMapSetter, defaultTextMapGetter } from '@opentelemetry/api';
import { ExportResult, ExportResultCode } from '@opentelemetry/core';
import { Resource } from '@opentelemetry/resources';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { ReadableSpan, Span as SDKSpan, SpanExporter, SpanProcessor, BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { B3InjectEncoding, B3Propagator} from '@opentelemetry/propagator-b3';

/**
 * Wrapper class for all Otel tracing functionality.
 *  
 * Usage:
 *   const tracer = new OtelTracer('nodejs-tracing-demo-basic', '0.0.0');
 *   tracer.initialize();
 * 
 *   async function main() {
 *       const span = tracer.span('parent', {});
 *       const ctx = tracer.context(span);
 * 
 *       const child1Span = tracer.span('child-1', {}, ctx)
 *       child1Span.end()
 *
 *       const child2Span = tracer.span('child-2', {}, ctx)
 *       child2Span.end()
 * 
 *       span.end();
 *       
 *       await tracer.flush(); // Make sure all spans are exported before exiting
 *   }
 */
export class OtelTracer {
    sdk!: NodeSDK;
    exporter!: SpanExporter;
    processor!: SpanProcessor;

    constructor(
        private serviceName: string,
        private serviceVersion: string,
    ) { }

    initialize() {
        // Use these for debugging, learning how spans work
        // this.exporter = new DebugSpanExporter();
        // this.processor = new DebugSpanProcessor(this.exporter);

        // Use these for a real application
        this.exporter = new OTLPTraceExporter({
            url: 'http://localhost:4318/v1/traces',
            headers: {},
            concurrencyLimit: 10,
        });
        this.processor = new BatchSpanProcessor(this.exporter, {
            scheduledDelayMillis: 3000,
        });
 

        this.sdk = new NodeSDK({
            resource: new Resource({
                [SemanticResourceAttributes.SERVICE_NAME]: this.serviceName,
                [SemanticResourceAttributes.SERVICE_VERSION]: this.serviceVersion,
            }),
            traceExporter: this.exporter,
            spanProcessor: this.processor,
        });

        // Configure the default propagator. We use b3 in this lib for its simplicity.
        propagation.setGlobalPropagator(new B3Propagator({
            injectEncoding: B3InjectEncoding.SINGLE_HEADER
        }));

        this.sdk.start();

    }

    get tracer(): Tracer {
        return trace.getTracer(this.serviceName, this.serviceVersion);
    }

    /**
     * Create a new span, using a parent context if given.
     * 
     * If the parent context is not given, the new span will be a root span.
     *
     * @param name 
     * @param options 
     * @param parentContext 
     * @returns 
     */
    span(name: string, options: SpanOptions, parentContext: Context = ROOT_CONTEXT): Span  {
        return this.tracer.startSpan(name, options, parentContext);
    }

    /**
     * Create a context object from a given span, for passing to subsequent otelTracer.span() calls,
     * establishing a parent-child relationship between your spans.
     * 
     * If the parent context is not given, the new context will be for the root span.
     *
     * @param name 
     * @param options 
     * @param parentContext 
     * @returns 
     */
    context(span: Span, parentContext: Context = ROOT_CONTEXT): Context {
        return trace.setSpan(parentContext, span);
    }

    /**
     * Flush all pending spans to be processed and exported. Call before exiting your application.
     */
    async flush(): Promise<void> {
        await this.processor.forceFlush();
        if (this.exporter.forceFlush) {
            await this.exporter.forceFlush();
        }
    }

    /**
     * Serialize a span context into a b3 string representation.
     * This b3 string can be sent to downstream services using any transport mechanism.
     * 
     * Downstream services can recreate the context from OtelTracer.fromB3(), then create child spans.
     */
    static toB3(context: Context): string  {
        const carrier: any = {};

        propagation.inject(context, carrier, defaultTextMapSetter);

        console.log(JSON.stringify(carrier));
        return carrier.b3;
    }

    /**
     * Non-static overload ot OtelTracer.toB3(). For convenience.
     */
    toB3(context: Context): string {
        return OtelTracer.toB3(context);
    }

    /**
     * Deserialize a span context from a b3 string.
     * Used for propagating parent-child span relationships across services.
     */
    static fromB3(b3: string): Context  {
        const carrier = {
            b3,
        };

        const context = propagation.extract(ROOT_CONTEXT, carrier, defaultTextMapGetter);
        return context;
    }

    /**
     * Non-static overload ot OtelTracer.fromB3(). For convenience.
     */
    fromB3(b3: string): Context {
        return OtelTracer.fromB3(b3);
    }
}


/**
 * Logger inspired by NestJS. Automatically adds timestamps and class names.
 */
class Logger {
    constructor(private name: string) { }

    log(msg: string) {
        console.log(`${new Date().toISOString()} ${this.name.padEnd(20)} ${msg}`)
    }
}

/**
 * A debug implementation of the SpanExporter interface, which logs all spans to the console.
 * 
 * For actual applications, use the OTLPSpanExporter instead.
 */
class DebugSpanExporter implements SpanExporter{
    logger = new Logger(DebugSpanExporter.name);

    export(spans: ReadableSpan[], resultCallback: (result: ExportResult) => void): void {
        this.logger.log(`Exporting spans: ${spans.map(s => s.spanContext().spanId).join(',')}`);
        resultCallback({
            code: ExportResultCode.SUCCESS
        });
    }

    forceFlush(): Promise<void> {
        this.logger.log(`Flushing DebugSpanExporter`);
        return Promise.resolve();
    }

    shutdown(): Promise<void> {
        this.logger.log(`Shutting down DebugSpanExporter`);
        return Promise.resolve();
    }
}

/**
 * A debug implementation of the SpanProcessor interface, which logs all spans, and 
 * forwards each span to the exporter immediatly on being received.
 * 
 * For actual applications, use the BatchSpanExporter instead.
 */
class DebugSpanProcessor implements SpanProcessor {
    logger = new Logger(DebugSpanProcessor.name);

    constructor(private exporter: SpanExporter) {}

    /**
     * Called when any span is started.
     *
     * @param span 
     * @param parentContext 
     */
    onStart(span: SDKSpan, parentContext: Context): void {
        this.logger.log(`Span started: ${span.name} (${span.spanContext().spanId}) from parent (${span.parentSpanId})`);
    }

    /**
     * Called when any span is ended. This is where we invoke the exporter to push spans 
     * to the desired storage backend. You may also decide to add batching here, to reduce the number
     * of calls we make
     *
     * @param span 
     * @param parentContext 
     */
    onEnd(span: ReadableSpan): void {
        this.logger.log(`Span ended: ${span.name} (${span.spanContext().spanId})`);

        this.exporter.export([span], (result) => {
            this.logger.log(`Span export finished: ${span.name} (${span.spanContext().spanId})`);
        })
    }

    /**
     * Trigger export of all pending spans. Very useful for implementation that do background exports like
     * the BatchSpanProcessor.
     *
     * @param span 
     * @param parentContext 
     */
    forceFlush(): Promise<void> {
        this.logger.log(`Flushing DebugSpanProcessor`);

        return Promise.resolve();
    }

    shutdown(): Promise<void> {
        this.logger.log(`Shutting down DebugSpanProcessor`);

        return Promise.resolve();
    }
}