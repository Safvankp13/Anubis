
export function extractSummary(scan) {
  const result = (scan && scan.result) ? scan.result : scan || {};

  const domain = result.domain || result.url || "unknown";
  const homeHeaders = result.home?.headers || {};
  const libs = result.home?.detected_libs || [];
  const subdomains = Array.isArray(result.crtsh?.subdomains) ? result.crtsh.subdomains : [];
  const robots = typeof result.robots === "string" ? result.robots.trim() : (result.robots || "");

  // SSL endpoint (pick first if multiple)
  const ep = result.ssl?.endpoints?.[0] || null;

  // Basics
  const sslGrade = ep?.grade || "unknown";
  const ipAddress = ep?.ipAddress || ep?.ipv6 || "n/a";
  const serverSignature = ep?.details?.serverSignature || homeHeaders.server || "n/a";
  const protocolsArr = Array.isArray(ep?.details?.protocols) ? ep.details.protocols : [];
  const protocols = protocolsArr.map(p => `${p.name ?? ""} ${p.version ?? ""}`.trim()).filter(Boolean);
  const alpnProtocols = ep?.details?.alpnProtocols || null;
  const modernTLS = protocols.some(p => p.includes("1.3"));

  // Certificate chain basics (best-effort, SSL Labs responses vary)
  let certIssuer = null;
  let certNotAfter = null;
  const chains = ep?.details?.certChains;
  if (Array.isArray(chains) && chains.length) {
    const c0 = chains[0];
    certIssuer = c0?.certIssuerLabel || c0?.issuerLabel || null;
    certNotAfter = c0?.notAfter || c0?.validityNotAfter || null;
  }
  let certDaysLeft = null;
  if (certNotAfter) {
    const t = new Date(certNotAfter).getTime();
    if (!Number.isNaN(t)) certDaysLeft = Math.ceil((t - Date.now()) / 86400000);
  }

  // Suites / ciphers (best-effort across SSL Labs shapes)
  const suitesGroups = Array.isArray(ep?.details?.suites) ? ep.details.suites : [];
  const allSuites = suitesGroups.flatMap(g => Array.isArray(g?.list) ? g.list : []);
  const strongestCipher = allSuites
    .slice()
    .sort((a, b) => (b.cipherStrength ?? 0) - (a.cipherStrength ?? 0))[0]?.name || null;

  const weakCipherPatterns = /(RC4|3DES|NULL|EXPORT|MD5|DES|TLS_RSA_)/i;
  const weakCiphers = allSuites
    .filter(s => weakCipherPatterns.test(s?.name || ""))
    .map(s => s.name);

  // Legacy client simulation failures (visual & useful)
  const sims = ep?.details?.sims?.results || [];
  const legacyFailures = sims
    .filter(s => s?.errorMessage)
    .map(s => ({
      client: `${s?.client?.name ?? "Client"} ${s?.client?.version ?? ""}`.trim(),
      error: s?.errorMessage
    }));

  // Header completeness
  const mustHeaders = [
    "strict-transport-security",
    "content-security-policy",
    "x-frame-options",
    "x-content-type-options",
    "referrer-policy",
    "permissions-policy"
  ];
  const presentHeaders = mustHeaders.filter(h => !!homeHeaders[h]);
  const missingHeaders = mustHeaders.filter(h => !homeHeaders[h]);

  // CDN / provider heuristic
  const headerKeys = Object.keys(homeHeaders).reduce((a, k) => a.add(k.toLowerCase()), new Set());
  const hasCF = headerKeys.has("cf-ray") || headerKeys.has("cf-cache-status");
  const hasCloudFront = headerKeys.has("x-amz-cf-pop") || /cloudfront/i.test(serverSignature || "");
  const hasAkamai = headerKeys.has("server-timing") && /ak_/.test(homeHeaders["server-timing"] || "");
  const cdnProvider =
    hasCF ? "Cloudflare" :
    hasCloudFront ? "AWS CloudFront" :
    hasAkamai ? "Akamai (heuristic)" :
    /google|gws/i.test(serverSignature || "") ? "Google Frontend (heuristic)" :
    /nginx|apache|iis/i.test(serverSignature || "") ? "Origin (nginx/apache/iis)" :
    "Unknown";

  // Robots/Exposure details
  const robotsLines = robots.split("\n").map(s => s.trim()).filter(Boolean);
  const disallows = robotsLines.filter(l => /^Disallow:/i.test(l))
                               .map(l => l.replace(/^Disallow:\s*/i, ""));
  const sitemap = robotsLines.find(l => /^Sitemap:/i.test(l))?.replace(/^Sitemap:\s*/i, "") || null;
  const suspiciousDisallows = disallows.filter(d =>
    /(admin|login|wp-admin|wp-login|phpmyadmin|backup|staging|test|old|private)/i.test(d)
  );

  // Risks (keep consistent with your backend heuristics, extend a bit here for UI)
  const risks = [];
  const hstsPolicyStatus = ep?.details?.hstsPolicy?.status || "unknown";
  if (!homeHeaders["strict-transport-security"] && hstsPolicyStatus === "absent") {
    risks.push({ id: "missing_hsts", severity: "medium", message: "HSTS header missing" });
  }
  if (!homeHeaders["content-security-policy"]) {
    risks.push({ id: "missing_csp", severity: "medium", message: "CSP header missing" });
  }
  if (subdomains.length >= 10) {
    risks.push({ id: "many_subdomains", severity: "low", message: `Found ${subdomains.length} subdomains` });
  }
  const g = (sslGrade || "").toUpperCase();
  if (g && (["E","F"].includes(g) || g < "B")) {
    risks.push({ id: "weak_ssl", severity: "high", message: `SSL grade ${sslGrade} is weak` });
  }
  if (certDaysLeft !== null && certDaysLeft < 75) {
    risks.push({ id: "cert_expiry_soon", severity: "high", message: `Certificate expires in ${certDaysLeft} days` });
  }
  if (weakCiphers.length) {
    risks.push({ id: "weak_ciphers", severity: "medium", message: `Weak ciphers detected: ${weakCiphers.slice(0,5).join(", ")}${weakCiphers.length>5?"…":""}` });
  }

  // Simple recommendations
  const recommendations = [];
  if (missingHeaders.includes("strict-transport-security")) recommendations.push("Enable HSTS with a long max-age and includeSubDomains.");
  if (missingHeaders.includes("content-security-policy"))  recommendations.push("Add a strict Content-Security-Policy to reduce XSS risk.");
  if (!modernTLS) recommendations.push("Enable TLS 1.3 and strong ciphers; disable legacy protocols.");
  if (weakCiphers.length) recommendations.push("Remove legacy ciphers (RC4/3DES/MD5/EXPORT).");
  if (certDaysLeft !== null && certDaysLeft < 75) recommendations.push("Renew the TLS certificate soon.");
  if (suspiciousDisallows.length) recommendations.push("Review robots.txt disallows for sensitive admin paths exposure.");

  // urlscan light
  const urlscan = result.urlscan || null;
  const urlscanSummary = urlscan?.page?.title || urlscan?.data?.task?.domain || null;
  const urlscanScreenshot = urlscan?.screenshot || urlscan?.page?.screenshot || null;

  // top techs (BuiltWith/Wappalyzer)
  const techs = [];
  if (Array.isArray(result.wappalyzer?.applications)) {
    for (let i = 0; i < Math.min(6, result.wappalyzer.applications.length); i++) {
      techs.push(result.wappalyzer.applications[i].name);
    }
  } else if (result.builtwith?.Results?.length) {
    const bw = result.builtwith.Results[0];
    if (bw?.Result?.Technologies) {
      for (let i = 0; i < Math.min(6, bw.Result.Technologies.length); i++) {
        techs.push(bw.Result.Technologies[i].Name || bw.Result.Technologies[i].Tag);
      }
    }
  }

  // Headline
  const headline = [
    `Grade ${sslGrade}`,
    modernTLS ? "TLS 1.3" : null,
    libs.length ? `Tech: ${libs.slice(0,3).join(", ")}${libs.length>3?"…":""}` : null,
    `${subdomains.length} subdomain${subdomains.length!==1?"s":""}`
  ].filter(Boolean).join(" • ");

  // Worst severity
  const worstSeverity = risks.length
    ? risks.reduce((acc, r) => {
        const m = { info:0, low:1, medium:2, high:3 };
        return (m[r.severity] > m[acc]) ? r.severity : acc;
      }, "info")
    : "info";

  return {
    // summary
    domain,
    url: result.url,
    headline,
    sslGrade,
    worstSeverity,

    // SSL/TLS
    ipAddress,
    serverSignature,
    protocols,
    alpnProtocols,
    modernTLS,
    certIssuer: certIssuer || "n/a",
    certNotAfter: certNotAfter || null,
    certDaysLeft,
    strongestCipher,
    weakCiphers,
    legacyFailures, // [{client, error}, ...]

    // Headers
    presentHeaders,
    missingHeaders,

    // Tech
    libs,
    techs,
    generator: result.home?.generator || null,

    // Exposure
    subdomainCount: subdomains.length,
    subdomains,
    robots,
    robotsDisallow: disallows,
    sitemap,
    suspiciousDisallows,

    // Risk & Recos
    risks,
    recommendations,

    // urlscan
    urlscanSummary,
    urlscanScreenshot,

    // provider guess
    cdnProvider,

    // raw (for any extra UI needs)
    raw: result
  };
}
