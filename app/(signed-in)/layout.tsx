"use client";

import { Chat } from "stream-chat-react";

import UserSyncWrapper from "@/components/UserSyncWrapper";
import streamClient from "@/lib/stream";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Separator } from "@radix-ui/react-separator";
import "stream-chat-react/dist/css/v2/index.css"
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useCallback } from "react";

function Layout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [code, setCode] = useState("");

  const parseCallId = useCallback((input: string) => {
    const trimmed = input.trim();
    if (!trimmed) return "";
    try {
      // If it's a full URL, try to extract the segment after /video-call/
      const url = new URL(trimmed, typeof window !== 'undefined' ? window.location.origin : 'http://localhost');
      const parts = url.pathname.split('/').filter(Boolean);
      const idx = parts.findIndex((p) => p === 'video-call');
      if (idx >= 0 && parts[idx + 1]) return parts[idx + 1];
    } catch (_) {
      // Not a URL; treat it as a raw code
    }
    // Fallback: assume the whole string is the call id/code
    return trimmed;
  }, []);

  const handleJoinByCode = useCallback(() => {
    const id = parseCallId(code);
    if (id) {
      router.push(`/dashboard/video-call/${id}`);
      setCode("");
    }
  }, [code, parseCallId, router]);

  return (
    <UserSyncWrapper>
    <Chat client={streamClient}>
        <SidebarProvider
            style={
                {
                    "--sidebar-width": "19rem",
                } as React.CSSProperties
            }
        >
            <AppSidebar />
            <SidebarInset>
                <header className="flex h-16 shrink-0 items-center gap-2 px-4">
                    <SidebarTrigger className="-ml-1" />
                    <Separator
                        orientation="vertical"
                        className="mr-2 data-[orientation=vertical]:h-4"
                    />
                    <Link href="/dashboard">
                        <h1 className="text-lg font-bold tracking-wider uppercase">
                            <Image
                                src={'/logo.svg'}
                                alt='logo'
                                width={100}
                                height={30}
                                className='object-contain'
                            />
                        </h1>
                    </Link>
                    <div className="ml-auto flex items-center gap-2">
                      <input
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        placeholder="Paste call link or ID"
                        className="h-8 rounded-md border px-2 text-sm w-[220px]"
                      />
                      <button
                        onClick={handleJoinByCode}
                        className="h-8 rounded-md border px-3 text-sm hover:bg-accent"
                        disabled={!code.trim()}
                      >
                        Join
                      </button>
                    </div>
                </header>

                <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
                    {children}
                </div>
            </SidebarInset>
        </SidebarProvider>
      </Chat>
    </UserSyncWrapper>
  );
}

export default Layout;