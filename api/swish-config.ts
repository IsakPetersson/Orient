import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../lib/session.js';
import { getOrgIdFromHeader, requireOrgAdmin } from '../lib/org.js';
import { encryptBytes, encryptString } from '../lib/crypto.js';

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
            console.log('Starting encryption...');
            const {
                ciphertext: p12Ciphertext,
                iv: p12Iv,
                tag: p12Tag,
            } = encryptBytes(certificateBuffer);
            console.log('Certificate encrypted successfully');

            const {
                ciphertext: passCiphertext,
                iv: passIv,
                tag: passTag,
            } = encryptString(passphrase);
            console.log('Passphrase encrypted successfully');

            // Store encrypted configuration (convert Buffer to Uint8Array for Prisma)
            console.log('Saving to database...');
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

        return res.status(405).json({ error: 'Method not allowed' });
    } catch (error) {
        console.error('Error in swish-config API:', error);
        // Return more detailed error for debugging
        const errorMessage = error instanceof Error ? `${error.message}\n${error.stack}` : 'Internal server error';
        console.error('Error details:', errorMessage);
        return res.status(500).json({ 
            error: 'Internal server error', 
            details: error instanceof Error ? error.message : 'Unknown error',
            stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined
        });
    }
}
