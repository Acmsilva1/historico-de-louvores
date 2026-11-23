export function appBuildId(): string {
  return process.env.NEXT_PUBLIC_APP_BUILD_ID?.trim() || "dev";
}