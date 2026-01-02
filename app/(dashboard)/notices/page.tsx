import { NoticesTable } from "@/components/notices-table"

export default function NoticesPage() {
    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight">System Notices</h1>
            </div>
            <NoticesTable />
        </div>
    )
}
