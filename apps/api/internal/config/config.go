// Package config reads the API's settings from the environment.
package config

import (
	"errors"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	Port        string
	DatabaseURL string
}

// Load reads .env when it exists (local runs), then the environment.
func Load() (Config, error) {
	_ = godotenv.Load()
	cfg := Config{
		Port:        getenv("PORT", "3001"),
		DatabaseURL: os.Getenv("DATABASE_URL"),
	}
	if cfg.DatabaseURL == "" {
		return cfg, errors.New("DATABASE_URL is required")
	}
	return cfg, nil
}

func getenv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
