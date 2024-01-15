/*
 * This file was generated by the Gradle 'init' task.
 *
 * This generated file contains a sample Java library project to get you started.
 * For more details on building Java & JVM projects, please refer to https://docs.gradle.org/8.5/userguide/building_java_projects.html in the Gradle documentation.
 */

plugins {
    // Apply the java-library plugin for API and implementation separation.
    `java-library`
}

repositories {
    // Use Maven Central for resolving dependencies.
    mavenCentral()
}

dependencies {
    // Use JUnit Jupiter for testing.
    testImplementation(libs.junit.jupiter)

    testRuntimeOnly("org.junit.platform:junit-platform-launcher")

    // This dependency is exported to consumers, that is to say found on their compile classpath.
    api("io.opentelemetry:opentelemetry-api:1.33.0");
    api("io.opentelemetry:opentelemetry-sdk:1.33.0");
    api("io.opentelemetry:opentelemetry-sdk-metrics:1.33.0");
    api("io.opentelemetry:opentelemetry-exporter-logging:1.33.0");
    api("io.opentelemetry:opentelemetry-exporter-otlp:1.33.0");
    api("io.opentelemetry:opentelemetry-exporter-otlp-http-trace:1.14.0");
    api("io.opentelemetry.semconv:opentelemetry-semconv:1.21.0-alpha")

    // This dependency is used internally, and not exposed to consumers on their own compile classpath.
    implementation(libs.guava)
    // implementation("io.opentelemetry:opentelemetry-api:1.33.0");
    // implementation("io.opentelemetry:opentelemetry-sdk:1.33.0");
    // implementation("io.opentelemetry:opentelemetry-sdk-metrics:1.33.0");
    // implementation("io.opentelemetry:opentelemetry-exporter-logging:1.33.0");
    // implementation("io.opentelemetry:opentelemetry-exporter-otlp-http-trace:1.14.0");
    // implementation("io.opentelemetry.semconv:opentelemetry-semconv:1.21.0-alpha")

}

// Apply a specific Java toolchain to ease working on different environments.
java {
    toolchain {
        languageVersion.set(JavaLanguageVersion.of(21))
    }
}

tasks.named<Test>("test") {
    // Use JUnit Platform for unit tests.
    useJUnitPlatform()
}
