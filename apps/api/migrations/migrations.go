// Package migrations embeds the goose SQL migrations and runs them.
package migrations

import (
	"context"
	"database/sql"
	"embed"
	"fmt"

	_ "github.com/jackc/pgx/v5/stdlib"
	"github.com/pressly/goose/v3"
)

//go:embed *.sql
var files embed.FS

// Run applies one goose command: up, down or status.
func Run(ctx context.Context, databaseURL, command string) error {
	conn, err := sql.Open("pgx", databaseURL)
	if err != nil {
		return err
	}
	defer conn.Close()

	provider, err := goose.NewProvider(goose.DialectPostgres, conn, files)
	if err != nil {
		return err
	}
	switch command {
	case "up":
		results, err := provider.Up(ctx)
		for _, r := range results {
			fmt.Println(r)
		}
		return err
	case "down":
		result, err := provider.Down(ctx)
		if result != nil {
			fmt.Println(result)
		}
		return err
	case "status":
		statuses, err := provider.Status(ctx)
		for _, s := range statuses {
			fmt.Printf("%-10s %s\n", s.State, s.Source.Path)
		}
		return err
	default:
		return fmt.Errorf("unknown migrate command %q (want up, down or status)", command)
	}
}
