#!/usr/bin/env node
/* Regenerate public/_headers from the kit generator.
   Usage: npm run gen:headers   (also runs in `prebuild` before every build)
   Security headers and their layout live in @peakscape/site-kit/http
   renderHeaders(); site cache rules live in package.json "siteKit.headers".
   Do not hand-edit public/_headers — edit the kit or this call, re-run. */
import { spawnSync } from 'node:child_process';

const { status } = spawnSync(
  process.execPath,
  [new URL('../node_modules/.bin/site-kit', import.meta.url).pathname, 'gen-headers'],
  { stdio: 'inherit' },
);
process.exit(status ?? 1);