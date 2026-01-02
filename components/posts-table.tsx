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
import { Button } from "@/components/ui/button"
import { MoreHorizontal, Trash2, ExternalLink } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

export function PostsTable() {
    const supabase = createClient()
    const queryClient = useQueryClient()

    const { data: posts, isLoading } = useQuery({
        queryKey: ['posts'],
        queryFn: async () => {
            // Fetch posts with author info
            const { data, error } = await supabase
                .from('posts')
                .select(`
            *,
            author:profiles!user_id(nickname)
        `)
                .order('created_at', { ascending: false })

            if (error) throw error
            return data
        }
    })

    const deletePostMutation = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from('posts').delete().eq('id', id)
            if (error) throw error
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['posts'] })
        }
    })

    // Helper to get image URL
    const getImageUrl = (path: string) => {
        const { data } = supabase.storage.from('post_images').getPublicUrl(path)
        return data.publicUrl
    }

    if (isLoading) {
        return <div className="p-4">Loading posts...</div>
    }

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[100px]">Image</TableHead>
                        <TableHead>Caption</TableHead>
                        <TableHead>Author</TableHead>
                        <TableHead>Visibility</TableHead>
                        <TableHead>Created At</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {posts?.map((post) => (
                        <TableRow key={post.id}>
                            <TableCell>
                                <div className="h-12 w-12 overflow-hidden rounded-md border bg-muted">
                                    <img
                                        src={getImageUrl(post.image_path)}
                                        alt="Post"
                                        className="h-full w-full object-cover"
                                        loading="lazy"
                                    />
                                </div>
                            </TableCell>
                            <TableCell className="max-w-[300px] truncate" title={post.caption || ''}>
                                {post.caption || <span className="text-muted-foreground italic">No caption</span>}
                            </TableCell>
                            <TableCell>
                                {/* @ts-ignore relationship typing */}
                                {post.author?.nickname || 'Unknown'}
                            </TableCell>
                            <TableCell className="capitalize">{post.visibility}</TableCell>
                            <TableCell>{new Date(post.created_at).toLocaleDateString()}</TableCell>
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
                                        <DropdownMenuItem>
                                            <ExternalLink className="mr-2 h-4 w-4" />
                                            View Full Size
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            className="text-red-600 focus:text-red-600"
                                            onClick={() => {
                                                if (confirm('Are you sure you want to delete this post?')) {
                                                    deletePostMutation.mutate(post.id)
                                                }
                                            }}
                                        >
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            Delete Post
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
