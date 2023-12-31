# otel-examples

This repo is for my own personal experimentation and reference.

I love the standardization and compatibility provided by open telemetry, but I dislike 3 things about it:
- The OpenTelemetry APIs are incredibly complex, often overwhelming for simple use-cases
- OpenTelemetry auto-instrumentation is very "magical", as opposed to explicit
- OpenTelemetry auto-instrumentation often requires a separate dependency library for each application framework you use, increasing lock-in to that framework


The goal of this repo is to provide a reference implementation of otel logging, tracing, and metrics in each of the programming languages that I use frequently.

This implementation should be:
- Independent of any specific application framework
- Purely explicit about all actions
- Easy to understand and use for other projects



## Implemented
- Tracing
    - [x] Node.js
    - [x] Python
    - [ ] Golang
    - [ ] Java
- Logging
    - [ ] Node.js
    - [ ] Python
    - [ ] Golang
    - [ ] Java
- Metrics
    - [ ] Node.js
    - [ ] Python
    - [ ] Golang
    - [ ] Java