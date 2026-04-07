function stripTrailingSlashes(s: string) {
  return s.replace(/\/+$/, '');
}

function stripLeadingSlashes(s: string) {
  return s.replace(/^\/+/, '');
}

/**
 * Prefix a site-root path with Astro's BASE_URL (for GitHub Pages project sites).
 *
 * - Local dev BASE_URL is typically "/"
 * - GitHub Pages project BASE_URL is typically "/<repo>/"
 */
export function withBase(path: string) {
  const base = import.meta.env.BASE_URL ?? '/';
  const baseNoTrail = stripTrailingSlashes(base);

  // If BASE_URL is "/" then baseNoTrail becomes "" and we just return a normal root path.
  const pathRooted = `/${stripLeadingSlashes(path)}`;

  return `${baseNoTrail}${pathRooted}` || '/';
}

