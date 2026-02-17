import { prisma } from "./prisma.js";

interface CreateTransactionArgs {
    organizationId: number;
    accountId: number;
    amount: number;
    description?: string | null;
    category?: string | null;
    voucherSeries?: string;
}

/**
 * Creates a transaction with a sequential voucher number for the given organization.
 * This ensures compliance with Swedish Bookkeeping Act regarding sequential numbering.
 * Defaults to Series A.
 * 
 * @param args Transaction details
 */
export async function createTransaction(args: CreateTransactionArgs) {
    const { organizationId, accountId, amount, description, category, voucherSeries = 'A' } = args;

    // Use a Prisma transaction to ensure atomicity
    return await prisma.$transaction(async (tx) => {
        // 1. Verify account belongs to organization
        const account = await tx.account.findFirst({
            where: { id: accountId, organizationId },
        });

        if (!account) {
            throw new Error(`Account ${accountId} does not belong to organization ${organizationId}`);
        }

        // 2. We need to find the MAX voucher number for this organization and series.
        // BUT we can't easily query distinct on join without raw query or careful structured query.
        // We want the highest voucher number in the transaction table where transaction.account.organizationId == organizationId

        // Find the last transaction for this org + series
        const lastTransaction = await tx.transaction.findFirst({
            where: {
                account: {
                    organizationId: organizationId
                },
                voucherSeries: voucherSeries
            },
            orderBy: {
                voucherNumber: 'desc'
            }
        });

        const nextVoucherNumber = (lastTransaction?.voucherNumber || 0) + 1;

        // 3. Create the transaction
        const newTransaction = await tx.transaction.create({
            data: {
                accountId,
                amount,
                description: description || null,
                category: category || null,
                voucherSeries,
                voucherNumber: nextVoucherNumber
            }
        });

        return newTransaction;
    });
}
