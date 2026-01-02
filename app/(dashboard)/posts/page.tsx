import { PostsTable } from "@/components/posts-table"

export default function PostsPage() {
    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight">Post Management</h1>
            </div>
            <PostsTable />
        </div>
    )
}
