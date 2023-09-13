export function getGitCommitHash() {
  const { stdout } = Bun.spawnSync({
    cmd: ["git", "rev-parse", "HEAD"],
    stdout: "pipe",
  });

  return stdout.toString();
}

export function getBuildTime(): string {
  return new Date().toString();
}

export function getVersion(): string {
  return require("../../package.json")["version"];
}
