export function normalizeInstagramHandle(value: string): string | null {
  const handle = value.trim().replace(/^@/, "").toLowerCase();

  if (!/^[a-z0-9._]{1,30}$/.test(handle) || handle.startsWith(".") || handle.endsWith(".")) {
    return null;
  }

  return handle;
}

export function instagramLoginEmail(handle: string): string {
  return `${handle}@instagram.user`;
}
