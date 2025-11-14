#!/bin/bash
# Cleanup script for Next.js dev server

echo "Killing existing Next.js dev processes..."
pkill -9 -f "next dev"

echo "Removing lock file..."
rm -rf .next/dev/lock

echo "Cleanup complete! You can now run 'npm run dev'"
