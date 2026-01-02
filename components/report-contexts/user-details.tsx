"use client"

import { useQuery } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function UserReportDetails({ userId }: { userId: string }) {
    const supabase = createClient()

    const { data: userData, isLoading } = useQuery({
        queryKey: ['user-report-context', userId],
        queryFn: async () => {
            // 1. Profile
            const { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).single()

            // 2. Recent Posts (Last 5)
            const { data: posts } = await supabase
                .from('posts')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(5)

            // 3. Recent Comments (Last 5)
            const { data: comments } = await supabase
                .from('comments')
                .select(`*, post:posts(caption)`)
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(5)

            // 4. Recent Messages (Last 10 - Admin access required)
            const { data: messages } = await supabase
                .from('messages')
                .select('*')
                .eq('sender_id', userId)
                .order('created_at', { ascending: false })
                .limit(10)

            return { profile, posts, comments, messages }
        }
    })

    if (isLoading) return <Skeleton className="h-64 w-full" />
    if (!userData?.profile) return <div className="text-red-500">User not found</div>

    const getImageUrl = (path: string) => {
        if (!path) return null
        const { data } = supabase.storage.from('post_images').getPublicUrl(path)
        return data.publicUrl
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 border rounded-md">
                <Avatar className="h-12 w-12">
                    <AvatarFallback>{userData.profile.nickname?.slice(0, 2) || 'UN'}</AvatarFallback>
                </Avatar>
                <div>
                    <h4 className="font-bold text-lg">{userData.profile.nickname}</h4>
                    <p className="text-sm text-muted-foreground">{userData.profile.gender} • Joined {new Date(userData.profile.created_at).toLocaleDateString()}</p>
                </div>
            </div>

            <Tabs defaultValue="posts">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="posts">Posts ({userData.posts?.length})</TabsTrigger>
                    <TabsTrigger value="comments">Comments ({userData.comments?.length})</TabsTrigger>
                    <TabsTrigger value="messages">Messages ({userData.messages?.length})</TabsTrigger>
                </TabsList>

                <TabsContent value="posts" className="space-y-2">
                    {userData.posts?.map(post => (
                        <div key={post.id} className="flex gap-2 p-2 border rounded">
                            {post.image_path && (
                                <div className="h-12 w-12 bg-black rounded overflow-hidden flex-shrink-0">
                                    <img src={getImageUrl(post.image_path) || ''} alt="" className="h-full w-full object-cover" />
                                </div>
                            )}
                            <div className="text-sm">
                                <p className="font-medium line-clamp-1">{post.caption || 'No Caption'}</p>
                                <p className="text-xs text-muted-foreground">{new Date(post.created_at).toLocaleDateString()}</p>
                            </div>
                        </div>
                    ))}
                    {userData.posts?.length === 0 && <p className="text-center text-sm p-4 text-muted-foreground">No recent posts</p>}
                </TabsContent>

                <TabsContent value="comments" className="space-y-2">
                    {userData.comments?.map(comment => (
                        <div key={comment.id} className="p-2 border rounded text-sm">
                            <p>"{comment.content}"</p>
                            {/* @ts-ignore */}
                            <p className="text-xs text-muted-foreground mt-1">On post: {comment.post?.caption ? `"${comment.post.caption.slice(0, 20)}..."` : 'Deleted Post'}</p>
                        </div>
                    ))}
                    {userData.comments?.length === 0 && <p className="text-center text-sm p-4 text-muted-foreground">No recent comments</p>}
                </TabsContent>

                <TabsContent value="messages" className="space-y-2">
                    <div className="rounded-md bg-muted p-2 text-xs text-muted-foreground mb-2 flex items-center gap-1">
                        <span>⚠️ Admin view only</span>
                    </div>
                    {userData.messages?.map(msg => (
                        <div key={msg.id} className="p-2 border rounded text-sm bg-muted/20">
                            <p>{msg.content}</p>
                            <p className="text-xs text-muted-foreground mt-1">{new Date(msg.created_at).toLocaleString()}</p>
                        </div>
                    ))}
                    {userData.messages?.length === 0 && <p className="text-center text-sm p-4 text-muted-foreground">No recent messages found</p>}
                </TabsContent>
            </Tabs>
        </div>
    )
}
