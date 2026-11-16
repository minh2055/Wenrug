// Emberfall — hand-in program for make.fun best-game-01 (Node 22, stdlib only).
//
// The repository holds the game as plain static files under game/ and the
// screenshots under screenshots/. This program copies both into the output
// directory and writes /output/dossier.json with buildDossier from the
// vendored make.fun library, so the sealed scorer can check the entry
// byte for byte against what the library writes from the same files.
//
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { copyFileSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Copy a directory tree (files and subdirectories, no symlinks, no extras).
function copyTree(srcDir, destDir) {
  mkdirSync(destDir, { recursive: true });
  for (const name of readdirSync(srcDir)) {
    const src = join(srcDir, name);
    const dest = join(destDir, name);
    const info = statSync(src);
    if (info.isDirectory()) {
      copyTree(src, dest);
    } else if (info.isFile()) {
      copyFileSync(src, dest);
    }
  }
}

copyTree(join(here, 'game'), join(outDir, 'game'));
copyTree(join(here, 'screenshots'), join(outDir, 'screenshots'));

// The scorer's own caps: only text_max_bytes shapes the dossier bytes;
// the other caps refuse an entry the scorer would refuse (more than 4
// screenshots or one over 256 KiB; more than 993 entries in game/ or
// 48 MiB of game files in all, or a path under game/ over 1000 bytes).
const dossier = buildDossier(outDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});

writeFileSync(join(outDir, 'dossier.json'), dossier);
