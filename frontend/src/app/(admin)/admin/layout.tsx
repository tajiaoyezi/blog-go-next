"use client";

import React, { useEffect, useState, useSyncExternalStore } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  FileText,
  FolderTree,
  Tags,
  MessageSquare,
  Mail,
  Settings,
  ScrollText,
  ChevronRight,
  LogOut,
  PenSquare,
  List,
  MessageCircle,
  Camera,
} from "lucide-react";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useAuthStore, useHydrated } from "@/stores/auth";

/* ==============================
 * 侧边栏菜单配置
 * ============================== */

interface NavChild {
  title: string;
  href: string;
  icon: React.ElementType;
}

interface NavItem {
  title: string;
  icon: React.ElementType;
  href?: string;
  children?: NavChild[];
}

const NAV_ITEMS: NavItem[] = [
  {
    title: "首页",
    icon: LayoutDashboard,
    href: "/admin",
  },
  {
    title: "文章管理",
    icon: FileText,
    children: [
      { title: "发布文章", href: "/admin/articles/editor", icon: PenSquare },
      { title: "文章列表", href: "/admin/articles", icon: List },
      { title: "分类管理", href: "/admin/categories", icon: FolderTree },
      { title: "标签管理", href: "/admin/tags", icon: Tags },
    ],
  },
  {
    title: "消息管理",
    icon: MessageSquare,
    children: [
      { title: "评论管理", href: "/admin/comments", icon: MessageCircle },
      { title: "留言管理", href: "/admin/messages", icon: Mail },
    ],
  },
  {
    title: "说说管理",
    icon: MessageCircle,
    href: "/admin/talks",
  },
  {
    title: "相册管理",
    icon: Camera,
    href: "/admin/albums",
  },
  // TODO: 用户管理、系统管理（角色/菜单）待实现，暂不显示
  {
    title: "日志管理",
    icon: ScrollText,
    href: "/admin/logs",
  },
  {
    title: "站点配置",
    icon: Settings,
    href: "/admin/settings",
  },
];

/* ==============================
 * 面包屑：根据当前路径自动生成
 * ============================== */

function buildBreadcrumb(pathname: string): { label: string; href?: string }[] {
  const crumbs: { label: string; href?: string }[] = [
    { label: "首页", href: "/admin" },
  ];

  for (const item of NAV_ITEMS) {
    if (item.href && item.href === pathname) {
      if (item.href !== "/admin") {
        crumbs.push({ label: item.title });
      }
      return crumbs;
    }
    if (item.children) {
      for (const child of item.children) {
        if (child.href === pathname) {
          crumbs.push({ label: item.title });
          crumbs.push({ label: child.title });
          return crumbs;
        }
      }
    }
  }

  return crumbs;
}

/* ==============================
 * Admin Layout
 * ============================== */

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { token, user, logout } = useAuthStore();
  const hydrated = useHydrated();

  const isLoginPage = pathname === "/admin/login";

  useEffect(() => {
    if (hydrated && !token && !isLoginPage) {
      router.replace("/admin/login");
    }
  }, [hydrated, token, isLoginPage, router]);

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (!hydrated || !token) {
    return (
      <div className="flex h-screen items-center justify-center text-muted-foreground">
        加载中...
      </div>
    );
  }

  const breadcrumbs = buildBreadcrumb(pathname);

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" render={<Link href="/admin" />}>
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <FileText className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">博客管理</span>
                  <span className="truncate text-xs text-muted-foreground">
                    后台管理系统
                  </span>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>导航菜单</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {NAV_ITEMS.map((item) =>
                  item.children ? (
                    <CollapsibleNavItem
                      key={item.title}
                      item={item}
                      pathname={pathname}
                    />
                  ) : (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        render={<Link href={item.href!} />}
                        isActive={pathname === item.href}
                        tooltip={item.title}
                      >
                        <item.icon />
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ),
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger render={<SidebarMenuButton size="lg" />}>
                  <Avatar className="size-8">
                    <AvatarImage src={user?.avatar} />
                    <AvatarFallback>
                      {user?.nickname?.charAt(0) || "A"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">
                      {user?.nickname || "管理员"}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      {user?.email || ""}
                    </span>
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="top" className="w-56">
                  <DropdownMenuItem
                    onClick={() => {
                      logout();
                      router.push("/admin/login");
                    }}
                  >
                    <LogOut className="mr-2 size-4" />
                    退出登录
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        {/* 顶栏 */}
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <nav className="flex items-center gap-1 text-sm text-muted-foreground">
            {breadcrumbs.map((crumb, i) => (
              <React.Fragment key={i}>
                {i > 0 && <ChevronRight className="size-3" />}
                {crumb.href ? (
                  <Link
                    href={crumb.href}
                    className="hover:text-foreground transition-colors"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="text-foreground font-medium">
                    {crumb.label}
                  </span>
                )}
              </React.Fragment>
            ))}
          </nav>
        </header>

        {/* 主内容区 */}
        <main className="flex-1 p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}

/* ==============================
 * 可折叠导航项
 * ============================== */

function CollapsibleNavItem({
  item,
  pathname,
}: {
  item: NavItem;
  pathname: string;
}) {
  const isActive = item.children?.some((c) => c.href === pathname) ?? false;
  // 直接用 isActive 计算初始值，路由变化时组件会随 pathname 重新渲染
  // 用户手动折叠后仍允许 toggle，因此用 isActive 作为"至少展开"的触发
  const [open, setOpen] = useState(isActive);

  // 路由变化导致子菜单匹配时，确保展开（避免在 effect 内同步 setState）
  const effectiveOpen = open || isActive;

  return (
    <Collapsible open={effectiveOpen} onOpenChange={setOpen}>
      <SidebarMenuItem>
        <CollapsibleTrigger render={<SidebarMenuButton tooltip={item.title} />}>
          <item.icon />
          <span>{item.title}</span>
          <ChevronRight className="ml-auto size-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub>
            {item.children!.map((child) => (
              <SidebarMenuSubItem key={child.href}>
                <SidebarMenuSubButton render={<Link href={child.href} />} isActive={pathname === child.href}>
                  <child.icon />
                  <span>{child.title}</span>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  );
}
