import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { build, transform } from 'esbuild';
import { compile as compileSvelte } from 'svelte/compiler';
import { compile as compileMarkdown } from 'mdsvex';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(process.argv[2] || process.cwd());
const kb = path.join(repo, 'support-kb');
const src = path.join(kb, 'src');
const out = path.join(repo, 'rendered');
const warnings = new Set();
const posix = (value) => value.replaceAll('\\', '/');

async function filesUnder(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  return (await Promise.all(entries.map((entry) => entry.isDirectory()
    ? filesUnder(path.join(directory, entry.name))
    : [path.join(directory, entry.name)]))).flat().sort();
}

const pageFiles = (await filesUnder(path.join(src, 'routes/kb'))).filter((p) => p.endsWith('+page.svx'));
const tenantFiles = (await fs.readdir(path.join(src, 'lib/data/tenants'))).filter((p) => p.endsWith('.json')).sort();

function expandGlobs(code) {
  const imports = [];
  const replaced = code.replace(/import\.meta\.glob\(\s*(['"])([^'"]+)\1\s*,\s*\{[^}]*\}\s*\)/g, (match, _quote, pattern) => {
    let files;
    if (pattern === '/src/lib/data/tenants/*.json') {
      files = tenantFiles.map((file) => path.join(src, 'lib/data/tenants', file));
    } else if (pattern === '/src/routes/kb/*/**/+page.svx') {
      files = pageFiles.filter((file) => file !== path.join(src, 'routes/kb/+page.svx'));
    } else {
      throw new Error(`Unsupported source glob: ${pattern}`);
    }
    return '{' + files.map((file) => {
      const name = `__glob_${imports.length}`;
      const defaultImport = /import:\s*['"]default['"]/.test(match);
      imports.push(`import ${defaultImport ? name : `* as ${name}`} from ${JSON.stringify(posix(file))};`);
      return `${JSON.stringify('/' + posix(path.relative(kb, file)))}: ${name}`;
    }).join(',') + '}';
  });
  return imports.join('\n') + '\n' + replaced;
}

function sourcePlugin(generate) {
  return {
    name: 'support-kb-source',
    setup(builder) {
      builder.onResolve({ filter: /^#lib\// }, (args) => {
        const mapped = path.join(src, 'lib', args.path.slice(5));
        return { path: path.extname(mapped) ? mapped : mapped + '.ts' };
      });
      builder.onLoad({ filter: /\.(svx|svelte)$/ }, async ({ path: filename }) => {
        let source = await fs.readFile(filename, 'utf8');
        if (filename.endsWith('.svx')) {
          source = (await compileMarkdown(source, {
            filename,
            layout: { runbook: posix(path.join(src, 'lib/layouts/runbook.svelte')) },
          })).code;
        }
        const compiled = compileSvelte(source, { filename, generate, css: 'injected', dev: false });
        for (const warning of compiled.warnings) warnings.add(`${path.relative(kb, filename)}: ${warning.code}: ${warning.message}`);
        return { contents: expandGlobs(compiled.js.code), loader: 'js', resolveDir: path.dirname(filename) };
      });
      builder.onLoad({ filter: /\.ts$/ }, async ({ path: filename }) => {
        const source = await transform(await fs.readFile(filename, 'utf8'), { loader: 'ts', format: 'esm', target: 'es2022' });
        return { contents: expandGlobs(source.code), loader: 'js', resolveDir: path.dirname(filename) };
      });
    },
  };
}

await fs.mkdir(out, { recursive: true });
const common = {
  bundle: true,
  format: 'esm',
  target: 'es2022',
  logLevel: 'silent',
  nodePaths: [path.join(here, 'node_modules')],
};

const serverEntry = `
import { render } from 'svelte/server';
${pageFiles.map((file, i) => `import Page${i}, * as Meta${i} from ${JSON.stringify(posix(file))};`).join('\n')}
export const pages = [${pageFiles.map((file, i) => `{ route: ${JSON.stringify('/' + posix(path.relative(path.join(src, 'routes'), path.dirname(file))))}, component: Page${i}, metadata: Meta${i}.metadata }`).join(',')}];
export { render };
`;
const buildDir = path.join(repo, '.build');
await fs.mkdir(buildDir, { recursive: true });
const serverBundle = path.join(buildDir, 'server.mjs');
await build({ ...common, stdin: { contents: serverEntry, resolveDir: here, sourcefile: 'kb-server-entry.js' },
  platform: 'node', plugins: [sourcePlugin('server')], outfile: serverBundle });

const { pages, render } = await import(pathToFileURL(serverBundle).href + '?build=' + Date.now());
const outputs = [];
for (const page of pages) {
  const sourceFile = path.join(src, 'routes', page.route.slice(1), '+page.svx');
  const client = await build({ ...common,
    stdin: { contents: `import { hydrate } from 'svelte'; import Page from ${JSON.stringify(posix(sourceFile))}; hydrate(Page, { target: document.getElementById('app') }); window.__kbReady = true;`, resolveDir: here, sourcefile: 'kb-client-entry.js' },
    platform: 'browser', conditions: ['browser'], plugins: [sourcePlugin('client')], write: false, minify: true });
  const rendered = render(page.component);
  const snapshot = '<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">' +
    rendered.head + '</head><body><div id="app">' + rendered.body + '</div><script type="module">' +
    client.outputFiles[0].text.replaceAll('</script', '<\\/script') + '</script></body></html>\n';
  const file = path.join(out, page.route.slice(1), 'index.html');
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, snapshot);
  if (page.route === '/kb/incidents/4471-review') await fs.writeFile(path.join(repo, 'rendered.html'), snapshot);
  outputs.push({ route: page.route, file: posix(path.relative(repo, file)), sha256: createHash('sha256').update(snapshot).digest('hex'), signature: page.metadata.signature || null });
}

const analysisBuild = await build({ ...common, entryPoints: [path.join(src, 'lib/kb/causes.ts')], platform: 'node', write: false });
const model = await import('data:text/javascript;base64,' + Buffer.from(analysisBuild.outputFiles[0].text).toString('base64'));
const rows = JSON.parse(await fs.readFile(path.join(src, 'lib/data/reports-4471.json'), 'utf8'));
const tenants = Object.fromEntries(await Promise.all(tenantFiles.map(async (file) => {
  const tenant = JSON.parse(await fs.readFile(path.join(src, 'lib/data/tenants', file), 'utf8'));
  return [tenant.handle, tenant];
})));
const unique = model.uniqueById(rows).filter((report) => report.mergedInto === 4471);
const groups = model.groupByCause(unique, (report) => tenants[report.tenant]);
const actual = Object.fromEntries(groups.map((group) => [group.cause, group.reports.length]));
if (actual.parser !== 379 || actual.hint !== 33 || unique.length !== 412) throw new Error('Original cause model differs from independent counts');
const independent = JSON.parse(await fs.readFile(path.join(repo, 'analysis.json'), 'utf8'));
for (const group of groups) {
  const actualIds = group.reports.map((report) => report.id).sort();
  const expectedIds = [...independent.groups[group.cause].ids].sort();
  if (JSON.stringify(actualIds) !== JSON.stringify(expectedIds)) throw new Error(`Report membership differs for ${group.cause}`);
}
const result = { builtAt: new Date().toISOString(), sourceRows: rows.length, uniqueReports: unique.length,
  counts: actual, independentMembershipMatched: true,
  locales: Object.values(tenants).map((tenant) => ({ handle: tenant.handle, locale: tenant.locale, dayFirst: model.dayFirst(tenant.locale) })),
  outputs, compilerWarnings: [...warnings] };
await fs.writeFile(path.join(repo, 'render-verification.json'), JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify(result, null, 2));
