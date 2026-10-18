// Package server builds the Gin router.
package server

import (
	"log/slog"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"go.opentelemetry.io/contrib/instrumentation/github.com/gin-gonic/gin/otelgin"
	"go.opentelemetry.io/otel/trace"
)

const serviceName = "unigym-api"

// New returns the router. With tracing on, every request except /health gets a server
// span and one JSON log line carrying its trace and span ids.
func New(tracing bool, log *slog.Logger) *gin.Engine {
	r := gin.New()
	r.Use(gin.Recovery())
	if tracing {
		r.Use(
			otelgin.Middleware(serviceName,
				otelgin.WithGinFilter(func(c *gin.Context) bool { return c.Request.URL.Path != "/health" }),
				otelgin.WithSpanNameFormatter(func(c *gin.Context) string {
					return c.Request.Method + " " + route(c)
				}),
			),
			requestLog(log),
		)
	}

	r.GET("/health", health)
	// The same check through the web app's /api proxy.
	r.GET("/api/health", health)
	return r
}

func health(c *gin.Context) {
	c.String(http.StatusOK, "ok")
}

func route(c *gin.Context) string {
	if p := c.FullPath(); p != "" {
		return p
	}
	return "unmatched"
}

func requestLog(log *slog.Logger) gin.HandlerFunc {
	return func(c *gin.Context) {
		if c.Request.URL.Path == "/health" {
			c.Next()
			return
		}
		started := time.Now()
		c.Next()
		span := trace.SpanContextFromContext(c.Request.Context())
		log.Info("",
			"event", "http.request.completed",
			"service", serviceName,
			"route", route(c),
			"method", c.Request.Method,
			"status_code", c.Writer.Status(),
			"duration_ms", time.Since(started).Milliseconds(),
			"trace_id", span.TraceID().String(),
			"span_id", span.SpanID().String(),
		)
	}
}
