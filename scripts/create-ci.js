#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

// Minimal CI workflow: lint + test + build on push to any branch, and on PRs.
const workflow = `name: CI

on:
  push:
    branches: ['*']
  pull_request:
    branches: ['*']

jobs:
  lint-test-build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'
      - name: Install deps
        run: npm ci
      - name: Lint (ESLint)
        run: npx eslint . --ext .ts,.tsx,.js,.jsx
      - name: Test (Vitest)
        run: npx vitest run --coverage
      - name: Build
        run: npm run build
`

fs.writeFileSync(path.join(process.cwd(), '.github', 'workflows', 'ci.yml'), workflow)
console.log('CI workflow created at .github/workflows/ci.yml')
