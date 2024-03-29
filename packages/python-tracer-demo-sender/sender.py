import sys
sys.path.append('../python-tracer')

import time
import requests
from otel_tracer import OtelTracer

tracer = OtelTracer(service_name='python-tracing-demo-sender', service_version='0.0.0')
tracer.initialize()

def main():
    """
    Example creating a parent and child span, and manually calling the "end" method when done.
    """
    # Create parent span, context
    span = tracer.span("pipeline")
    context = tracer.context(span)

    # Serialize context into b3
    b3 = tracer.to_b3(context)

    print('job')
    requests.post('http://127.0.0.1:5000/job', json = { 'b3': b3 })
    print('job')
    requests.post('http://127.0.0.1:5000/job', json = { 'b3': b3 })
    print('job')
    requests.post('http://127.0.0.1:5000/job', json = { 'b3': b3 })

    span.end()
    tracer.flush()

if __name__ == '__main__':
    main()