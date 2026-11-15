// Updates a checkout of the gh-pages branch with a new docs build.
// Usage: node scripts/publish-docs.mjs <build folder> <site folder>
// A patch release replaces latest/. A minor or major release first moves the current
// latest/ to v<its version>/. A prerelease changes nothing.
import {
  cpSync,
  existsSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync
} from 'node:fs';
import { join } from 'node:path';

const fail = message => {
  console.error(`publish-docs: ${message}`);
  process.exit(1);
};

const [build, site] = process.argv.slice(2);
if (!build || !site) {
  fail('usage: node scripts/publish-docs.mjs <build folder> <site folder>');
}

// The version comes from the build itself, so an archive folder can never get a wrong label.
// TypeDoc writes "<name> - v<version>" into the title because `includeVersion` is on.
const versionOf = folder => {
  const html = readFileSync(join(folder, 'index.html'), 'utf8');
  const match = html.match(/<title>[^<]* - v(\d+)\.(\d+)\.(\d+)([^<]*)<\/title>/);
  if (!match) {
    fail(`${folder}/index.html has no version in its title`);
  }
  const [, major, minor, patch, suffix] = match;
  return {
    major: Number(major),
    minor: Number(minor),
    patch: Number(patch),
    text: `${major}.${minor}.${patch}${suffix}`,
    isPrerelease: suffix.startsWith('-')
  };
};

const compare = (a, b) =>
  a.major - b.major || a.minor - b.minor || a.patch - b.patch;

const next = versionOf(build);
if (next.isPrerelease) {
  console.log(`publish-docs: v${next.text} is a prerelease, the site does not change`);
  process.exit(0);
}

const latest = join(site, 'latest');
if (existsSync(latest)) {
  const current = versionOf(latest);
  if (compare(next, current) < 0) {
    fail(`v${next.text} is older than latest/ (v${current.text})`);
  }
  if (next.major !== current.major || next.minor !== current.minor) {
    const archive = join(site, `v${current.text}`);
    if (existsSync(archive)) {
      fail(`${archive} already exists`);
    }
    renameSync(latest, archive);
    console.log(`publish-docs: moved latest/ to v${current.text}/`);
  } else {
    rmSync(latest, { recursive: true });
  }
}
cpSync(build, latest, { recursive: true });
console.log(`publish-docs: latest/ is now v${next.text}`);

// Without this file, GitHub Pages runs Jekyll, which skips files that start with "_".
writeFileSync(join(site, '.nojekyll'), '');

const archives = readdirSync(site, { withFileTypes: true })
  .filter(entry => entry.isDirectory() && /^v\d/.test(entry.name))
  .map(entry => ({
    folder: entry.name,
    version: versionOf(join(site, entry.name))
  }))
  .sort((a, b) => compare(b.version, a.version));

const archiveLinks = archives
  .map(
    ({ folder, version }) =>
      `      <a href="${folder}/index.html" class="version-link secondary">Version ${version.text}</a>`
  )
  .join('\n');

writeFileSync(
  join(site, 'index.html'),
  `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>ts.data.json Documentation</title>
    <style>
      body {
        font-family:
          -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica,
          Arial, sans-serif;
        max-width: 800px;
        margin: 40px auto;
        padding: 0 20px;
        line-height: 1.6;
      }
      h1 {
        text-align: center;
        color: #333;
      }
      .latest-version {
        display: flex;
        justify-content: center;
        margin-top: 40px;
      }
      .older-versions {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        gap: 20px;
        margin-top: 40px;
      }
      .version-link {
        display: inline-block;
        padding: 18px 32px;
        background-color: #0366d6;
        color: white;
        text-decoration: none;
        border-radius: 6px;
        transition: background-color 0.2s;
      }
      .version-link:hover {
        background-color: #0255b3;
      }
      .version-link.secondary {
        background-color: #f6f8fa;
        color: #24292e;
        border: 1px solid #e1e4e8;
        padding: 6px 24px;
      }
    </style>
  </head>
  <body>
    <h1>ts.data.json Documentation</h1>
    <div class="latest-version">
      <a href="latest/index.html" class="version-link">Latest Version (v${next.text})</a>
    </div>
    <div class="older-versions">
${archiveLinks}
    </div>
  </body>
</html>
`
);
console.log(`publish-docs: index.html lists latest and ${archives.length} older versions`);
