export type EmbedSite = {
  /**
   * Root domain only, e.g. "client.be".
   * Matches that host and every subdomain / path (*.client.be/*).
   */
  domain: string;
};

/**
 * Accepts "client.be", "*.client.be", "client.be/*", "https://www.client.be/page".
 * Always stores a bare root hostname.
 */
export function normalizeDomain(value: string): string | null {
  let raw = value.trim().toLowerCase();
  if (!raw) return null;

  raw = raw.replace(/^\*\./, "").replace(/\/\*\s*$/, "").replace(/\/$/, "");

  if (raw.includes("://")) {
    try {
      raw = new URL(raw).hostname;
    } catch {
      return null;
    }
  } else if (raw.includes("/")) {
    raw = raw.split("/")[0] ?? "";
  }

  // host:port → host (not IPv6)
  if (raw.includes(":") && !raw.startsWith("[")) {
    raw = raw.split(":")[0] ?? "";
  }

  raw = raw.replace(/^\./, "").replace(/\.$/, "");
  if (!raw || !/^[a-z0-9.-]+$/.test(raw) || raw.includes("..")) return null;
  return raw;
}

export function hostMatchesDomain(hostname: string, domain: string): boolean {
  const host = hostname.trim().toLowerCase();
  const root = domain.trim().toLowerCase();
  if (!host || !root) return false;
  return host === root || host.endsWith("." + root);
}

function hostnameFromUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    return new URL(value).hostname.toLowerCase() || null;
  } catch {
    return null;
  }
}

function originFromUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
    return parsed.origin;
  } catch {
    return null;
  }
}

/**
 * EMBED_SITES is a JSON array in env / .dev.vars.
 * Preferred: ["client.be","localhost"]
 * Also accepts objects: [{"domain":"client.be"}] (key fields are ignored).
 *
 * `domain` is the root host: apex + all subdomains + all pages are allowed.
 * Empty / unset = open (any site can embed).
 */
export function getEmbedSites(): EmbedSite[] {
  const raw = process.env.EMBED_SITES?.trim();
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];

    const sites: EmbedSite[] = [];
    const seen = new Set<string>();

    for (const entry of parsed) {
      let domainRaw = "";
      if (typeof entry === "string") {
        domainRaw = entry;
      } else if (entry && typeof entry === "object") {
        const record = entry as Record<string, unknown>;
        domainRaw =
          typeof record.domain === "string"
            ? record.domain
            : typeof record.origin === "string"
              ? record.origin
              : typeof record.website === "string"
                ? record.website
                : "";
      }

      const domain = normalizeDomain(domainRaw);
      if (!domain || seen.has(domain)) continue;
      seen.add(domain);
      sites.push({ domain });
    }
    return sites;
  } catch {
    return [];
  }
}

export function isEmbedLockEnabled(): boolean {
  return getEmbedSites().length > 0;
}

export type EmbedAuthResult =
  | { ok: true; site: EmbedSite | null }
  | { ok: false; reason: "domain_not_allowed" };

/**
 * Authorize an embed by parent hostname (Referer) against the domain allowlist.
 * Paths never matter. Same-origin Flipper preview always allowed.
 */
export function authorizeEmbed(params: {
  referer: string | null | undefined;
  /** Host origin of this Flipper deployment, e.g. https://flipper.example.com */
  selfOrigin: string;
}): EmbedAuthResult {
  const sites = getEmbedSites();
  if (sites.length === 0) {
    return { ok: true, site: null };
  }

  const refererHost = hostnameFromUrl(params.referer);
  const selfHost = hostnameFromUrl(params.selfOrigin);
  const refererOrigin = originFromUrl(params.referer);
  const selfOrigin = originFromUrl(params.selfOrigin) ?? params.selfOrigin;

  // Same-origin load of /embed (Flipper admin / preview) — no foreign parent.
  if (!refererHost || refererHost === selfHost || refererOrigin === selfOrigin) {
    return { ok: true, site: null };
  }

  const site = sites.find((entry) => hostMatchesDomain(refererHost, entry.domain));
  if (!site) {
    return { ok: false, reason: "domain_not_allowed" };
  }

  return { ok: true, site };
}

/** CSP frame-ancestors: apex + *.domain for http and https. */
export function embedFrameAncestors(): string {
  const sites = getEmbedSites();
  if (sites.length === 0) return "*";

  const parts = new Set<string>(["'self'"]);
  for (const { domain } of sites) {
    if (domain === "localhost" || domain === "127.0.0.1") {
      parts.add(`http://${domain}:*`);
      parts.add(`https://${domain}:*`);
      continue;
    }
    parts.add(`https://${domain}`);
    parts.add(`https://*.${domain}`);
    parts.add(`http://${domain}`);
    parts.add(`http://*.${domain}`);
  }
  return Array.from(parts).join(" ");
}
