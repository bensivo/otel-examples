import { Context } from "@opentelemetry/api";
import { OtelTracer } from "../lib/otel-tracer";


/**
 * Global tracer instance, so all function calls in this app can use this same object.
 * In a real application, something like a singleton implementation would be useful as a wrapper around this.
 */
const tracer = new OtelTracer('nodejs-tracing-demo', '0.0.0');
tracer.initialize();

async function main() {
    // Simulate some multi-step pipeline. 
    //   3 sequential jobs: job-a, job-b, job-c
    //      job-c includes 3 instances of a task, task-c, run in parallel
    const pipelineSpan = tracer.span('pipeline', {});
    const pipelineContext = tracer.context(pipelineSpan);

    console.log('Starting jobs')
    await jobA(pipelineContext);
    await jobB(pipelineContext);
    await jobC(pipelineContext);
    console.log('All jobs finished')

    pipelineSpan.end();


    // Make sure all our spans are exported before exiting
    await tracer.flush();
}

async function jobA(parentContext: Context) {
    // Create a child span from the given context. This span will appear as a child of span which generated parentContext
    const jobASpan = tracer.span('job-a', {}, parentContext);

    // Simulate work taking 0-1 seconds
    console.log('Starting job-a')
    await new Promise((resolve) => setTimeout(resolve, Math.random() * 1000));

    jobASpan.end();
}
async function jobB(parentContext: Context) {
    const jobBSpan = tracer.span('job-b', {}, parentContext);

    // Simulate work taking 2-3 seconds
    console.log('Starting job-b')
    await new Promise((resolve) => setTimeout(resolve, (Math.random() * 1000) + 2000));

    jobBSpan.end();
}
async function jobC(parentContext: Context) {
    const jobCSpan = tracer.span('job-c', {}, parentContext);

    // This job also has child spans, so we need to create a new context object to pass to its children
    const jobCContext = tracer.context(jobCSpan, parentContext); 

    // Wait for 3 tasks to complete, in parallel
    console.log('Starting tasks in job-c')
    await Promise.all([
        taskC(jobCContext),
        taskC(jobCContext),
        taskC(jobCContext),
    ])

    jobCSpan.end();
}
async function taskC(parentContext: Context) {
    const taskCSpan = tracer.span('task-c', {}, parentContext);

    // Simulate work taking 0-1 seconds
    console.log('Starting task-c')
    await new Promise((resolve) => setTimeout(resolve, Math.random() * 1000));

    taskCSpan.end();
}

main();