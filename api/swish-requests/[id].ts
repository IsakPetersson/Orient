import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from '../../lib/prisma.js';
import { requireAuth } from '../../lib/session.js';
import { getOrgIdFromHeader, requireOrgMember } from '../../lib/org.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    try {
        const userId = requireAuth(req, res);
        if (!userId) return;

        const organizationId = getOrgIdFromHeader(req);
        if (!organizationId) {
            return res.status(400).json({ error: 'Missing or invalid x-org-id header' });
        }

        const membership = await requireOrgMember(req, res, userId, organizationId);
        if (!membership) return;

        // GET: Get single payment request details
        if (req.method === 'GET') {
            const { id } = req.query;

            if (!id || typeof id !== 'string') {
                return res.status(400).json({ error: 'Missing payment request ID' });
            }

            const request = await prisma.swishPaymentRequest.findFirst({
                where: {
                    id,
                    organizationId, // Ensure request belongs to user's org
                },
                include: {
                    createdBy: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                        },
                    },
                    bookAccount: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                    transaction: {
                        select: {
                            id: true,
                            amount: true,
                            description: true,
                            createdAt: true,
                        },
                    },
                },
            });

            if (!request) {
                return res.status(404).json({ error: 'Payment request not found' });
            }

            return res.status(200).json(request);
        }

        return res.status(405).json({ error: 'Method not allowed' });
    } catch (error) {
        console.error('Error in swish-requests/[id] API:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
