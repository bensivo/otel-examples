from opentelemetry import trace, propagate
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.propagators.b3 import B3SingleFormat
from opentelemetry.propagators.textmap import DefaultSetter, DefaultGetter
from opentelemetry.sdk.resources import Resource
from opentelemetry.semconv.resource import ResourceAttributes

class OtelTracer():
    def __init__(self, service_name, service_version):
        self.service_name = service_name
        self.service_version = service_version
    
    def initialize(self):
        propagate.set_global_textmap(B3SingleFormat())
        PROPAGATOR = propagate.get_global_textmap()

        provider = TracerProvider(
            resource = Resource.create({
                ResourceAttributes.SERVICE_NAME: self.service_name,
                ResourceAttributes.SERVICE_VERSION: self.service_version,
            })
        )
        exporter = OTLPSpanExporter(
            endpoint="http://localhost:4318/v1/traces",
        )
        processor = BatchSpanProcessor(exporter)
        provider.add_span_processor(processor)

        trace.set_tracer_provider(provider)

        self.exporter = exporter
        self.processor = processor

    def tracer(self): 
        return trace.get_tracer("basic")
    
    def span(self, name, context = None, **kwargs):
        return self.tracer().start_span(name, context, *kwargs)

    def context(self, span, context = None):
        return trace.set_span_in_context(span, context)

    def flush(self):
        self.processor.force_flush(1000)
        self.exporter.force_flush()

    def to_b3(self, context):
        setter = DefaultSetter()
        PROPAGATOR = propagate.get_global_textmap()

        carrier = {}
        PROPAGATOR.inject(carrier, context=context, setter=setter)
        b3 = carrier['b3']
        return b3

    def from_b3(self, b3):
        getter = DefaultGetter()
        PROPAGATOR = propagate.get_global_textmap()

        carrier = {
            'b3': b3
        }
        context = PROPAGATOR.extract(carrier, getter=getter)
        return context