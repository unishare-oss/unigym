// Command api serves the Unigym API. `api migrate [up|down|status]` runs the migrations.
package main

import (
	"context"
	"errors"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"

	"github.com/unishare-oss/unigym/apps/api/internal/config"
	"github.com/unishare-oss/unigym/apps/api/internal/db"
	"github.com/unishare-oss/unigym/apps/api/internal/server"
	"github.com/unishare-oss/unigym/apps/api/internal/telemetry"
	"github.com/unishare-oss/unigym/apps/api/migrations"
)

func main() {
	log := slog.New(slog.NewJSONHandler(os.Stdout, nil))
	if err := run(log); err != nil {
		log.Error("fatal", "error", err)
		os.Exit(1)
	}
}

func run(log *slog.Logger) error {
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	cfg, err := config.Load()
	if err != nil {
		return err
	}

	if len(os.Args) > 1 && os.Args[1] == "migrate" {
		command := "up"
		if len(os.Args) > 2 {
			command = os.Args[2]
		}
		return migrations.Run(ctx, cfg.DatabaseURL, command)
	}

	shutdownTracing, tracing, err := telemetry.Start(ctx)
	if err != nil {
		return err
	}
	defer func() {
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		_ = shutdownTracing(ctx)
	}()

	pool, err := db.Connect(ctx, cfg.DatabaseURL)
	if err != nil {
		return err
	}
	defer pool.Close()

	gin.SetMode(gin.ReleaseMode)

	srv := &http.Server{
		Addr:              ":" + cfg.Port,
		Handler:           server.New(tracing, log),
		ReadHeaderTimeout: 10 * time.Second,
	}

	errs := make(chan error, 1)
	go func() { errs <- srv.ListenAndServe() }()
	log.Info("listening", "port", cfg.Port)

	select {
	case err := <-errs:
		if !errors.Is(err, http.ErrServerClosed) {
			return err
		}
	case <-ctx.Done():
	}
	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	return srv.Shutdown(shutdownCtx)
}
