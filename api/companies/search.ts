// Server-side proxy for the Companies House company search.
// The API key lives only in the Vercel env var COMPANIES_HOUSE_API_KEY and never reaches the browser.
export async function GET(request: Request): Promise<Response> {
  const q = new URL(request.url).searchParams.get("q")?.trim();
  if (!q) return Response.json({ items: [] });

  const key = process.env.COMPANIES_HOUSE_API_KEY;
  if (!key)
    return Response.json(
      { error: "Companies House key not configured" },
      { status: 503 },
    );

  const url = `https://api.company-information.service.gov.uk/search/companies?q=${encodeURIComponent(q)}&items_per_page=10`;
  const res = await fetch(url, {
    headers: { Authorization: "Basic " + btoa(`${key}:`) },
  });
  const body = await res.text();
  return new Response(body, {
    status: res.status,
    headers: {
      "content-type": "application/json",
      "cache-control": "s-maxage=300",
    },
  });
}
