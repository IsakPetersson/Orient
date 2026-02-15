export type DashboardData = {
    organization: {
        id: number
        name: string
    }
    financialSummary: {
        totalBalance: number
        monthlyIncome: number
        monthlyExpenses: number
        monthlyResult: number
    }
    accounts: Array<{
        id: number
        name: string
        organizationId: number
        createdAt: string
        transactions: Array<{
            id: number
            amount: number
            description: string | null
            category: string | null
            createdAt: string
        }>
    }>
    recentTransactions: Array<{
        id: number
        type: 'income' | 'expense'
        description: string
        amount: number
        date: string
        category: string | null
        accountName: string
    }>
    incomeBreakdown: Array<{
        category: string
        amount: number
    }>
    expenseBreakdown: Array<{
        category: string
        amount: number
    }>
    members: {
        total: number
        paid: number
        unpaid: number
    }
}

async function jsonOrThrow(res: Response) {
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error((data as any)?.error || `Request failed (${res.status})`)
    return data
}

export async function getDashboardData(organizationId: number): Promise<DashboardData> {
    const res = await fetch('/api/dashboard', {
        method: 'GET',
        credentials: 'include',
        headers: {
            'x-org-id': String(organizationId)
        }
    })
    return jsonOrThrow(res)
}

export async function createTransaction(
    organizationId: number,
    accountId: number,
    amount: number,
    description: string,
    category: string
): Promise<any> {
    const res = await fetch('/api/transactions', {
        method: 'POST',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
            'x-org-id': String(organizationId)
        },
        body: JSON.stringify({ accountId, amount, description, category })
    })
    return jsonOrThrow(res)
}

export async function createAccount(organizationId: number, name: string): Promise<any> {
    const res = await fetch('/api/accounts', {
        method: 'POST',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
            'x-org-id': String(organizationId)
        },
        body: JSON.stringify({ name })
    })
    return jsonOrThrow(res)
}

export type OrganizationMember = {
    id: number
    name: string
    email: string
    phone: string | null
    type: string
    fee: number
    paid: boolean
    organizationId: number
    createdAt: string
}

export async function getOrganizationMembers(organizationId: number): Promise<OrganizationMember[]> {
    const res = await fetch('/api/members', {
        method: 'GET',
        credentials: 'include',
        headers: {
            'x-org-id': String(organizationId)
        }
    })
    return jsonOrThrow(res)
}

export async function createMember(
    organizationId: number,
    memberData: {
        name: string
        email: string
        phone?: string
        type: string
        fee: number
        paid: boolean
    }
): Promise<OrganizationMember> {
    const res = await fetch('/api/members', {
        method: 'POST',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
            'x-org-id': String(organizationId)
        },
        body: JSON.stringify(memberData)
    })
    return jsonOrThrow(res)
}
