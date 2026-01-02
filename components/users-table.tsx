"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, ShieldAlert, ShieldCheck, Copy, Check } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useState } from "react"

export function UsersTable() {
    const supabase = createClient()
    const queryClient = useQueryClient()
    const [copiedId, setCopiedId] = useState<string | null>(null)

    const { data: users, isLoading } = useQuery({
        queryKey: ['users'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: false })

            if (error) throw error
            return data
        }
    })

    // Placeholder mutation for banning (will need backend support)
    const toggleRoleMutation = useMutation({
        mutationFn: async ({ id, role }: { id: string, role: 'user' | 'moderator' }) => {
            // Only allow admins to do this.
            const { error } = await supabase.from('profiles').update({ role }).eq('id', id)
            if (error) throw error
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] })
        }
    })

    const handleCopy = (id: string) => {
        navigator.clipboard.writeText(id)
        setCopiedId(id)
        setTimeout(() => setCopiedId(null), 2000)
    }

    if (isLoading) {
        return <div className="p-4">Loading users...</div>
    }

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[100px]">Avatar</TableHead>
                        <TableHead>User Details</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Joined</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {users?.map((user) => (
                        <TableRow key={user.id}>
                            <TableCell>
                                <Avatar>
                                    <AvatarFallback>{user.nickname?.slice(0, 2).toUpperCase() || 'UN'}</AvatarFallback>
                                </Avatar>
                            </TableCell>
                            <TableCell>
                                <div className="flex flex-col gap-1">
                                    <span className="font-medium">{user.nickname || 'Anonymous'}</span>
                                    <div className="flex items-center text-xs text-muted-foreground gap-2">
                                        <span className="font-mono">{user.id.slice(0, 8)}...</span>
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-4 w-4"
                                                        onClick={() => handleCopy(user.id)}
                                                    >
                                                        {copiedId === user.id ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>{copiedId === user.id ? 'Copied!' : 'Copy UUID'}</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell>
                                <Badge variant={user.role === 'admin' ? 'destructive' : 'secondary'}>
                                    {user.role}
                                </Badge>
                            </TableCell>
                            <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                            <TableCell className="text-right">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                            <span className="sr-only">Open menu</span>
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                        <DropdownMenuItem
                                            onClick={() => toggleRoleMutation.mutate({ id: user.id, role: 'moderator' })}
                                        >
                                            <ShieldCheck className="mr-2 h-4 w-4" />
                                            Make Moderator
                                        </DropdownMenuItem>
                                        <DropdownMenuItem className="text-red-600">
                                            <ShieldAlert className="mr-2 h-4 w-4" />
                                            Ban User (TBD)
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}
