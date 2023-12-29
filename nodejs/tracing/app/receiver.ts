import express from 'express';
import { OtelTracer } from '../lib/otel-tracer';


const tracer = new OtelTracer('nodejs-tracing-demo-receiver', '0.0.0');
tracer.initialize();

const app = express();
app.use(express.json());


app.post('/job', async (req, res) => {
    console.log(`Received job with b3 ${JSON.stringify(req.body)}`);

    // Parse the parent context from the b3 string passed in the request body.
    //
    // NOTE: normally b3 strings are sent in HTTP headers. We're using the body here to show
    // that this technique is not HTTP specific. Any transport mechanism can be used: GRPC, MQTT, Sockets.
    const parentContext = tracer.fromB3(req.body.b3);
    const span = tracer.span('job', {}, parentContext);

    // Simulate work
    await new Promise((resolve) => setTimeout(resolve, Math.random() * 1000));

    span.end();
    res.status(200).json({
        status: 'OK',
    })
})


app.listen(3000, () => {
    console.log('Listening on http://localhost:3000')
})