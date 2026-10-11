// Raises the version in package.json and package-lock.json, then rebuilds the bundle,
// which embeds the version in its console banner.
//   npm run bump           1.00 → 1.01 … 1.99 → 2.00
//   npm run bump -- 2.00   jump straight to a higher version
// Merging the bump into main publishes it as a release.
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { compareVersions, nextVersion, parseVersion } from "./version.mjs";

const root = new URL("../../", import.meta.url);
const read = (file) => JSON.parse(readFileSync(new URL(file, root), "utf8"));
const write = (file, data) => writeFileSync(new URL(file, root), `${JSON.stringify(data, null, 2)}\n`);
const fail = (message) => {
  console.error(message);
  process.exit(1);
};

const pkg = read("package.json");
const current = pkg.version;
if (!parseVersion(current)) fail(`package.json version "${current}" must be MAJOR.MM, such as 1.00 or 1.01.`);

const target = process.argv[2] ?? nextVersion(current);
if (!parseVersion(target)) fail(`"${target}" is not a release version. Use MAJOR.MM, such as 1.00 or 1.01.`);
if (compareVersions(target, current) <= 0) fail(`${target} is not higher than the current version ${current}.`);

pkg.version = target;
write("package.json", pkg);

const lock = read("package-lock.json");
lock.version = target;
lock.packages[""].version = target;
write("package-lock.json", lock);

execFileSync(process.execPath, ["build.mjs"], { cwd: root, stdio: "inherit" });

console.log(`\nVersion ${current} → ${target}. Commit package.json, package-lock.json and dist/.`);
