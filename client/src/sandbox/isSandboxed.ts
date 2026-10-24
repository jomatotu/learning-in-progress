// An iframe with sandbox="allow-scripts" and no allow-same-origin has the opaque origin 'null'.
export function isSandboxed(origin: string): boolean {
  return origin === 'null'
}
