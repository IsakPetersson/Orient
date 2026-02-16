# Swish Payment Integration

## Implementation Complete ✓

A comprehensive Swish payment integration has been implemented with the following features:

### Backend Implementation

#### 1. Database Schema (`prisma/schema.prisma`)
- **Organization Model** - Added encrypted certificate storage:
  - `swishMerchantNumber` - Merchant Swish number
  - `swishMode` - TEST or PROD environment
  - `swishP12Ciphertext/Iv/Tag` - Encrypted .p12 certificate (AES-256-GCM)
  - `swishPassCiphertext/Iv/Tag` - Encrypted certificate passphrase (AES-256-GCM)

- **SwishPaymentRequest Model** - Track all payment requests:
  - Payment details (payeeAlias, payerAlias, amount, currency, message)
  - Unique payment reference (payeePaymentReference)
  - Status tracking (CREATED, PENDING, PAID, DECLINED, ERROR, CANCELLED)
  - Callback information (swishLocation, callbackReceivedAt)
  - Optional transaction booking (bookAccountId, transactionId)
  - Relations to Organization and User

#### 2. Encryption Library (`lib/crypto.ts`)
- AES-256-GCM encryption for sensitive data
- Separate storage of ciphertext, IV (12 bytes), and auth tag (16 bytes)
- Functions: `encryptBytes`, `decryptBytes`, `encryptString`, `decryptString`
- Uses `PLATFORM_ENCRYPTION_KEY_BASE64` environment variable (32-byte key)

#### 3. Swish API Client (`lib/swish.ts`)
- mTLS authentication using decrypted .p12 certificates
- Support for both MSS (test) and production environments
- `loadSwishConfig()` - Decrypt and load org Swish configuration
- `createPaymentRequest()` - Send payment request to Swish API
- `getPaymentStatus()` - Check payment status from Swish
- Proper error handling and timeout management

#### 4. API Endpoints

**`/api/swish-config` (OWNER/ADMIN only)**
- `GET` - Return configuration status (no secrets exposed)
- `POST` - Upload and encrypt merchant number, mode, certificate, passphrase

**`/api/swish-requests` (OWNER/ADMIN only)**
- `GET` - List all payment requests for organization
- `POST` - Create new payment request
  - Phone number normalization (various formats → "4670123456")
  - Unique payment reference generation
  - Optional account booking
  - Callback URL generation with secret

**`/api/swish-requests/[id]`**
- `GET` - Get single payment request details (org-scoped)

**`/api/swish-callback` (Public with secret)**
- `POST` - Receive Swish payment callbacks
- Secret validation via query parameter
- Idempotent handling (prevent duplicate processing)
- Automatic transaction booking when status is PAID

#### 5. Helper Functions (`lib/org.ts`)
- `requireOrgAdmin()` - Validate OWNER or ADMIN role
- `requireOrgMember()` - Validate org membership
- `getOrgIdFromHeader()` - Extract x-org-id from headers

### Frontend Implementation

#### 6. Organization Settings (`src/views/OrganizationSettings.vue`)
- **Configuration Status Display**
  - Shows if Swish is configured (with mode: TEST/PROD)
  - Green success badge or yellow warning badge

- **Configuration Form**
  - Merchant number input
  - Mode selection (TEST/PROD)
  - Certificate file upload (.p12/.pfx)
  - Passphrase input (password field)
  - Validation and file size limits (max 50KB)

- **Save Functionality**
  - Reads certificate file as ArrayBuffer
  - Converts to base64
  - Sends to API with encrypted storage
  - Clears sensitive fields after save
  - Shows success/error messages

#### 7. Dashboard / Services (`src/views/Services.vue`)
- **Swish Payment Modal**
  - Phone number input (accepts various formats)
  - Amount input (validated, min 1 kr)
  - Description with preset buttons (Medlemsavgift, Tävlingsavgift, etc.)
  - Optional account selection for automatic booking
  - Character counter for description (max 50 chars)

- **Payment Request Submission**
  - Calls `/api/swish-requests` endpoint
  - Shows success alert with details
  - Reloads dashboard data after submission
  - Error handling with user-friendly messages

### Security Features

1. **Encryption at Rest**
   - AES-256-GCM with authenticated encryption
   - Separate IV and auth tag storage
   - Never log certificate content or passphrases

