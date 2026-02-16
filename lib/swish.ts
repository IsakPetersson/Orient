import https from 'node:https';
import { decryptBytes, decryptString } from './crypto.js';
import { prisma } from './prisma.js';

const SWISH_BASE_URL_TEST = 'https://mss.cpc.getswish.net/swish-cpcapi';
const SWISH_BASE_URL_PROD = 'https://cpc.getswish.net/swish-cpcapi';

export interface SwishConfig {
    merchantNumber: string;
    mode: 'TEST' | 'PROD';
    p12Buffer: Buffer;
    passphrase: string;
}

export interface CreatePaymentRequestParams {
    payeeAlias: string; // Merchant number
    payerAlias: string; // Phone number (e.g., "4670123456")
    amount: string; // Amount as string (e.g., "100.00")
    currency?: string; // Default: "SEK"
    message?: string; // Optional message
    payeePaymentReference: string; // Unique reference
    callbackUrl: string; // Callback URL for payment status updates
}

export interface SwishPaymentResponse {
    location: string; // URL to track payment status
    id: string; // Payment request ID
}

/**
 * Load and decrypt Swish configuration for an organization
 */
export async function loadSwishConfig(organizationId: number): Promise<SwishConfig | null> {
    const org = await prisma.organization.findUnique({
        where: { id: organizationId },
        select: {
            swishMerchantNumber: true,
            swishMode: true,
            swishP12Ciphertext: true,
            swishP12Iv: true,
            swishP12Tag: true,
            swishPassCiphertext: true,
            swishPassIv: true,
            swishPassTag: true,
        },
    });

    if (!org || !org.swishMerchantNumber || !org.swishMode || !org.swishP12Ciphertext) {
        return null;
    }

    // Decrypt certificate and passphrase
    const p12Buffer = decryptBytes(
        org.swishP12Ciphertext,
        org.swishP12Iv!,
        org.swishP12Tag!
    );

    const passphrase = decryptString(
        org.swishPassCiphertext!,
        org.swishPassIv!,
        org.swishPassTag!
    );

    return {
        merchantNumber: org.swishMerchantNumber,
        mode: org.swishMode as 'TEST' | 'PROD',
        p12Buffer,
        passphrase,
    };
}

/**
 * Sanitize message for Swish API - replace Swedish characters
 */
function sanitizeSwishMessage(message: string | undefined): string | undefined {
    if (!message) return undefined;

    // Replace Swedish characters with ASCII equivalents
    return message
        .replace(/å/g, 'a')
        .replace(/ä/g, 'a')
        .replace(/ö/g, 'o')
        .replace(/Å/g, 'A')
        .replace(/Ä/g, 'A')
        .replace(/Ö/g, 'O')
        .substring(0, 50); // Max 50 characters
}

/**
 * Create a Swish payment request using mTLS authentication
 */
export async function createPaymentRequest(
    config: SwishConfig,
    params: CreatePaymentRequestParams
): Promise<SwishPaymentResponse> {
    const baseUrl = config.mode === 'TEST' ? SWISH_BASE_URL_TEST : SWISH_BASE_URL_PROD;

    // Generate instruction UUID for the request
    const crypto = await import('node:crypto');
    const instructionUUID = crypto.randomUUID().toUpperCase();

    const url = `${baseUrl}/api/v2/paymentrequests/${instructionUUID}`;

    // Build request body - only include message if provided
    const requestBody: any = {
        payeeAlias: params.payeeAlias,
        payerAlias: params.payerAlias,
        amount: params.amount,
        currency: params.currency || 'SEK',
        payeePaymentReference: params.payeePaymentReference,
        callbackUrl: params.callbackUrl,
    };

    // Only include message if it exists
    const sanitizedMessage = sanitizeSwishMessage(params.message);
    if (sanitizedMessage) {
        requestBody.message = sanitizedMessage;
    }

    return new Promise((resolve, reject) => {
        const options: https.RequestOptions = {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            pfx: config.p12Buffer,
            passphrase: config.passphrase,
            // MSS test environment may use self-signed certificates
            rejectUnauthorized: config.mode === 'PROD',
        };

        console.log('Creating Swish payment request:', {
            url,
            mode: config.mode,
            merchantNumber: config.merchantNumber,
            payerAlias: params.payerAlias,
            amount: params.amount,
            requestBody,
        });

        const req = https.request(url, options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                console.log('Swish API response:', {
                    statusCode: res.statusCode,
                    headers: res.headers,
                    body: data,
                });

                if (res.statusCode === 201) {
                    const location = res.headers['location'];
                    if (!location) {
                        return reject(new Error('Missing Location header in Swish response'));
                    }

                    // Extract payment ID from Location header (use instructionUUID)
                    const id = location.split('/').pop() || instructionUUID;

                    resolve({
                        location: Array.isArray(location) ? location[0] : location,
                        id,
                    });
                } else {
                    // Parse error response
                    try {
                        const errorData = JSON.parse(data);
                        console.error('Swish API error details:', errorData);

                        // Extract all error information
                        const errors = Array.isArray(errorData) ? errorData : [errorData];
                        const errorMessages = errors.map(e => {
                            const parts = [e.errorCode, e.errorMessage, e.additionalInformation].filter(Boolean);
                            return parts.join(' - ');
                        }).join('; ');

                        reject(new Error(`Swish API error (${res.statusCode}): ${errorMessages || 'Unknown error'}`));
                    } catch {
                        console.error('Failed to parse Swish error response:', data);
                        reject(new Error(`Swish API error (${res.statusCode}): ${data || 'Unknown error'}`));
                    }
                }
            });
        });

        req.on('error', (error) => {
            reject(new Error(`Swish API request failed: ${error.message}`));
        });

        req.write(JSON.stringify(requestBody));
        req.end();
    });
}

/**
 * Retrieve payment request status from Swish
 */
export async function getPaymentStatus(
    config: SwishConfig,
    location: string
): Promise<any> {
    return new Promise((resolve, reject) => {
        const options: https.RequestOptions = {
            method: 'GET',
            pfx: config.p12Buffer,
            passphrase: config.passphrase,
            rejectUnauthorized: config.mode === 'PROD',
        };

        const req = https.request(location, options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                if (res.statusCode === 200) {
                    try {
                        resolve(JSON.parse(data));
                    } catch {
                        reject(new Error('Invalid JSON response from Swish'));
                    }
                } else {
                    reject(new Error(`Swish API error (${res.statusCode}): ${data}`));
                }
            });
        });

        req.on('error', (error) => {
            reject(new Error(`Swish API request failed: ${error.message}`));
        });

        req.end();
    });
}
