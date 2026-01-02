'use client'

import { useActionState } from 'react'
import { login } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

const initialState = {
    error: '',
}

export default function LoginPage() {
    const [state, formAction, isPending] = useActionState(login, initialState)

    return (
        <div className="flex h-screen w-full items-center justify-center bg-zinc-950 p-4">
            <Card className="w-full max-w-sm border-zinc-800 bg-zinc-900 text-zinc-50">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold text-center">Framez Admin</CardTitle>
                    <CardDescription className="text-center text-zinc-400">
                        Enter your credentials to access the dashboard.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form id="login-form" action={formAction} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-zinc-200">Email</Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="admin@framez.com"
                                required
                                className="bg-zinc-950 border-zinc-800 text-white placeholder:text-zinc-600 focus-visible:ring-rose-500"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-zinc-200">Password</Label>
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                required
                                className="bg-zinc-950 border-zinc-800 text-white placeholder:text-zinc-600 focus-visible:ring-rose-500"
                            />
                        </div>
                        {state?.error && (
                            <p className="text-sm text-red-500 text-center font-medium">
                                {state.error}
                            </p>
                        )}
                    </form>
                </CardContent>
                <CardFooter>
                    <Button
                        className="w-full bg-rose-600 hover:bg-rose-700 text-white"
                        form="login-form"
                        type="submit"
                        disabled={isPending}
                    >
                        {isPending ? 'Signing In...' : 'Sign In'}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    )
}
