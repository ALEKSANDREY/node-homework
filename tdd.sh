#!/usr/bin/env bash

if [ -z "$1" ]; then
  echo "Error: Please specify a test name. Example: npm run tdd assignment5a"
  exit 1
fi

npx jest "tdd/$1.test.js"