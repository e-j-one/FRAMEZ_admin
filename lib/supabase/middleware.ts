import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => {
                        request.cookies.set(name, value)
                    })
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    cookiesToSet.forEach(({ name, value, options }) => {
                        response.cookies.set(name, value, options)
                    })
                },
            },
        }
    )

    const {
        data: { user },
    } = await supabase.auth.getUser()

    // Admin Check Logic
    // 1. If hitting login page, allow
    // 2. If no user, redirect to login
    // 3. If user, check "role" in profiles.

    if (request.nextUrl.pathname.startsWith('/login') || request.nextUrl.pathname.startsWith('/auth')) {
        if (user) {
            // If already logged in, redirect to dashboard? 
            // We might want to check if they are admin first.
            return response
        }
        return response
    }

    if (!user) {
        return NextResponse.redirect(new URL('/login', request.url))
    }

    // Check Admin Role
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    // @ts-ignore - DB types might not have role yet
    if (!profile || profile.role !== 'admin') {
        // Not an admin, sign them out or show error?
        // For now, redirect to a specific error page or back to login
        console.error('Access denied: User is not admin', user.id)
        // Optionally verify if we should sign them out
        return NextResponse.redirect(new URL('/login?error=unauthorized', request.url))
    }

    return response
}
