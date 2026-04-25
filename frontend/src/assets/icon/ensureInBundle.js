// Side effect: every file in this folder is part of the build (manifest, browserconfig, PWA, MS tiles).
import.meta.glob('./*', { eager: true, query: '?url' });
