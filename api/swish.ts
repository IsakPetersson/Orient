import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../lib/session.js';
import { getOrgIdFromHeader, requireOrgAdmin, requireOrgMember } from '../lib/org.js';
import { encryptBytes, encryptString } from '../lib/crypto.js';
import { createPaymentRequest } from '../lib/swish.js'; // loadSwishConfig is internal
import { createTransaction } from '../lib/accounting.js';
import crypto from 'node:crypto';

// --- Helper Functions ---

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

// Re-implementing loadSwishConfig here to avoid import issues or just use the lib one if exported
// It is exported in lib/swish.ts, so I should import it.
import { loadSwishConfig } from '../lib/swish.js';


export default async function handler(req: VercelRequest, res: VercelResponse) {
    const { action } = req.query;

    // --- Callback (No Auth Required) ---
    if (action === 'callback') {
        // Only accept POST requests
        if (req.method !== 'POST') {
            return res.status(405).json({ error: 'Method not allowed' });
        }

        try {
            // Parse callback payload
            const payload = req.body;

            if (!payload || typeof payload !== 'object') {
                return res.status(400).json({ error: 'Invalid request body' });
            }

            const {
                payeePaymentReference,
                status,
                errorCode,
                errorMessage,
                amount: amountStr,
                message: messageStr,
                payerAlias,
            } = payload;

            if (!payeePaymentReference) {
                return res.status(400).json({ error: 'Missing payment reference in body' });
            }

            const ref = payeePaymentReference;

            // Find payment request - validates this is a legitimate callback
            const paymentRequest = await prisma.swishPaymentRequest.findUnique({
                where: { payeePaymentReference: ref },
                include: {
                    bookAccount: true,
                },
            });

            if (!paymentRequest) {
                console.error(`Payment request not found: ${ref}`);
                return res.status(404).json({ error: 'Payment request not found' });
            }

            // Check if callback already processed (idempotent handling)
            if (paymentRequest.callbackReceivedAt) {
                console.log(`Callback already processed for reference: ${ref}`);
                return res.status(200).json({ message: 'Callback already processed' });
            }

            // Update payment request status
            const updateData: any = {
                status: status || 'UNKNOWN',
                callbackReceivedAt: new Date(),
                errorCode: errorCode || null,
                errorMessage: errorMessage || null,
            };

            // If payment is PAID and bookAccountId is set, create transaction
            if (status === 'PAID') {
                if (paymentRequest.bookAccountId && !paymentRequest.transactionId) {
                    const transaction = await createTransaction({
                        organizationId: paymentRequest.organizationId,
                        accountId: paymentRequest.bookAccountId,
                        amount: parseFloat(paymentRequest.amount), // Use original amount from DB
                        description: paymentRequest.message || (payerAlias ? `Swish payment from ${payerAlias}` : 'Swish Payment'),
                        category: 'Swish Payment',
                        voucherSeries: 'B' // Use 'B' for automatic Swish payments
                    });

                    updateData.transactionId = transaction.id;
                }

                // Update member paid status if linked
                if (paymentRequest.memberId) {
                    await prisma.member.update({
                        where: { id: paymentRequest.memberId },
                        data: {
                            paid: true,
                        }
                    });
                }
            }

            await prisma.swishPaymentRequest.update({
                where: { id: paymentRequest.id },
                data: updateData,
            });

            return res.status(200).json({ message: 'Callback processed' });

        } catch (error: any) {
            console.error('Swish callback error:', error);
            return res.status(500).json({ error: 'Internal server error', details: error.message });
        }
    }


    // --- Authenticated Actions ---
    const userId = requireAuth(req, res);
    if (!userId) return;

    const organizationId = getOrgIdFromHeader(req);
    if (!organizationId) {
        return res.status(400).json({ error: 'Missing or invalid x-org-id header' });
    }

    // --- Config Actions (Admin Only) ---
    if (action === 'config') {
        const membership = await requireOrgAdmin(req, res, userId, organizationId);
        if (!membership) return;

        // GET: Return Swish configuration status (no secrets)
        if (req.method === 'GET') {
            const org = await prisma.organization.findUnique({
                where: { id: organizationId },
                select: {
                    id: true,
                    name: true,
                    swishMerchantNumber: true,
                    swishMode: true,
                    // Only check if config exists, don't return encrypted data
                    swishP12Ciphertext: true,
                },
            });

            if (!org) {
                return res.status(404).json({ error: 'Organization not found' });
            }

            return res.status(200).json({
                merchantNumber: org.swishMerchantNumber,
                mode: org.swishMode,
                certificateConfigured: !!org.swishP12Ciphertext,
            });
        }

        // POST: Upload and encrypt Swish certificate configuration
        if (req.method === 'POST') {
            const { merchantNumber, mode, certificateBase64, passphrase } = req.body;

            // Validate required fields
            if (!merchantNumber || typeof merchantNumber !== 'string') {
                return res.status(400).json({ error: 'merchantNumber is required' });
            }

            if (!mode || (mode !== 'TEST' && mode !== 'PROD')) {
                return res.status(400).json({ error: 'mode must be TEST or PROD' });
            }

            if (!certificateBase64 || typeof certificateBase64 !== 'string') {
                return res.status(400).json({ error: 'certificateBase64 is required (base64-encoded .p12 file)' });
            }

            if (!passphrase || typeof passphrase !== 'string') {
                return res.status(400).json({ error: 'passphrase is required' });
            }

            // Check if encryption key is available
            if (!process.env.PLATFORM_ENCRYPTION_KEY_BASE64) {
                console.error('PLATFORM_ENCRYPTION_KEY_BASE64 is not set!');
                return res.status(500).json({
                    error: 'Server configuration error',
                    details: 'Encryption key not configured on server. Please contact support.'
                });
            }

            // Decode certificate from base64
            const certificateBuffer = Buffer.from(certificateBase64, 'base64');

            // Validate certificate size (reasonable max: 50KB)
            if (certificateBuffer.length > 50 * 1024) {
                return res.status(400).json({ error: 'Certificate file too large (max 50KB)' });
            }

            // Encrypt certificate and passphrase
            const {
                ciphertext: p12Ciphertext,
                iv: p12Iv,
                tag: p12Tag,
            } = encryptBytes(certificateBuffer);

            const {
                ciphertext: passCiphertext,
                iv: passIv,
                tag: passTag,
            } = encryptString(passphrase);

            // Store encrypted configuration (convert Buffer to Uint8Array for Prisma)
            await prisma.organization.update({
                where: { id: organizationId },
                data: {
                    swishMerchantNumber: merchantNumber,
                    swishMode: mode,
                    swishP12Ciphertext: Uint8Array.from(p12Ciphertext),
                    swishP12Iv: Uint8Array.from(p12Iv),
                    swishP12Tag: Uint8Array.from(p12Tag),
                    swishPassCiphertext: Uint8Array.from(passCiphertext),
                    swishPassIv: Uint8Array.from(passIv),
                    swishPassTag: Uint8Array.from(passTag),
                },
            });

            return res.status(200).json({
                message: 'Swish configuration saved successfully',
                merchantNumber,
                mode,
            });
        }
    }

    // --- Request Actions (Admin Only for List/Create) ---
    if (action === 'requests') {
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
            const { payerPhone, amount, message, bookAccountId, memberId } = req.body;

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

            // Validate memberId if provided
            if (memberId) {
                const member = await prisma.member.findFirst({
                    where: {
                        id: memberId,
                        organizationId,
                        deletedAt: null
                    }
                });

                if (!member) {
                    return res.status(400).json({ error: 'Member not found or deleted' });
                }
            }

            // Load Swish configuration
            const swishConfig = await loadSwishConfig(organizationId);

            if (!swishConfig) {
                return res.status(400).json({ error: 'Swish not configured for this organization' });
            }

            // Normalize phone number
            const normalizedPhone = normalizePhoneNumber(payerPhone);

            // Generate unique reference
            const payeePaymentReference = crypto.randomUUID().replace(/-/g, '').toUpperCase().slice(0, 35);

            // Build callback URL - use production URL and shorter format
            // IMPORTANT: Updated to support ?action=callback
            const baseUrl = process.env.VERCEL_ENV === 'production' && process.env.VERCEL_PROJECT_PRODUCTION_URL
                ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
                : process.env.VERCEL_URL
                    ? `https://${process.env.VERCEL_URL}`
                    : 'http://localhost:3000';

            const callbackUrl = `${baseUrl}/api/swish?action=callback`;

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

            // Save payment request to database
            const paymentRequest = await prisma.swishPaymentRequest.create({
                data: {
                    organizationId,
                    createdByUserId: userId,
                    payeeAlias: swishConfig.merchantNumber,
                    payeePaymentReference,
                    swishLocation: swishResponse.location,
                    payerAlias: normalizedPhone,
                    amount: amount,
                    message: message || undefined,
                    status: 'CREATED',
                    bookAccountId: bookAccountId ? parseInt(bookAccountId) : undefined,
                    memberId: memberId ? parseInt(memberId) : undefined,
                },
            });

            return res.status(201).json(paymentRequest);
        }
    }

    // --- Single Request Details (Member Access OK) ---
    if (action === 'request-details') {
        // Note: Using 'request-details' instead of 'requests/[id]' style
        const membership = await requireOrgMember(req, res, userId, organizationId);
        if (!membership) return;

        // GET: Get single payment request details
        if (req.method === 'GET') {
            const { id } = req.query; // This will now come from ?action=request-details&id=...

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
                        },
                    },
                },
            });

            if (!request) {
                return res.status(404).json({ error: 'Payment request not found' });
            }

            return res.status(200).json(request);
        }
    }

    return res.status(400).json({ error: 'Invalid action' });
}
