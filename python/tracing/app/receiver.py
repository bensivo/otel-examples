import sys
sys.path.append('./')
from flask import Flask, request
import json
import time
from lib.tracing import OtelTracer

# provider = TracerProvider(
#     resource = Resource.create({
#         ResourceAttributes.SERVICE_NAME: 'python-tracing-demo-receiver',
#         ResourceAttributes.SERVICE_VERSION: '0.0.0',
#     })
# )
# processor = BatchSpanProcessor(OTLPSpanExporter(
#     endpoint="http://localhost:4318/v1/traces",
# ))
# provider.add_span_processor(processor)

# trace.set_tracer_provider(provider)
# tracer = trace.get_tracer("basic")

# propagate.set_global_textmap(B3SingleFormat())
# PROPAGATOR = propagate.get_global_textmap()

tracer = OtelTracer(service_name='python-tracing-demo-receiver', service_version='0.0.0')
tracer.initialize()

app = Flask(__name__)

@app.route("/job", methods=['POST'])
def job():
    data = request.get_json()

    # Deserialize context from b3
    parent_context = tracer.from_b3(data['b3'])

    # Create child span from extracted context
    # child_span = tracer.tracer.start_span("job", context=parent_context)
    child_span = tracer.span(name="job", context=parent_context)

    time.sleep(1)

    child_span.end()
    return json.dumps({
        'status': 'ok'
    })


if __name__ == '__main__':
    app.run(host='127.0.0.1', threaded=True)