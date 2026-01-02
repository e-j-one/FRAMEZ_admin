"use client"

import { useState } from "react"
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
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Megaphone, Plus, User, Users, Trash2 } from "lucide-react"
import { Label } from "@/components/ui/label"

export function NoticesTable() {
    const supabase = createClient()
    const queryClient = useQueryClient()
    const [isCreateOpen, setIsCreateOpen] = useState(false)

    // Fetch Notices
    const { data: notices, isLoading } = useQuery({
        queryKey: ['notices'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('notices')
                .select(`
            *,
            recipient:profiles!recipient_id(nickname),
            creator:profiles!created_by(nickname)
        `)
                .order('created_at', { ascending: false })

            if (error) throw error
            return data
        }
    })

    // Create Mutation
    const createNoticeMutation = useMutation({
        mutationFn: async (formData: any) => {
            const { data: { user } } = await supabase.auth.getUser()

            const payload = {
                scope: formData.scope,
                title: formData.title,
                body: formData.body,
                severity: formData.severity,
                created_by: user?.id,
                recipient_id: formData.scope === 'user' ? formData.recipient_id : null,
            }

            const { error } = await supabase.from('notices').insert(payload)
            if (error) throw error
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notices'] })
            setIsCreateOpen(false)
            setNewNotice({ scope: 'global', title: '', body: '', severity: 'info', recipient_id: '' })
        }
    })

    // Delete Mutation
    const deleteNoticeMutation = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from('notices').delete().eq('id', id)
            if (error) throw error
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notices'] })
        }
    })

    const [newNotice, setNewNotice] = useState({
        scope: 'global',
        title: '',
        body: '',
        severity: 'info',
        recipient_id: ''
    })

    const handleCreate = () => {
        if (!newNotice.title) return alert('Title is required')
        if (newNotice.scope === 'user' && !newNotice.recipient_id) return alert('Recipient ID is required for user notices') // In real app, use a user picker
        createNoticeMutation.mutate(newNotice)
    }

    const getSeverityBadge = (severity: string) => {
        switch (severity) {
            case 'info': return <Badge variant="secondary">Info</Badge>
            case 'warning': return <Badge className="bg-yellow-500 hover:bg-yellow-600">Warning</Badge>
            case 'critical': return <Badge variant="destructive">Critical</Badge>
            default: return <Badge>{severity}</Badge>
        }
    }

    if (isLoading) return <div className="p-4">Loading notices...</div>

    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="w-4 h-4 mr-2" />
                            Create Notice
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create New Notice</DialogTitle>
                            <DialogDescription>
                                Send a notification to all users (Global) or a specific user.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="scope" className="text-right">Scope</Label>
                                <Select
                                    value={newNotice.scope}
                                    onValueChange={(val) => setNewNotice({ ...newNotice, scope: val })}
                                >
                                    <SelectTrigger className="col-span-3">
                                        <SelectValue placeholder="Select scope" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="global">Global (All Users)</SelectItem>
                                        <SelectItem value="user">Single User</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            {newNotice.scope === 'user' && (
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="recipient" className="text-right">User ID</Label>
                                    <Input
                                        id="recipient"
                                        placeholder="UUID of user"
                                        className="col-span-3"
                                        value={newNotice.recipient_id}
                                        onChange={(e) => setNewNotice({ ...newNotice, recipient_id: e.target.value })}
                                    />
                                </div>
                            )}
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="severity" className="text-right">Severity</Label>
                                <Select
                                    value={newNotice.severity}
                                    onValueChange={(val) => setNewNotice({ ...newNotice, severity: val })}
                                >
                                    <SelectTrigger className="col-span-3">
                                        <SelectValue placeholder="Select severity" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="info">Info</SelectItem>
                                        <SelectItem value="warning">Warning</SelectItem>
                                        <SelectItem value="critical">Critical</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="title" className="text-right">Title</Label>
                                <Input
                                    id="title"
                                    placeholder="Notice title"
                                    className="col-span-3"
                                    value={newNotice.title}
                                    onChange={(e) => setNewNotice({ ...newNotice, title: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="body" className="text-right">Body</Label>
                                <Textarea
                                    id="body"
                                    placeholder="Notice content..."
                                    className="col-span-3"
                                    value={newNotice.body}
                                    onChange={(e) => setNewNotice({ ...newNotice, body: e.target.value })}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button onClick={handleCreate} disabled={createNoticeMutation.isPending}>
                                {createNoticeMutation.isPending ? 'Sending...' : 'Send Notice'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Created</TableHead>
                            <TableHead>Title</TableHead>
                            <TableHead>Scope</TableHead>
                            <TableHead>Severity</TableHead>
                            <TableHead>Creator</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {notices?.map((notice) => (
                            <TableRow key={notice.id}>
                                <TableCell>{new Date(notice.created_at).toLocaleDateString()}</TableCell>
                                <TableCell className="font-medium">
                                    <div>{notice.title}</div>
                                    <div className="text-xs text-muted-foreground truncate max-w-[300px]">{notice.body}</div>
                                </TableCell>
                                <TableCell>
                                    {notice.scope === 'global' ? (
                                        <Badge variant="outline"><Users className="w-3 h-3 mr-1" /> Global</Badge>
                                    ) : (
                                        <div className="flex items-center text-sm">
                                            <User className="w-3 h-3 mr-1 text-muted-foreground" />
                                            {/* @ts-ignore */}
                                            {notice.recipient?.nickname || 'Specific User'}
                                        </div>
                                    )}
                                </TableCell>
                                <TableCell>{getSeverityBadge(notice.severity)}</TableCell>
                                <TableCell>
                                    {/* @ts-ignore */}
                                    <span className="text-xs text-muted-foreground">{notice.creator?.nickname || 'Admin'}</span>
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                        onClick={() => {
                                            if (confirm('Are you sure you want to delete this notice?')) {
                                                deleteNoticeMutation.mutate(notice.id)
                                            }
                                        }}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                        {notices?.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                                    No notices sent yet.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
