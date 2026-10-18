package migrations

import (
	"context"
	"os"
	"testing"

	"github.com/jackc/pgx/v5"
)

// Needs a database: skipped when DATABASE_URL is unset.
func TestUpDropsAuthTables(t *testing.T) {
	url := os.Getenv("DATABASE_URL")
	if url == "" {
		t.Skip("DATABASE_URL not set")
	}
	ctx := context.Background()
	if err := Run(ctx, url, "up"); err != nil {
		t.Fatal(err)
	}

	conn, err := pgx.Connect(ctx, url)
	if err != nil {
		t.Fatal(err)
	}
	defer conn.Close(ctx)
	var n int
	err = conn.QueryRow(ctx, `SELECT count(*) FROM information_schema.tables
		WHERE table_schema = current_schema()
		AND table_name IN ('user', 'session', 'account', 'verification', '_prisma_migrations')`).Scan(&n)
	if err != nil {
		t.Fatal(err)
	}
	if n != 0 {
		t.Errorf("%d auth tables still exist", n)
	}
}
