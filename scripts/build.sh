#!/bin/bash

# Vault Recall - Build Script
# Run this after implementing each phase to verify build and lint

set -e  # Exit on any error

echo "================================"
echo "Vault Recall Build Script"
echo "================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Navigate to project root (parent of scripts directory)
cd "$(dirname "$0")/.."

echo "Step 1: Installing dependencies..."
npm install --silent
echo -e "${GREEN}✓ Dependencies installed${NC}"
echo ""

echo "Step 2: Running linter..."
if npm run lint 2>&1; then
    echo -e "${GREEN}✓ Lint passed${NC}"
else
    echo -e "${RED}✗ Lint failed${NC}"
    exit 1
fi
echo ""

echo "Step 3: Running TypeScript build..."
if npm run build 2>&1; then
    echo -e "${GREEN}✓ Build succeeded${NC}"
else
    echo -e "${RED}✗ Build failed${NC}"
    exit 1
fi
echo ""

echo "Step 4: Verifying output files..."
if [ -f "main.js" ] && [ -f "manifest.json" ]; then
    echo -e "${GREEN}✓ Output files exist (main.js, manifest.json)${NC}"
else
    echo -e "${RED}✗ Output files missing${NC}"
    exit 1
fi
echo ""

echo "================================"
echo -e "${GREEN}All checks passed!${NC}"
echo "================================"
echo ""
echo "To test in Obsidian:"
echo "  1. Copy main.js, manifest.json, styles.css to:"
echo "     <vault>/.obsidian/plugins/vault-recall/"
echo "  2. Reload Obsidian or enable the plugin"
echo ""
