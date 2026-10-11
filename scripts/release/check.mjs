// Decides whether HEAD should be released, from the version in package.json and the
// existing release tags, and writes GitHub Actions outputs:
//   version=1.02
//   previous=1.01        (the latest release; empty before the first one)
//   release=true|false   (false until package.json is raised above the latest release)
// Fails when package.json does not hold a MAJOR.MM version.
// To check locally, run `git fetch --tags` first, then `node scripts/release/check.mjs`.
import { execFileSync } from "node:child_process";
import { appendFileSync, readFileSync } from "node:fs";
import { compareVersions, latestVersion, parseVersion } from "./version.mjs";

const actions = process.env.GITHUB_ACTIONS === "true";
const report = (level, message) => console.log(actions ? `::${level}::${message}` : message);

const { version } = JSON.parse(readFileSync(new URL("../../package.json", import.meta.url), "utf8"));
if (!parseVersion(version)) {
  report("error", `package.json version "${version}" must be MAJOR.MM, such as 1.00 or 1.01.`);
  process.exit(1);
}

const tags = execFileSync("git", ["tag", "--list"], { encoding: "utf8" }).split("\n").filter(Boolean);
const previous = latestVersion(tags);
const order = previous ? compareVersions(version, previous) : 1;
const release = order > 0;

if (release) {
  report("notice", `Releasing ${version}${previous ? ` (previous release ${previous})` : " (first release)"}.`);
} else if (order === 0) {
  report("notice", `${version} is already released. Run \`npm run bump\` to raise the version and publish a new release.`);
} else {
  report("warning", `package.json version ${version} is lower than the latest release ${previous}, so nothing was released.`);
}

if (process.env.GITHUB_OUTPUT) {
  appendFileSync(process.env.GITHUB_OUTPUT, `version=${version}\nprevious=${previous ?? ""}\nrelease=${release}\n`);
}
