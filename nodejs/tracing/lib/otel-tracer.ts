import { Context, SpanOptions, trace, Tracer, Span, ROOT_CONTEXT } from '@opentelemetry/api';
import { ExportResult, ExportResultCode } from '@opentelemetry/core';
import { Resource } from '@opentelemetry/resources';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { ReadableSpan, Span as SDKSpan, SpanExporter, SpanProcessor, BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';


/**
 * Wrapper class for all Otel tracing functionality.
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
        //
        // this.exporter = new DebugSpanExporter();
        // this.processor = new DebugSpanProcessor(this.exporter);

        // Use these for a real application
        // 
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

        this.sdk.start();
    }

    get tracer(): Tracer {
        return trace.getTracer(this.serviceName, this.serviceVersion);
    }

    span(name: string, options: SpanOptions, parentContext: Context = ROOT_CONTEXT): Span  {
        return this.tracer.startSpan(name, options, parentContext);
    }

    context(span: Span, parentContext: Context = ROOT_CONTEXT): Context {
        return trace.setSpan(parentContext, span);
    }

    async flush(): Promise<void> {
        await this.processor.forceFlush();
        if (this.exporter.forceFlush) {
            await this.exporter.forceFlush();
        }
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