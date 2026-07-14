/**
 * Canonical app routes + auth redirect helpers.
 * Keep path logic here so proxy, login, and landing CTAs stay in sync.
 */

export const ROUTES = {
  home: "/",
  login: "/login",
  signup: "/signup",
  setPassword: "/set-password",
  forgotPassword: "/forgot-password",
  dashboard: "/dashboard",
} as const;

/** Where users land after a successful sign-in. */
export const DEFAULT_LOGIN_REDIRECT = ROUTES.dashboard;

/** Paths that require a valid session (proxy protects these). */
export const PROTECTED_PREFIXES = ["/dashboard", "/projects"] as const;

/** Public auth screens — bounce authenticated users away. */
export const AUTH_PAGES = ["/login", "/signup", "/forgot-password"] as const;

export function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function isAuthPage(pathname: string): boolean {
  return AUTH_PAGES.some(
    (page) => pathname === page || pathname.startsWith(`${page}/`),
  );
}

/**
 * Prevent open redirects. Only same-origin relative paths are allowed.
 */
export function safeCallbackUrl(
  raw: string | null | undefined,
  fallback: string = DEFAULT_LOGIN_REDIRECT,
): string {
  if (!raw) return fallback;

  let candidate = raw.trim();
  try {
    if (candidate.startsWith("http://") || candidate.startsWith("https://")) {
      candidate = new URL(candidate).pathname + new URL(candidate).search;
    }
  } catch {
    return fallback;
  }

  if (!candidate.startsWith("/") || candidate.startsWith("//")) {
    return fallback;
  }
  if (isAuthPage(candidate.split("?")[0] || candidate)) {
    return fallback;
  }
  return candidate;
}

/** `/login?callbackUrl=…` for guest CTAs that should resume into the app. */
export function loginHref(callbackUrl: string = DEFAULT_LOGIN_REDIRECT): string {
  const safe = safeCallbackUrl(callbackUrl);
  return `${ROUTES.login}?callbackUrl=${encodeURIComponent(safe)}`;
}

/** Destination for primary CTAs: dashboard if signed in, else signup. */
export function appEntryHref(isAuthenticated: boolean): string {
  return isAuthenticated ? ROUTES.dashboard : ROUTES.signup;
}

/** `/signup` for guests who want to create an account. */
export function signupHref(): string {
  return ROUTES.signup;
}
