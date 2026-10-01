// Server-side proxy for a Companies House company profile with its officers and PSCs.
// The API key lives only in the Vercel env var COMPANIES_HOUSE_API_KEY and never reaches the browser.
export async function GET(request: Request): Promise<Response> {
  const number = new URL(request.url).searchParams.get("number")?.trim().toUpperCase();
  if (!number || !/^[A-Z0-9]{8}$/.test(number))
    return Response.json({ error: "A valid company number is required" }, { status: 400 });

  const key = process.env.COMPANIES_HOUSE_API_KEY;
  if (!key)
    return Response.json(
      { error: "Companies House key not configured" },
      { status: 503 },
    );

  const base = "https://api.company-information.service.gov.uk/company/";
  const headers = { Authorization: "Basic " + btoa(`${key}:`) };
  const get = (path: string) => fetch(`${base}${number}${path}`, { headers });

  const [profile, officers, pscs] = await Promise.all([
    get(""),
    get("/officers?items_per_page=50"),
    get("/persons-with-significant-control?items_per_page=50"),
  ]);

  if (!profile.ok)
    return Response.json({ error: "Company not found" }, { status: profile.status });

  // PSC data can legitimately be missing (for example, exempt companies).
  const body = {
    profile: await profile.json(),
    officers: officers.ok ? await officers.json() : { items: [] },
    pscs: pscs.ok ? await pscs.json() : { items: [] },
  };

  return Response.json(body, {
    headers: { "cache-control": "s-maxage=300" },
  });
}
