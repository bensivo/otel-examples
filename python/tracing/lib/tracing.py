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
        self.propagator = None
    
    def initialize(self):
        self.propagator = B3SingleFormat()
        self.getter = DefaultGetter()
        self.setter = DefaultSetter()

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

    def _tracer(self): 
        return trace.get_tracer("basic")
    
    def span(self, name, parent_context = None, **kwargs):
        """
        Create a span, optionally providing a parent context to create a child span.
        If no context is given, the span is a root span.

        Args:
            name (str): Name of the span
            context (Context): Parent context, created with otelTracer.context(parent_span)
        
        Returns:
            A new span object.
        """
        return self._tracer().start_span(name, parent_context, **kwargs)

    def context(self, span, parent_context = None):
        """
        Create a context object from a span, for creating of child spans from the parent
        If no context is given, the context is copied from the root span (empty)

        Args:
            name (str): Name of the span
            context (Context): Parent context, created with otelTracer.context(parent_span)
        
        Returns:
            A new span object.
        """
        return trace.set_span_in_context(span, parent_context)

    def flush(self):
        """
        Export all pending spans now, instead of waiting for the next batch.
        """
        self.processor.force_flush()
        self.exporter.force_flush()

    def to_b3(self, context):
        """
        Serialize a context object into a single-value b3 string, for propagation
        of contexts across service boundaries.
        """
        carrier = {}
        self.propagator.inject(carrier, context=context, setter=self.setter)
        b3 = carrier['b3']
        return b3

    def from_b3(self, b3):
        """
        Deserialize a context object from a b3 string, for propagation
        of contexts across service boundaries.
        """
        carrier = {
            'b3': b3
        }
        context = self.propagator.extract(carrier, getter=self.getter)
        return context