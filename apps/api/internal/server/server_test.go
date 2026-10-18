package server

import (
	"bytes"
	"encoding/json"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"go.opentelemetry.io/otel"
	sdktrace "go.opentelemetry.io/otel/sdk/trace"
)

func init() { gin.SetMode(gin.TestMode) }

func serve(r http.Handler, path string) *httptest.ResponseRecorder {
	w := httptest.NewRecorder()
	r.ServeHTTP(w, httptest.NewRequest(http.MethodGet, path, nil))
	return w
}

func TestHealth(t *testing.T) {
	r := New(false, slog.Default())
	for _, path := range []string{"/health", "/api/health"} {
		w := serve(r, path)
		if w.Code != http.StatusOK || w.Body.String() != "ok" {
			t.Errorf("GET %s = %d %q, want 200 ok", path, w.Code, w.Body.String())
		}
	}
	if w := serve(r, "/api/nope"); w.Code != http.StatusNotFound {
		t.Errorf("GET /api/nope = %d, want 404", w.Code)
	}
}

func TestRequestLog(t *testing.T) {
	otel.SetTracerProvider(sdktrace.NewTracerProvider())
	var buf bytes.Buffer
	r := New(true, slog.New(slog.NewJSONHandler(&buf, nil)))

	serve(r, "/health")
	if buf.Len() != 0 {
		t.Fatalf("/health was logged: %s", buf.String())
	}

	serve(r, "/api/health")
	var line map[string]any
	if err := json.Unmarshal(buf.Bytes(), &line); err != nil {
		t.Fatalf("log line is not JSON: %v: %s", err, buf.String())
	}
	want := map[string]any{
		"event":       "http.request.completed",
		"service":     "unigym-api",
		"route":       "/api/health",
		"method":      "GET",
		"status_code": float64(200),
	}
	for k, v := range want {
		if line[k] != v {
			t.Errorf("%s = %v, want %v", k, line[k], v)
		}
	}
	if id, _ := line["trace_id"].(string); len(id) != 32 || id == "00000000000000000000000000000000" {
		t.Errorf("trace_id = %v, want a real trace id", line["trace_id"])
	}

	buf.Reset()
	serve(r, "/api/nope")
	if err := json.Unmarshal(buf.Bytes(), &line); err != nil || line["route"] != "unmatched" {
		t.Errorf("unknown route logged as %v, want unmatched", line["route"])
	}
}
