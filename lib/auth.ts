import type { VercelRequest, VercelResponse } from "@vercel/node";

export function requireAdminApiKey(req: VercelRequest, res: VercelResponse): boolean {
    const expected = process.env.ADMIN_API_KEY;
    if (!expected) {
        res.status(500).json({ error: "Server misconfigured: ADMIN_API_KEY missing" });
        return false;
    }

    const provided = req.headers["x-api-key"];
    const key = Array.isArray(provided) ? provided[0] : provided;

    if (!key || key !== expected) {
        res.status(401).json({ error: "Unauthorized" });
        return false;
    }

    return true;
}
