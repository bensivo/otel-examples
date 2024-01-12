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
    - [x] Java
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

## Usage:
First install all the following dependencies:
- node.js 20+
- python 3.10+
- java 21+
- gradle
- docker
- task (Taskfile.dev)

Run through all tracing demos. We use Taskfile.dev for running commands, because of its simplicity:
```bash
task jaeger:start

# Jaeger's Ui is available in your browser at http://localhost:16686

# Node.js, install all dependencies
task nodejs-tracer:install
task nodejs-tracer-demo-basic:install
task nodejs-tracer-demo-receiver:install
task nodejs-tracer-demo-sender:install

# Node.js, run demos. Receiver and Sender should be run in 2 different terminals
task nodejs-tracer-demo-basic:run
task nodejs-tracer-demo-receiver:run
task nodejs-tracer-demo-sender:run


# Python, install all dependencies
task python-tracer-demo-basic:install
task python-tracer-demo-receiver:install
task python-tracer-demo-sender:install

# Python, run demos. Receiver and Sender should be run in 2 different terminals
task python-tracer-demo-basic:run
task python-tracer-demo-receiver:run
task python-tracer-demo-sender:run

# Java, build lib
task java-tracer:build

# Java, run demos.
task java-tracer-demo-basic:run

```