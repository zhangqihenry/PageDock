function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Renders the static `index.html` stored for a "link" type site — PageDock
// never proxies the destination, it just forwards the visitor to it. A meta
// refresh covers browsers with JS disabled; the script and the visible link
// are fallbacks for anything that ignores the meta tag. This is generated
// by PageDock itself (not uploaded content), but the title/URL are still
// admin-supplied, so both are HTML/JS-string escaped before being embedded.
export function renderLinkRedirectHtml(title, url) {
  const safeUrl = escapeHtml(url);
  const safeTitle = escapeHtml(title || url);
  const scriptUrl = JSON.stringify(url).replace(/</g, '\\u003C');

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta http-equiv="refresh" content="0; url=${safeUrl}">
<meta name="robots" content="noindex">
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="canonical" href="${safeUrl}">
<title>${safeTitle}</title>
<style>
  html, body { height: 100%; margin: 0; }
  body {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    background: #fff;
    color: #14171f;
    font: 15px/1.6 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    text-align: center;
  }
  a { color: #c1121f; word-break: break-all; }
</style>
</head>
<body>
<p>Redirecting to <a href="${safeUrl}">${safeUrl}</a>&hellip;</p>
<script>location.replace(${scriptUrl});</script>
</body>
</html>
`;
}
