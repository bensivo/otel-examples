import sys
sys.path.append('./')
import time
from lib.tracing import OtelTracer

tracer = OtelTracer(service_name='python-tracing-demo-basic', service_version='0.0.0')
tracer.initialize()

def main():
    """
    Example creating a parent and child span, and manually calling the "end" method when done.
    """
    pipeline_span = tracer.span("pipeline")
    pipeline_context = tracer.context(pipeline_span)

    print('job-a')
    job_a_span = tracer.span("job-a", context=pipeline_context)
    time.sleep(1)
    job_a_span.end()

    print('job-b')
    job_b_span = tracer.span("job-b", context=pipeline_context)
    time.sleep(1)
    job_b_span.end()

    print('job-c')
    job_c_span = tracer.span("job-c", context=pipeline_context)
    job_c_context = tracer.context(job_c_span, pipeline_context)

    print('task')
    task_span = tracer.span("task", context=job_c_context)
    time.sleep(1)
    task_span.end()

    print('task')
    task_span = tracer.span("task", context=job_c_context)
    time.sleep(1)
    task_span.end()

    print('task')
    task_span = tracer.span("task", context=job_c_context)
    time.sleep(1)
    task_span.end()

    job_c_span.end()
    pipeline_span.end()

    tracer.flush()


if __name__ == '__main__':
    main()