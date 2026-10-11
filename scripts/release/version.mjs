// Release versions are MAJOR.MM with a two-digit minor: 1.00, 1.01 … 1.99, 2.00.
// package.json holds the current version, and release tags carry it as-is, without a "v".
const PATTERN = /^(0|[1-9]\d*)\.(\d{2})$/;

/** @param {string} version */
export function parseVersion(version) {
  const match = PATTERN.exec(version);
  return match ? { major: Number(match[1]), minor: Number(match[2]) } : null;
}

/** Negative when a is lower than b, zero when equal, positive when higher. */
export function compareVersions(/** @type {string} */ a, /** @type {string} */ b) {
  const x = mustParse(a);
  const y = mustParse(b);
  return x.major - y.major || x.minor - y.minor;
}

/** The version after this one: 1.00 → 1.01 … 1.99 → 2.00. */
export function nextVersion(/** @type {string} */ version) {
  const { major, minor } = mustParse(version);
  return minor === 99 ? `${major + 1}.00` : `${major}.${String(minor + 1).padStart(2, "0")}`;
}

/** The highest release version among the tags; tags in any other form (v1.00, 1.0.0) are ignored. */
export function latestVersion(/** @type {string[]} */ tags) {
  const versions = tags.filter((tag) => parseVersion(tag)).sort(compareVersions);
  return versions[versions.length - 1] ?? null;
}

function mustParse(/** @type {string} */ version) {
  const parsed = parseVersion(version);
  if (!parsed) throw new Error(`"${version}" is not a release version. Use MAJOR.MM, such as 1.00 or 1.01.`);
  return parsed;
}
