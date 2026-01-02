"use client"

import * as React from "react"
import {
    Users,
    Frame,
    Flag,
    BarChart3,
    Command,
    LogOut,
    Megaphone,
} from "lucide-react"

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarRail,
    SidebarProvider,
    SidebarTrigger,
    SidebarInset,
} from "@/components/ui/sidebar"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { createClient } from "@/lib/supabase/client"
import { useRouter, usePathname } from "next/navigation"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    const router = useRouter()
    const pathname = usePathname()
    const [userEmail, setUserEmail] = React.useState<string>('admin@framez.com')

    React.useEffect(() => {
        const fetchUser = async () => {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            if (user?.email) setUserEmail(user.email)
        }
        fetchUser()
    }, [])

    const handleSignOut = async () => {
        const supabase = createClient()
        await supabase.auth.signOut()
        router.refresh()
    }

    const navMain = [
        {
            title: "Overview",
            url: "/",
            icon: BarChart3,
            isActive: pathname === "/",
        },
        {
            title: "User Management",
            url: "/users",
            icon: Users,
            isActive: pathname.startsWith("/users"),
        },
        {
            title: "Post Management",
            url: "/posts",
            icon: Frame,
            isActive: pathname.startsWith("/posts"),
        },
        {
            title: "Reports",
            url: "/reports",
            icon: Flag,
            isActive: pathname.startsWith("/reports"),
        },
        {
            title: "Notices",
            url: "/notices",
            icon: Megaphone,
            isActive: pathname.startsWith("/notices"),
        },
    ]

    return (
        <Sidebar collapsible="icon" {...props}>
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <div className="flex items-center gap-2">
                                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-rose-600 text-sidebar-primary-foreground">
                                    <Command className="size-4" />
                                </div>
                                <div className="grid flex-1 text-left text-sm leading-tight">
                                    <span className="truncate font-semibold">Framez Admin</span>
                                    <span className="truncate text-xs">v1.0.0</span>
                                </div>
                            </div>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarMenu>
                        {navMain.map((item) => (
                            <SidebarMenuItem key={item.title}>
                                <SidebarMenuButton asChild isActive={item.isActive} tooltip={item.title}>
                                    <a href={item.url}>
                                        <item.icon />
                                        <span>{item.title}</span>
                                    </a>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        ))}
                    </SidebarMenu>
                </SidebarGroup>
            </SidebarContent>
            <SidebarFooter>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <SidebarMenuButton
                                    size="lg"
                                    className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                                >
                                    <Avatar className="h-8 w-8 rounded-lg">
                                        <AvatarFallback className="rounded-lg">AD</AvatarFallback>
                                    </Avatar>
                                    <div className="grid flex-1 text-left text-sm leading-tight">
                                        <span className="truncate font-semibold">Admin</span>
                                        <span className="truncate text-xs">{userEmail}</span>
                                    </div>
                                    <LogOut className="ml-auto size-4" />
                                </SidebarMenuButton>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                                side="bottom"
                                align="end"
                                sideOffset={4}
                            >
                                <DropdownMenuItem onClick={handleSignOut}>
                                    <LogOut className="mr-2 h-4 w-4" />
                                    Log out
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    )
}
