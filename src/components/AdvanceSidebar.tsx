"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight } from "lucide-react";

interface MenuItem {
  id: string;
  title: string;
  href: string;
}

interface Menu {
  id: string;
  name: string;
  items: MenuItem[];
}

export default function AdvancedSidebar() {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch("/api/menus")
      .then(res => res.json())
      .then(data => setMenus(data))
      .catch(() => setMenus([]));
  }, []);

  const toggleGroup = (groupId: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId);
    } else {
      newExpanded.add(groupId);
    }
    setExpandedGroups(newExpanded);
  };

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="px-4 py-2">
          <h1 className="text-xl font-bold">My App</h1>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {menus.map((menu) => {
          const isExpanded = expandedGroups.has(menu.id);
          return (
            <SidebarGroup key={menu.id}>
              <SidebarGroupLabel 
                className="cursor-pointer flex items-center justify-between hover:bg-sidebar-accent rounded-md px-2 py-1"
                onClick={() => toggleGroup(menu.id)}
              >
                <span>{menu.name}</span>
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </SidebarGroupLabel>
              {isExpanded && (
                <SidebarGroupContent>
                  <SidebarMenu>
                    {menu.items.map((item) => (
                      <SidebarMenuItem key={item.id}>
                        <SidebarMenuButton asChild>
                          <Link href={item.href}>
                            <span>{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              )}
            </SidebarGroup>
          );
        })}
      </SidebarContent>

      <SidebarFooter>
        <div className="px-4 py-2">
          <p className="text-sm text-muted-foreground">© 2025 My App</p>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
