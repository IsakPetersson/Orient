import crypto from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const TAG_LENGTH = 16;

/**
 * Get the platform encryption key from environment variables.
 * The key should be a base64-encoded 32-byte key.
 */
export function getPlatformKey(): Buffer {
    const keyBase64 = process.env.PLATFORM_ENCRYPTION_KEY_BASE64;
    if (!keyBase64) {
        throw new Error('PLATFORM_ENCRYPTION_KEY_BASE64 environment variable is not set');
    }

    const key = Buffer.from(keyBase64, 'base64');
    if (key.length !== 32) {
        throw new Error('Platform encryption key must be 32 bytes (256 bits)');
    }

    return key;
}

/**
 * Encrypt bytes using AES-256-GCM.
 * Returns { ciphertext, iv, tag } as separate Buffers.
 */
export function encryptBytes(
    plaintext: Buffer
): { ciphertext: Buffer; iv: Buffer; tag: Buffer } {
    const key = getPlatformKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    const ciphertext = Buffer.concat([
        cipher.update(plaintext),
        cipher.final(),
    ]);

    const tag = cipher.getAuthTag();

    return { ciphertext, iv, tag };
}

/**
 * Decrypt bytes using AES-256-GCM.
 * Requires ciphertext, iv, and tag as separate Buffers or Uint8Arrays.
 */
export function decryptBytes(
    ciphertext: Buffer | Uint8Array,
    iv: Buffer | Uint8Array,
    tag: Buffer | Uint8Array
): Buffer {
    const key = getPlatformKey();

    // Convert to Buffer if Uint8Array
    const ivBuf = Buffer.from(iv);
    const tagBuf = Buffer.from(tag);
    const ciphertextBuf = Buffer.from(ciphertext);

    // Validate inputs
    if (ivBuf.length !== IV_LENGTH) {
        throw new Error(`IV must be ${IV_LENGTH} bytes`);
    }
    if (tagBuf.length !== TAG_LENGTH) {
        throw new Error(`Authentication tag must be ${TAG_LENGTH} bytes`);
    }

    const decipher = crypto.createDecipheriv(ALGORITHM, key, ivBuf);
    decipher.setAuthTag(tagBuf);

    try {
        return Buffer.concat([
            decipher.update(ciphertextBuf),
            decipher.final(),
        ]);
    } catch (error) {
        throw new Error('Decryption failed: authentication failed or corrupted data');
    }
}

/**
 * Encrypt a string using AES-256-GCM.
 * Returns { ciphertext, iv, tag } as separate Buffers.
 */
export function encryptString(
    plaintext: string
): { ciphertext: Buffer; iv: Buffer; tag: Buffer } {
    return encryptBytes(Buffer.from(plaintext, 'utf8'));
}

/**
 * Decrypt a string using AES-256-GCM.
 * Requires ciphertext, iv, and tag as separate Buffers or Uint8Arrays.
 */
export function decryptString(
    ciphertext: Buffer | Uint8Array,
    iv: Buffer | Uint8Array,
    tag: Buffer | Uint8Array
): string {
    const plaintext = decryptBytes(ciphertext, iv, tag);
    return plaintext.toString('utf8');
}
