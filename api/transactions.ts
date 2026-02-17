import type { VercelRequest, VercelResponse } from "@vercel/node";
import { prisma } from "../lib/prisma.js";
import { createTransaction } from "../lib/accounting.js";
import { requireAuth } from "../lib/session.js";
import { getOrgIdFromHeader, requireOrgMember } from "../lib/org.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
    try {
        const userId = requireAuth(req, res);
        if (!userId) return;

        const organizationId = getOrgIdFromHeader(req);
        if (!organizationId) {
            return res.status(400).json({ error: "Missing or invalid x-org-id header" });
        }

        const membership = await requireOrgMember(req, res, userId, organizationId);
        if (!membership) return;

        if (req.method === "GET") {
            const transactions = await prisma.transaction.findMany({
                where: {
                    account: { organizationId },
                },
                include: { account: true },
                orderBy: { createdAt: "desc" },
            });

            return res.status(200).json(transactions);
        }

        if (req.method === "POST") {
            const { amount, description, category, accountId } = req.body ?? {};

            // allow amount = 0; ensure it's a finite number
            const amountNumber =
                typeof amount === "number" ? amount : typeof amount === "string" ? Number(amount) : NaN;

            const accountIdNumber =
                typeof accountId === "number"
                    ? accountId
                    : typeof accountId === "string"
                        ? Number(accountId)
                        : NaN;

            if (!Number.isFinite(amountNumber) || !Number.isFinite(accountIdNumber)) {
                return res.status(400).json({ error: "Amount and accountId are required" });
            }

            // Perform transaction creation with voucher number via helper
            const transaction = await createTransaction({
                organizationId,
                accountId: accountIdNumber,
                amount: amountNumber,
                description: typeof description === "string" ? description : null,
                category: typeof category === "string" ? category : null,
            });

            return res.status(201).json(transaction);
        }

        return res.status(405).json({ error: "Method not allowed" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal server error" });
    }
}
