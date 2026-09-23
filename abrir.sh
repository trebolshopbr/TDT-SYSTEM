#!/bin/bash
set -e
cd "$(dirname "$0")"
exec node SYSTEM/runtime/start.mjs
