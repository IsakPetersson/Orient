import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../lib/session.js';
import { getOrgIdFromHeader, requireOrgAdmin } from '../lib/org.js';
import { loadSwishConfig, createPaymentRequest } from '../lib/swish.js';
import crypto from 'node:crypto';

/**
 * Normalize phone number to digits-only format (e.g., "070-123 45 67" -> "4670123456")
 */
function normalizePhoneNumber(phone: string): string {
    // Remove all non-digit characters
    let digits = phone.replace(/\D/g, '');

    // If starts with 0, replace with 46 (Swedish country code)
    if (digits.startsWith('0')) {
        digits = '46' + digits.slice(1);
    }

    // If doesn't start with country code, add 46
    if (!digits.startsWith('46')) {
        digits = '46' + digits;
    }

    return digits;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    try {
        const userId = requireAuth(req, res);
        if (!userId) return;

        const organizationId = getOrgIdFromHeader(req);
        if (!organizationId) {
            return res.status(400).json({ error: 'Missing or invalid x-org-id header' });
        }

        const membership = await requireOrgAdmin(req, res, userId, organizationId);
        if (!membership) return;

        // GET: List all payment requests for organization
        if (req.method === 'GET') {
            const requests = await prisma.swishPaymentRequest.findMany({
                where: { organizationId },
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
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
            });

            return res.status(200).json(requests);
        }

        // POST: Create new payment request
        if (req.method === 'POST') {
            const { payerPhone, amount, message, bookAccountId } = req.body;

            // Validate required fields
            if (!payerPhone || typeof payerPhone !== 'string') {
                return res.status(400).json({ error: 'payerPhone is required' });
            }

            if (!amount || typeof amount !== 'string') {
                return res.status(400).json({ error: 'amount is required as string' });
            }

            // Validate amount format
            const amountNum = parseFloat(amount);
            if (isNaN(amountNum) || amountNum <= 0) {
                return res.status(400).json({ error: 'Invalid amount' });
            }

            // Validate bookAccountId if provided
            if (bookAccountId !== undefined && bookAccountId !== null) {
                const account = await prisma.account.findFirst({
                    where: {
                        id: bookAccountId,
                        organizationId,
                    },
                });

                if (!account) {
                    return res.status(400).json({ error: 'Invalid bookAccountId or account not in organization' });
                }
            }

            // Load Swish configuration
            const swishConfig = await loadSwishConfig(organizationId);
            if (!swishConfig) {
                return res.status(400).json({ error: 'Swish not configured for this organization' });
            }

            // Normalize phone number
            const normalizedPhone = normalizePhoneNumber(payerPhone);

            // Generate unique payment reference (max 35 chars, alphanumeric)
            const payeePaymentReference = crypto.randomUUID().replace(/-/g, '').toUpperCase().slice(0, 35);

            // Build callback URL - use production URL and shorter format
            const callbackSecret = process.env.SWISH_CALLBACK_SECRET;
            if (!callbackSecret) {
                throw new Error('SWISH_CALLBACK_SECRET not configured');
            }

            // Use production domain if available, otherwise Vercel URL
            const baseUrl = process.env.VERCEL_ENV === 'production' && process.env.VERCEL_PROJECT_PRODUCTION_URL
                ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
                : process.env.VERCEL_URL
                    ? `https://${process.env.VERCEL_URL}`
                    : 'http://localhost:3000';
            
            // Shorten callback URL - use payment reference as token
            const callbackUrl = `${baseUrl}/api/swish-callback?ref=${payeePaymentReference}`;

            // Create payment request in Swish
            let swishResponse;
            try {
                swishResponse = await createPaymentRequest(swishConfig, {
                    payeeAlias: swishConfig.merchantNumber,
                    payerAlias: normalizedPhone,
                    amount: amount,
                    currency: 'SEK',
                    message: message || undefined,
                    payeePaymentReference,
                    callbackUrl,
                });
            } catch (error: any) {
                console.error('Swish payment request failed:', error);
                return res.status(400).json({
                    error: 'Failed to create Swish payment request',
                    message: error.message,
                });
            }

            // Store payment request in database
            const paymentRequest = await prisma.swishPaymentRequest.create({
                data: {
                    organizationId,
                    createdByUserId: userId,
                    payeeAlias: swishConfig.merchantNumber,
                    payerAlias: normalizedPhone,
                    amount: amount,
                    currency: 'SEK',
                    message: message || null,
                    payeePaymentReference,
                    swishLocation: swishResponse.location,
                    status: 'PENDING',
                    bookAccountId: bookAccountId || null,
                },
                include: {
                    createdBy: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                        },
                    },
                },
            });

            return res.status(201).json(paymentRequest);
        }

        return res.status(405).json({ error: 'Method not allowed' });
    } catch (error) {
        console.error('Error in swish-requests API:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
