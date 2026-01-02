"use client"

import { useQuery } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

export function PostReportDetails({ postId }: { postId: string }) {
    const supabase = createClient()

    // Fetch Post + Comments
    const { data: post, isLoading } = useQuery({
        queryKey: ['post-details', postId],
        queryFn: async () => {
            // 1. Get Post
            const { data: postData, error: postError } = await supabase
                .from('posts')
                .select(`
            *,
            author:profiles!user_id(nickname)
        `)
                .eq('id', postId)
                .single()

            if (postError) throw postError

            // 2. Get Comments
            const { data: comments, error: commentsError } = await supabase
                .from('comments')
                .select(`
            id,
            content,
            created_at,
            user_id,
            author:profiles!user_id(nickname)
         `)
                .eq('post_id', postId)
                .order('created_at', { ascending: true })

            if (commentsError) throw commentsError

            return { ...postData, comments }
        }
    })

    if (isLoading) return <Skeleton className="h-64 w-full" />
    if (!post) return <div className="text-red-500">Post not found (might be deleted)</div>

    const getImageUrl = (path: string) => {
        if (!path) return null
        const { data } = supabase.storage.from('post_images').getPublicUrl(path)
        return data.publicUrl
    }

    return (
        <div className="space-y-6">
            {/* Post Content */}
            <div className="rounded-md border p-4 space-y-3">
                <h4 className="font-semibold text-sm text-muted-foreground">Reported Post</h4>
                <div className="aspect-square w-full max-h-[300px] bg-black rounded-md overflow-hidden flex items-center justify-center">
                    <img src={getImageUrl(post.image_path) || ''} alt="Post" className="h-full object-contain" />
                </div>
                <div className="space-y-1">
                    {/* @ts-ignore */}
                    <p className="text-sm font-medium">@{post.author?.nickname}</p>
                    <p className="text-sm">{post.caption}</p>
                </div>
            </div>

            {/* Comments Section */}
            <div className="space-y-3">
                <h4 className="font-semibold text-sm text-muted-foreground">Comments ({post.comments?.length || 0})</h4>
                <div className="space-y-2 max-h-[200px] overflow-y-auto border rounded-md p-2">
                    {post.comments?.map((comment) => (
                        <div key={comment.id} className="flex gap-2 p-2 rounded hover:bg-muted/50 text-sm">
                            <Avatar className="w-6 h-6">
                                {/* @ts-ignore */}
                                <AvatarFallback className="text-[10px]">{comment.author?.nickname?.slice(0, 2)}</AvatarFallback>
                            </Avatar>
                            <div>
                                {/* @ts-ignore */}
                                <span className="font-semibold mr-2">{comment.author?.nickname}</span>
                                <span>{comment.content}</span>
                            </div>
                        </div>
                    ))}
                    {post.comments?.length === 0 && <p className="text-sm text-muted-foreground italic">No comments</p>}
                </div>
            </div>
        </div>
    )
}
