import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

assert.equal(
  Number(process.versions.node.split(".")[0]),
  24,
  "Package consumers must run on supported Node 24",
);
const root = fileURLToPath(new URL("../", import.meta.url));
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
assert.equal(pkg.engines.node, ">=24 <25");
const consumer = mkdtempSync(join(tmpdir(), "vast-inliner-package-"));
const npm = process.platform === "win32" ? "npm.cmd" : "npm";

try {
  const packed = JSON.parse(
    execFileSync(npm, ["pack", "--json", "--ignore-scripts", "--pack-destination", consumer], {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }),
  );
  for (const path of ["docs/examples.md", "docs/migration-v3.md"]) {
    assert.ok(
      packed[0].files.some((file) => file.path === path),
      `Missing packed guide: ${path}`,
    );
  }
  writeFileSync(join(consumer, "package.json"), JSON.stringify({ private: true, type: "module" }));
  execFileSync(
    npm,
    [
      "install",
      join(consumer, packed[0].filename),
      "--ignore-scripts",
      "--no-audit",
      "--no-fund",
      "--package-lock=false",
    ],
    { cwd: consumer, stdio: "pipe" },
  );
  writeFileSync(
    join(consumer, "check.mjs"),
    `
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import esm from 'vast-inliner';
const cjs = createRequire(import.meta.url)('vast-inliner');
assert.equal(cjs.default, cjs.vastInliner);
const fixtures = {
  'https://fixture.invalid/wrapper.xml': '<VAST><Ad><Wrapper><VASTAdTagURI>inline.xml</VASTAdTagURI><Impression>wrapper</Impression><Creatives/></Wrapper></Ad></VAST>',
  'https://fixture.invalid/inline.xml': '<VAST><Ad><InLine><Impression>inline</Impression><Creatives/></InLine></Ad></VAST>'
};
for (const resolve of [esm, cjs.default]) {
  const calls = [];
  const xml = await resolve('https://fixture.invalid/wrapper.xml', {
    serialize: true,
    fetch: async input => {
      const url = String(input);
      calls.push(url);
      assert.ok(Object.hasOwn(fixtures, url));
      return new Response(fixtures[url]);
    }
  });
  assert.deepEqual(calls, Object.keys(fixtures));
  assert.match(xml, /<InLine>/);
  assert.ok(xml.includes('<Impression>inline</Impression>'));
  assert.ok(xml.includes('<Impression>wrapper</Impression>'));
}
`,
  );
  execFileSync(process.execPath, ["check.mjs"], { cwd: consumer, stdio: "inherit" });
  writeFileSync(
    join(consumer, "check.mts"),
    `
import vastInliner, { type XmlDocument } from 'vast-inliner';
const xml: Promise<string> = vastInliner('https://fixture.invalid/ad.xml', { serialize: true });
const document: Promise<XmlDocument> = vastInliner('https://fixture.invalid/ad.xml');
void xml; void document;
`,
  );
  writeFileSync(
    join(consumer, "check.cts"),
    `
import pkg = require('vast-inliner');
const xml: Promise<string> = pkg.default('https://fixture.invalid/ad.xml', { serialize: true });
void xml;
`,
  );
  execFileSync(
    process.execPath,
    [
      join(root, "node_modules/typescript/bin/tsc"),
      "--noEmit",
      "--strict",
      "--target",
      "ES2024",
      "--module",
      "NodeNext",
      "--moduleResolution",
      "NodeNext",
      "--lib",
      "ES2024,DOM,DOM.Iterable",
      "check.mts",
      "check.cts",
    ],
    { cwd: consumer, stdio: "inherit" },
  );
  console.log(
    `Packed ESM/CommonJS runtime and declaration consumers passed on ${process.version}.`,
  );
} finally {
  rmSync(consumer, { recursive: true, force: true });
}
