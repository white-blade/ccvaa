/**
 * Prefixes a `public/` path with the deployment base path.
 *
 * Next.js applies `basePath` to routes and its own `_next/*` assets, but not to `src`
 * strings handed to next/image. Without this, `/images/...` 404s on a GitHub project
 * page. Use it for every reference to a file in `public/`.
 */
export function assetPath(path: string): string {
  return `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}${path}`;
}
