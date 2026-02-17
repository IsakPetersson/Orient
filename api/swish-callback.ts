import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from '../lib/prisma.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
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
                const transaction = await prisma.transaction.create({
                    data: {
                        accountId: paymentRequest.bookAccountId,
                        amount: parseFloat(paymentRequest.amount),
                        description: paymentRequest.message || `Swish payment from ${paymentRequest.payerAlias}`,
                        category: 'Swish Payment',
                    },
                });

                updateData.transactionId = transaction.id;
            }

            // Update member paid status if linked
            if (paymentRequest.memberId) {
                await prisma.member.update({
                    where: { id: paymentRequest.memberId },
                    data: { paid: true }
                });
            }
        }

        // Update payment request
        await prisma.swishPaymentRequest.update({
            where: { id: paymentRequest.id },
            data: updateData,
        });

        // Return success response quickly
        return res.status(200).json({ message: 'Callback processed successfully' });
    } catch (error) {
        console.error('Error processing Swish callback:', error);
        // Still return 200 to avoid Swish retrying on our internal errors
        return res.status(200).json({ message: 'Error logged, callback acknowledged' });
    }
}
