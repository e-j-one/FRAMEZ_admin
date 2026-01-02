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
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetFooter,
} from "@/components/ui/sheet"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, CheckCircle, Clock } from "lucide-react"
import { PostReportDetails } from "./report-contexts/post-details"
import { UserReportDetails } from "./report-contexts/user-details"
import { CommentReportDetails } from "./report-contexts/comment-details"

export function ReportsTable() {
    const supabase = createClient()
    const queryClient = useQueryClient()
    const [selectedReportId, setSelectedReportId] = useState<string | null>(null)

    // Fetch Reports
    const { data: reports, isLoading } = useQuery({
        queryKey: ['reports'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('reports')
                .select(`
            *,
            reporter:profiles!reporter_id(nickname),
            target_owner:profiles!target_owner_id(nickname)
        `)
                .order('created_at', { ascending: false })

            if (error) throw error
            return data
        }
    })

    // Selected Report Data
    const selectedReport = reports?.find(r => r.id === selectedReportId)

    // Update Mutation
    const updateReportMutation = useMutation({
        mutationFn: async ({ id, status, action, notes, target_type, target_id }: any) => {
            // 1. Perform Action if needed
            if (action === 'removed_content') {
                if (target_type === 'post') {
                    const { error } = await supabase.from('posts').delete().eq('id', target_id)
                    if (error) {
                        console.error('Failed to delete post:', error)
                        throw new Error('Failed to delete post. Check permissions.')
                    }
                } else if (target_type === 'comment') {
                    const { error } = await supabase.from('comments').delete().eq('id', target_id)
                    if (error) {
                        console.error('Failed to delete comment:', error)
                        throw new Error('Failed to delete comment. Check permissions.')
                    }
                }
            }

            // 2. Update Report Status
            const { error } = await supabase.from('reports').update({
                status: action !== 'none' ? 'actioned' : status, // Auto-complete if action taken
                action,
                action_notes: notes,
                triaged_at: new Date().toISOString(),
            }).eq('id', id)
            if (error) throw error
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['reports'] })
            setSelectedReportId(null)
        }
    })

    const [notes, setNotes] = useState('')
    const [status, setStatus] = useState<string>('open')
    const [action, setAction] = useState<string>('none')

    // Load initial state when opening sheet
    const handleOpenSheet = (report: any) => {
        setSelectedReportId(report.id)
        setNotes(report.action_notes || '')
        setStatus(report.status || 'open')
        setAction(report.action || 'none')
    }

    const handleSave = () => {
        if (!selectedReportId) return
        updateReportMutation.mutate({
            id: selectedReportId,
            status,
            action,
            notes,
            target_type: selectedReport?.target_type,
            target_id: selectedReport?.target_id
        })
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'open': return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" /> Open</Badge>
            case 'triaged': return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" /> Triaged</Badge>
            case 'actioned': return <Badge className="bg-green-600 hover:bg-green-700"><CheckCircle className="w-3 h-3 mr-1" /> Actioned</Badge>
            case 'dismissed': return <Badge variant="outline">Dismissed</Badge>
            default: return <Badge>{status}</Badge>
        }
    }

    if (isLoading) return <div className="p-4">Loading reports...</div>

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Created</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead>Target</TableHead>
                        <TableHead>Reporter</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {reports?.map((report) => (
                        <TableRow key={report.id}>
                            <TableCell>{new Date(report.created_at).toLocaleDateString()}</TableCell>
                            <TableCell className="capitalize font-medium">{report.reason}</TableCell>
                            <TableCell>
                                <div className="flex flex-col">
                                    <span className="capitalize text-xs text-muted-foreground">{report.target_type}</span>
                                    {/* @ts-ignore */}
                                    <span>{report.target_owner?.nickname || 'Unknown'}</span>
                                </div>
                            </TableCell>
                            <TableCell>
                                {/* @ts-ignore */}
                                {report.reporter?.nickname || 'Anon'}
                            </TableCell>
                            <TableCell>{getStatusBadge(report.status)}</TableCell>
                            <TableCell className="text-right">
                                <Button variant="outline" size="sm" onClick={() => handleOpenSheet(report)}>
                                    Review
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                    {reports?.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                                No reports found. Good job!
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>

            <Sheet open={!!selectedReportId} onOpenChange={(open) => !open && setSelectedReportId(null)}>
                <SheetContent className="overflow-y-auto sm:max-w-md">
                    <SheetHeader>
                        <SheetTitle>Review Report</SheetTitle>
                        <SheetDescription>
                            Review the reported content and take appropriate action.
                        </SheetDescription>
                    </SheetHeader>

                    {selectedReport && (
                        <div className="grid gap-6 py-4">
                            {/* 1. Report Details */}
                            <div className="space-y-2">
                                <h4 className="font-medium leading-none">Report Details</h4>
                                <div className="text-sm text-muted-foreground grid grid-cols-2 gap-2 border p-3 rounded-md">
                                    <span>Type: <span className="text-foreground capitalize">{selectedReport.reason}</span></span>
                                    <span>Date: <span className="text-foreground">{new Date(selectedReport.created_at).toLocaleDateString()}</span></span>
                                    <span className="col-span-2">Details: <span className="text-foreground block mt-1 p-2 bg-muted rounded italic">{selectedReport.details || 'No details provided'}</span></span>
                                </div>
                            </div>

                            {/* 2. Target Content & Context */}
                            <div className="space-y-2">
                                <h4 className="font-medium leading-none">Context ({selectedReport.target_type})</h4>
                                <div className="border rounded-md p-3 bg-muted/10">
                                    {selectedReport.target_type === 'post' && (
                                        <PostReportDetails postId={selectedReport.target_id} />
                                    )}
                                    {selectedReport.target_type === 'user' && (
                                        <UserReportDetails userId={selectedReport.target_id} />
                                    )}
                                    {selectedReport.target_type === 'comment' && (
                                        <CommentReportDetails commentId={selectedReport.target_id} />
                                    )}
                                    {/* Fallback for unknown types */}
                                    {!['post', 'user', 'comment'].includes(selectedReport.target_type) && (
                                        <p className="text-sm italic text-muted-foreground">Preview not available for this type.</p>
                                    )}
                                </div>
                            </div>

                            {/* 3. Moderation Action */}
                            <div className="space-y-4 pt-4 border-t">
                                <h4 className="font-medium leading-none">Decision</h4>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Status</label>
                                    <Select value={status} onValueChange={setStatus}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="open">Open</SelectItem>
                                            <SelectItem value="triaged">Triaged (Under Review)</SelectItem>
                                            <SelectItem value="actioned">Actioned (Resolved)</SelectItem>
                                            <SelectItem value="dismissed">Dismissed (No Action)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Action Taken</label>
                                    <Select value={action} onValueChange={setAction}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select action" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">None</SelectItem>
                                            <SelectItem value="removed_content">Remove Content</SelectItem>
                                            <SelectItem value="warning_sent">Send Warning</SelectItem>
                                            <SelectItem value="temp_suspend">Suspend User</SelectItem>
                                            <SelectItem value="perm_ban">Permanent Ban</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Internal Notes</label>
                                    <Textarea
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        placeholder="Add notes about this decision..."
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    <SheetFooter>
                        <Button onClick={handleSave} disabled={updateReportMutation.isPending}>
                            {updateReportMutation.isPending ? 'Saving...' : 'Save Decision'}
                        </Button>
                    </SheetFooter>
                </SheetContent>
            </Sheet>
        </div>
    )
}
