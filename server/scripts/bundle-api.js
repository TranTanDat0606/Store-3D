const esbuild = require('esbuild');
const path = require('path');

async function build() {
  await esbuild.build({
    entryPoints: [path.join(__dirname, '..', 'api', 'server.ts')],
    bundle: true,
    platform: 'node',
    target: 'node20',
    outfile: path.join(__dirname, '..', 'api', 'server.js'),
    external: [],
    format: 'cjs',
    sourcemap: false,
    minify: false,
    logLevel: 'info',
  });
}

build().catch((e) => {
  console.error(e);
  process.exit(1);
});
