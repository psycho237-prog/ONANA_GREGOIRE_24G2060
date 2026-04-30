# Stage 1: Build Next.js (static export)
FROM node:20-slim AS frontend-builder
WORKDIR /app
COPY frontend-new/package*.json ./
RUN npm install --legacy-peer-deps
COPY frontend-new/ .
RUN npm run build

# Stage 2: Build Rust backend
FROM rust:1.75-slim-bookworm AS backend-builder
WORKDIR /app/backend-rust
COPY backend-rust /app/backend-rust
RUN apt-get update && apt-get install -y pkg-config libssl-dev sqlite3 libsqlite3-dev && rm -rf /var/lib/apt/lists/*
RUN cargo build --release

# Final stage
FROM python:3.11-slim-bookworm
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y libsqlite3-0 libssl3 ca-certificates curl && rm -rf /var/lib/apt/lists/*

# Install Python dependencies (no external libs needed — pure keyword-based)
# sentiment.py uses only stdlib (sys, json, re) so no pip install needed

# Copy artifacts
COPY --from=backend-builder /app/backend-rust/target/release/backend-rust /app/backend-rust/backend-rust
COPY --from=frontend-builder /app/out /app/public
COPY backend-python/sentiment.py /app/backend-python/sentiment.py
COPY scripts/courses.json /app/scripts/courses.json
COPY scripts/students.json /app/scripts/students.json

# The Rust binary uses relative paths:
#   ../scripts/courses.json   → /app/scripts/courses.json  ✓
#   ../backend-python/...     → /app/backend-python/...    ✓
# so we run the binary from /app/backend-rust/
WORKDIR /app/backend-rust

# Set environment variables
ENV STATIC_DIR=/app/public
ENV PORT=8080

EXPOSE 8080

CMD ["./backend-rust"]
