#!/usr/bin/env node
// scripts/log-rotate.mjs — Vite stdio capture with daily rotation (#332).
//
// Usage:
//   LOG_FILE=/path/to/log node scripts/log-rotate.mjs <cmd> [args...]
//
// When LOG_FILE is set, spawns <cmd> and pipes its stdout+stderr through
// rotating-file-stream (interval=1d, maxFiles=7, gzip). When unset, it
// passes through to the parent's stdio with no rotation — behavior is
// indistinguishable from running <cmd> directly. This means it's safe to
// adopt before the companion services.sh transition PR sets LOG_FILE.

import { spawn } from 'node:child_process';
import { dirname, basename } from 'node:path';

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('usage: log-rotate.mjs <cmd> [args...]');
  process.exit(2);
}
const [cmd, ...cmdArgs] = args;

const logFile = process.env.LOG_FILE;

if (!logFile) {
  // Passthrough — no rotation, no extra deps loaded.
  const child = spawn(cmd, cmdArgs, { stdio: 'inherit' });
  child.on('exit', (code) => process.exit(code ?? 0));
  process.on('SIGINT', () => child.kill('SIGINT'));
  process.on('SIGTERM', () => child.kill('SIGTERM'));
} else {
  // Daily rotation, keep 7 files, gzip rotated. The stream's bookkeeping
  // (which file is current vs. rotated) lives in the rotating-file-stream
  // module — we just write to it.
  const { createStream } = await import('rotating-file-stream');
  const stream = createStream(basename(logFile), {
    interval: '1d',
    maxFiles: 7,
    path: dirname(logFile),
    compress: 'gzip',
  });

  const child = spawn(cmd, cmdArgs, { stdio: ['inherit', 'pipe', 'pipe'] });

  // Mirror to both the rotated file and the parent's stdio so dev users
  // still see live output in the terminal.
  child.stdout.pipe(stream, { end: false });
  child.stderr.pipe(stream, { end: false });
  child.stdout.pipe(process.stdout);
  child.stderr.pipe(process.stderr);

  child.on('exit', (code) => {
    stream.end();
    process.exit(code ?? 0);
  });
  process.on('SIGINT', () => child.kill('SIGINT'));
  process.on('SIGTERM', () => child.kill('SIGTERM'));
}
