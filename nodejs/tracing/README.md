# Node.js Tracing demo


### How to run the demo

``` bash
# Spin up jaeger
docker-compose up -d

# Install deps
npm i

# Run the basic tracing app
npx ts-node ./app/basic.ts

# Run in 2 terminals
npx ts-node ./app/receiver.ts
npx ts-node ./app/sender.ts
```

Then go to http://localhost:16686 to see the traces in the jaeger ui.


Basic demo:
![Alt text](jaeger-basic.png)

Sender-Receiver demo:
![Alt text](jaeger-sender-receiver.png)