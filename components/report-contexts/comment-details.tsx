"use client"

import { useQuery } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

export function CommentReportDetails({ commentId }: { commentId: string }) {
    const supabase = createClient()

    const { data: commentData, isLoading } = useQuery({
        queryKey: ['comment-report-context', commentId],
        queryFn: async () => {
            // 1. Comment
            const { data: comment, error } = await supabase
                .from('comments')
                .select(`
            *,
            author:profiles!user_id(nickname),
            post:posts!post_id(
                id, 
                caption, 
                image_path,
                author:profiles!user_id(nickname)
            )
        `)
                .eq('id', commentId)
                .single()

            if (error) throw error
            return comment
        }
    })

    if (isLoading) return <Skeleton className="h-40 w-full" />
    if (!commentData) return <div className="text-red-500">Comment not found</div>

    const getImageUrl = (path: string) => {
        if (!path) return null
        const { data } = supabase.storage.from('post_images').getPublicUrl(path)
        return data.publicUrl
    }

    return (
        <div className="space-y-4">
            {/* The Reported Comment */}
            <div className="p-4 border border-red-200 bg-red-50 dark:bg-red-950/20 rounded-md">
                <h4 className="font-semibold text-xs text-red-600 mb-2 uppercase tracking-wide">Reported Comment</h4>
                <div className="flex gap-3">
                    <Avatar className="w-8 h-8">
                        {/* @ts-ignore */}
                        <AvatarFallback>{commentData.author?.nickname?.slice(0, 2)}</AvatarFallback>
                    </Avatar>
                    <div>
                        {/* @ts-ignore */}
                        <p className="font-medium text-sm">{commentData.author?.nickname}</p>
                        <p className="text-base">{commentData.content}</p>
                        <p className="text-xs text-muted-foreground mt-1">{new Date(commentData.created_at).toLocaleString()}</p>
                    </div>
                </div>
            </div>

            {/* Context: The Parent Post */}
            {/* @ts-ignore */}
            {commentData.post && (
                <div className="p-4 border rounded-md bg-muted/30">
                    <h4 className="font-semibold text-xs text-muted-foreground mb-2 uppercase tracking-wide">Context: Parent Post</h4>
                    <div className="flex gap-4">
                        <div className="h-16 w-16 bg-black rounded overflow-hidden flex-shrink-0">
                            {/* @ts-ignore */}
                            <img src={getImageUrl(commentData.post.image_path) || ''} alt="" className="h-full w-full object-cover" />
                        </div>
                        <div>
                            {/* @ts-ignore */}
                            <p className="font-medium text-sm">@{commentData.post.author?.nickname}</p>
                            {/* @ts-ignore */}
                            <p className="text-sm line-clamp-2">{commentData.post.caption}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
