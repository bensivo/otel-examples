import { OtelTracer } from "../lib/otel-tracer";
import axios from 'axios';

const tracer = new OtelTracer('nodejs-tracing-demo-sender', '0.0.0');
tracer.initialize();

async function main() {
    // Simulate some multi-step pipeline. 
    //   3 sequential jobs: job-a, job-b, job-c
    //      job-c includes 3 instances of a task, task-c, run in parallel
    const span = tracer.span('pipeline', {});
    const context = tracer.context(span);

    console.log('Starting jobs')

    for (let i = 0; i < 3; i++) {
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