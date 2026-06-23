package main

import (
	"context"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/Architkumar13/services-catalog-api/internal/handler"
	"github.com/Architkumar13/services-catalog-api/internal/repository/sqlite"
	"github.com/Architkumar13/services-catalog-api/internal/service"
)

func main() {
	logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
		Level: slog.LevelInfo,
	}))

	// Configuration from environment variables.
	port := envOrDefault("PORT", "8080")
	dsn := envOrDefault("DATABASE_DSN", "services.db")
	jwtSecret := envOrDefault("JWT_SECRET", "dev-secret-change-in-production")

	if jwtSecret == "dev-secret-change-in-production" {
		logger.Warn("JWT_SECRET is using the default insecure value — set JWT_SECRET in production")
	}

	// Open the SQLite store.
	store, err := sqlite.New(dsn)
	if err != nil {
		logger.Error("failed to open database", slog.String("error", err.Error()))
		os.Exit(1)
	}
	defer store.Close()

	// Seed demo data if the database is empty.
	ctx := context.Background()
	if err := store.Seed(ctx); err != nil {
		logger.Error("failed to seed database", slog.String("error", err.Error()))
		os.Exit(1)
	}

	// Wire up application layers.
	catalog := service.New(store)
	h := handler.New(catalog, jwtSecret, logger)
	router := handler.NewRouter(h)

	// Configure the HTTP server.
	addr := fmt.Sprintf(":%s", port)
	srv := &http.Server{
		Addr:         addr,
		Handler:      router,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 30 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	// Start serving in a goroutine so we can listen for shutdown signals.
	serverErr := make(chan error, 1)
	go func() {
		logger.Info("server starting", slog.String("addr", addr))
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			serverErr <- err
		}
	}()

	// Wait for termination signal or server error.
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)

	select {
	case sig := <-quit:
		logger.Info("received shutdown signal", slog.String("signal", sig.String()))
	case err := <-serverErr:
		logger.Error("server error", slog.String("error", err.Error()))
	}

	// Graceful shutdown with a 10-second deadline.
	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := srv.Shutdown(shutdownCtx); err != nil {
		logger.Error("server shutdown error", slog.String("error", err.Error()))
		os.Exit(1)
	}

	logger.Info("server stopped gracefully")
}

// envOrDefault returns the value of the named environment variable, or
// the provided default if the variable is not set or empty.
func envOrDefault(key, def string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return def
}
