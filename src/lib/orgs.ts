export type Organization = {
    id: number
    name: string
    createdAt: string
}

export type OrganizationMembership = {
    organizationId: number
    role: string
    organization: Organization
}

async function jsonOrThrow(res: Response) {
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error((data as any)?.error || `Request failed (${res.status})`)
    return data
}

export async function getUserOrganizations(): Promise<OrganizationMembership[]> {
    const res = await fetch('/api/orgs/me', {
        method: 'GET',
        credentials: 'include'
    })
    return jsonOrThrow(res)
}

export async function createOrganization(name: string): Promise<{ organization: Organization, invite: { code: string, expiresAt: string | null } }> {
    const res = await fetch('/api/orgs/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name })
    })
    return jsonOrThrow(res)
}

export async function joinOrganization(code: string): Promise<{ organization: Organization, role: string }> {
    const res = await fetch('/api/orgs/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ code })
    })
    return jsonOrThrow(res)
}

export async function getOrganizationInvite(organizationId: number): Promise<{ code: string }> {
    const res = await fetch('/api/orgs/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ organizationId })
    })
    return jsonOrThrow(res)
}

export async function deleteOrganization(organizationId: number): Promise<{ success: boolean, message: string }> {
    const res = await fetch('/api/orgs/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ organizationId })
    })
    return jsonOrThrow(res)
}
