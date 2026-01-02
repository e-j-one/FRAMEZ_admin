import { ReportsTable } from "@/components/reports-table"

export default function ReportsPage() {
    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight">Report Management</h1>
            </div>
            <ReportsTable />
        </div>
    )
}
