export function getVersion(): string {
  return require("../../package.json")["version"];
}

export function getBuildTime(): string {
  return new Date().toString();
}
