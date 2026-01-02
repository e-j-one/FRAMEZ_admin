'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'

export async function login(prevState: any, formData: FormData) {
    const supabase = await createClient()

    const email = formData.get('email') as string
    const password = formData.get('password') as string

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    })

    if (error) {
        return { error: error.message }
    }

    // Check if admin inside action? 
    // Middleware handles subsequent requests, but good to check here so we don't redirect to dashboard if not admin.
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
        // @ts-ignore
        if (profile?.role !== 'admin') {
            await supabase.auth.signOut()
            return { error: 'Access denied. You are not an administrator.' }
        }
    }

    revalidatePath('/', 'layout')
    redirect('/')
}
