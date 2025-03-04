#!/bin/bash
echo "Killing any existing Vite servers..."
pkill -f "vite --port" || true
sleep 1
echo "Starting new Vite server..."
cd /home/andy/rust/payspec-monorepo/defi-relay-frontend
yarn dev &
echo "Server should be starting. Try accessing http://localhost:8081"