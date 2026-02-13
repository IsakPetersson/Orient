export type SafeUser = {
    id: number
    email: string
    name: string
    createdAt: string
}

async function jsonOrThrow(res: Response) {
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error((data as any)?.error || `Request failed (${res.status})`)
    return data
}

export async function login(email: string, password: string, rememberMe: boolean): Promise<SafeUser> {
    const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password, rememberMe })
    })
    return jsonOrThrow(res)
}

export async function register(email: string, name: string, password: string, rememberMe: boolean): Promise<SafeUser> {
    const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, name, password, rememberMe })
    })
    return jsonOrThrow(res)
}

export async function logout(): Promise<void> {
    const res = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
    })
    await jsonOrThrow(res)
}

export async function getCurrentUser(): Promise<SafeUser | null> {
    try {
        const res = await fetch('/api/auth/me', {
            method: 'GET',
            credentials: 'include'
        })
        if (!res.ok) return null
        return await res.json()
    } catch {
        return null
    }
}