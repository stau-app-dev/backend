#!/usr/bin/env bash
set -e

# Install Firebase CLI
curl -sL https://firebase.tools | bash

# Install dependencies
cd /workspaces/$(basename "$GITHUB_REPOSITORY")
npm install

# Build once (if TypeScript)
if [ -f tsconfig.json ]; then
  npm run build || true
fi

