import { OtelTracer } from "../lib/otel-tracer";
import axios from 'axios';

const tracer = new OtelTracer('nodejs-tracing-demo-sender', '0.0.0');
tracer.initialize();

async function main() {
    const span = tracer.span('pipeline', {});
    const context = tracer.context(span);

    console.log('Starting jobs')

    for (let i = 0; i < 3; i++) {
        // The child jobs for this demo are in another application, so instead of passing
        // the context object directly, we have to serialize it.
        //
        // We serialize the context with tracer.toB3(), and pass that along with our HTTP request.
        // 
        // NOTE: traditionally you use HTTP headers for b3, but we're using the body here to show that
        // this system is not HTTP specific, you could use any transport mechanism you wanted.
        await axios({
            method: 'POST',
            url: 'http://localhost:3000/job',
            data: {
                b3: tracer.toB3(context),
            }
        });
    }

    console.log('All jobs finished')
    span.end();

    // Make sure all our spans are exported before exiting
    await tracer.flush();
}

main();