2. **Access Control**
   - OWNER/ADMIN required for Swish configuration
   - OWNER/ADMIN required for creating payment requests
   - All operations org-scoped via x-org-id header
   - Cross-org access prevention

3. **Callback Security**
   - Public endpoint but secret-protected
   - Secret validation via `SWISH_CALLBACK_SECRET` env var
   - Idempotent handling to prevent duplicate bookings

4. **Input Validation**
   - Phone number normalization and validation
   - Amount validation (positive, decimal)
   - File type and size validation (.p12/.pfx, max 50KB)
   - Message length limits (max 50 chars per Swish API)

### Environment Variables Required

Add these to your `.env` file and Vercel environment:

```bash
# Platform encryption key (base64-encoded 32-byte key)
# Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
PLATFORM_ENCRYPTION_KEY_BASE64="your-base64-encoded-32-byte-key"

# Swish callback secret (any random string)
# Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
SWISH_CALLBACK_SECRET="your-random-secret-string"
```

### Flow Diagram

```
1. Organization Settings
   └─> Owner/Admin uploads .p12 cert + passphrase + merchant number
       └─> Backend encrypts and stores in DB

2. Dashboard - Swish Payment
   └─> User enters phone, amount, message, optional account
       └─> Backend decrypts cert
           └─> Calls Swish API with mTLS
               └─> Stores payment request in DB
               └─> Returns success to frontend

3. Swish Callback (async)
   └─> Swish API calls /api/swish-callback
       └─> Backend validates secret
           └─> Updates payment status
           └─> (If PAID + bookAccountId) Creates transaction
           └─> Returns 200 to Swish
```

### Testing Steps

1. **Set Environment Variables**
   ```bash
   PLATFORM_ENCRYPTION_KEY_BASE64=<base64-encoded-32-bytes>
   SWISH_CALLBACK_SECRET=<random-secret>
   ```

2. **Configure Swish (TEST mode recommended)**
   - Go to Organization Settings
   - Enter TEST merchant number from Swish MSS
   - Select "Test (MSS)" mode
   - Upload TEST .p12 certificate
   - Enter certificate passphrase
   - Click "Spara Swish-konfiguration"

3. **Request Payment**
   - Go to Dashboard
   - Click "Swish Betalning"
   - Enter phone number (e.g., "070 123 45 67")
   - Enter amount (e.g., 100)
   - Select/enter description
   - Optionally select account for booking
   - Click "Begär Betalning"

4. **Verify in Database**
   ```sql
   SELECT * FROM "SwishPaymentRequest" 
   WHERE "organizationId" = <your-org-id> 
   ORDER BY "createdAt" DESC;
   ```

5. **Test Callback** (in TEST environment)
   - Swish will call your callback URL automatically
   - Check logs for callback processing
   - Verify status updates in database
   - If account selected, verify transaction created

### Known Limitations & Future Enhancements

- No real-time status updates (polling required in future)
- No refund functionality (future enhancement)
- No certificate expiration warnings (future enhancement)
- No payment request cancellation UI (future enhancement)
- Frontend doesn't show payment request history yet (future enhancement)

### Files Created/Modified

**Created:**
- `lib/crypto.ts` - Encryption helpers
- `lib/swish.ts` - Swish API client
- `api/swish-config.ts` - Configuration endpoint
- `api/swish-requests.ts` - Payment requests endpoint
- `api/swish-requests/[id].ts` - Single request endpoint
- `api/swish-callback.ts` - Callback endpoint

**Modified:**
- `prisma/schema.prisma` - Added Swish models and fields
- `lib/org.ts` - Added requireOrgAdmin helper
- `src/views/OrganizationSettings.vue` - Added Swish configuration UI
- `src/views/Services.vue` - Added booking account selection

**Database:**
- Ran `npx prisma db push` to apply schema changes
- Ran `npx prisma generate` to update Prisma client

### Deployment Notes

1. Add environment variables in Vercel dashboard
2. Ensure `VERCEL_URL` is set automatically by Vercel
3. Set callback URLs in Swish merchant portal
4. For production, use PROD certificates and mode
5. Monitor callback logs for any issues

## 🎉 Implementation Complete!

The Swish payment integration is now fully functional and ready for testing in the MSS (test) environment. Once tested, you can switch to production mode with production certificates.
