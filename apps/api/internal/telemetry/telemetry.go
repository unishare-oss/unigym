// Package telemetry sets up OpenTelemetry tracing over OTLP/HTTP.
package telemetry

import (
	"context"
	"net/http"
	"os"

	"go.opentelemetry.io/contrib/instrumentation/net/http/otelhttp"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracehttp"
	"go.opentelemetry.io/otel/propagation"
	sdktrace "go.opentelemetry.io/otel/sdk/trace"
)

// Start enables tracing when OTEL_EXPORTER_OTLP_ENDPOINT is set and OTEL_SDK_DISABLED is
// not true. The exporter and sampler read the standard OTEL_* variables, and the service
// name comes from OTEL_SERVICE_NAME (default unigym-api). The returned shutdown flushes
// spans; enabled reports whether tracing is on.
func Start(ctx context.Context) (shutdown func(context.Context) error, enabled bool, err error) {
	noop := func(context.Context) error { return nil }
	if os.Getenv("OTEL_EXPORTER_OTLP_ENDPOINT") == "" || os.Getenv("OTEL_SDK_DISABLED") == "true" {
		return noop, false, nil
	}
	if os.Getenv("OTEL_SERVICE_NAME") == "" {
		_ = os.Setenv("OTEL_SERVICE_NAME", "unigym-api")
	}
	exporter, err := otlptracehttp.New(ctx)
	if err != nil {
		return noop, false, err
	}
	tp := sdktrace.NewTracerProvider(sdktrace.WithBatcher(exporter))
	otel.SetTracerProvider(tp)
	otel.SetTextMapPropagator(propagation.NewCompositeTextMapPropagator(
		propagation.TraceContext{}, propagation.Baggage{},
	))
	return tp.Shutdown, true, nil
}

// HTTPClient is the client for outgoing calls: it traces them and propagates the trace.
var HTTPClient = &http.Client{Transport: otelhttp.NewTransport(http.DefaultTransport)}
