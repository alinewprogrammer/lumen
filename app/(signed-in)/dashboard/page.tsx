// Declares this as a Client Component, which is necessary for using hooks like useState, useEffect, and custom hooks.
"use client";

// --- React and Next.js Imports ---
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// --- UI and Icon Imports ---
import { useSidebar } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { LogOutIcon, VideoIcon } from "lucide-react";

// --- Authentication and Chat Service Imports ---
import { useUser } from "@clerk/nextjs";
import {
  Channel,
  ChannelHeader,
  MessageInput,
  MessageList,
  Thread,
  useChatContext,
  Window,
} from "stream-chat-react";

function Dashboard() {

  // --- Hooks ---
  // Hook from Clerk to get the current authenticated user's data.
  const { user } = useUser();
  // Next.js hook for programmatic navigation.
  const router = useRouter();
  // Stream's hook to get the current channel state and the function to change it.
  const { channel, client, setActiveChannel } = useChatContext();
  // Custom hook to control the sidebar's open/close state.
  const { setOpen } = useSidebar();
  const [invite, setInvite] = useState<{
    callId: string;
    initiatorId: string;
    targetUserId: string;
    cid?: string;
  } | null>(null);

  // --- Event Handlers ---

  /**
   * Navigates the user to a video call room for the current channel.
   */
  const handleCall = async () => {
    // Guard clause: Do nothing if no channel is active.
    if (!channel) return;
    // Creates a unique call ID from the channel ID.
    try {
      const currentUserId = user?.id as string;
      // Compute the first target user (not the initiator). For 1-1 chats this is the other member.
      const members = Object.values(channel.state.members || {});
      const firstTarget = members
        .map((m) => m.user?.id)
        .filter((id): id is string => !!id && id !== currentUserId)[0];

      // Send a custom invite event so the targeted user gets a banner.
      await channel.sendEvent({
        type: "call.invite",
        callId: channel.id,
        initiatorId: currentUserId,
        targetUserId: firstTarget,
      } as any);

      // Also send a message with the call link for everyone else.
      await channel.sendMessage({
        text: `📞 Call started. Join via link: ${window.location.origin}/dashboard/video-call/${channel.id}`,
        extra: { callId: channel.id },
      } as any);

      router.push(`/dashboard/video-call/${channel.id}`);
      setOpen(false);
    } catch (e) {
      console.error("Failed to initiate call:", e);
    }
  };

  /**
   * Removes the current user from the active chat channel and resets the view.
   */
  const handleLeaveChat = async () => {
    if (!channel || !user?.id) {
      console.log("No active channel or user");
      return;
    }

    // Confirm before leaving
    // const confirm = window.confirm("Are you sure you want to leave the chat?");
    // if (!confirm) return;

    try {
      // Remove current user from the channel using
      // Stream's removeMembers method
      await channel.removeMembers([user.id]);

      // Clear the active channel
      setActiveChannel(undefined);

      // Redirect to dashboard after leaving
      router.push("/dashboard");
    } catch (error) {
      console.error("Error leaving chat:", error);
      // You could add a toast notification here for better UX
    }
  };

  // Listen for call invite events and show banner only if I'm the targeted user
  useEffect(() => {
    if (!client) return;
    const off = client.on((event) => {
      const type = (event as any)?.type as string | undefined;
      if (type === "call.invite") {
        const targetUserId = (event as any).targetUserId as string | undefined;
        const initiatorId = (event as any).initiatorId as string | undefined;
        const callId = (event as any).callId as string | undefined;
        if (targetUserId && user?.id === targetUserId && callId) {
          setInvite({ callId, initiatorId: initiatorId || "", targetUserId, cid: (event as any).cid });
        }
      }
    });
    return () => {
      off.unsubscribe?.();
    };
  }, [client, user?.id]);

  const joinFromInvite = () => {
    if (!invite) return;
    router.push(`/dashboard/video-call/${invite.callId}`);
    setInvite(null);
    setOpen(false);
  };

  // --- Render Logic ---
  return (
    <div className="flex flex-col w-full flex-1">
      {invite && (
        <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-md mb-2 flex items-center justify-between">
          <div className="mr-2">
            <p className="font-medium">Incoming call</p>
            <p className="text-sm opacity-80">You have been invited to join a call.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={joinFromInvite}>Join</Button>
            <Button variant="outline" onClick={() => setInvite(null)}>Dismiss</Button>
          </div>
        </div>
      )}

      {/* Conditionally render the chat window or a placeholder */}
      {channel ? (
        // If a channel is active, render the full chat interface.
        <Channel>
          <Window>
            {/* Header section containing channel info and action buttons */}
            <div className="flex items-center justify-between p-2 border-b">
              {channel.data?.member_count === 1 ? (
                <ChannelHeader title="Everyone else has left this chat!" />
              ) : (
                <ChannelHeader />
              )}
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={handleCall}>
                  <VideoIcon className="w-4 h-4" />
                  Video Call
                </Button>
                <Button
                  variant="outline"
                  onClick={handleLeaveChat}
                  className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                >
                  <LogOutIcon className="w-4 h-4" />
                  Leave Chat
                </Button>
              </div>
            </div>

            {/* Main content of the chat window */}
            <MessageList />
            <div className="sticky bottom-0 w-full bg-background">
              <MessageInput />
            </div>

            {/* The Thread component is for handling replies in a separate view */}
            <Thread />
          </Window>
        </Channel>
      ) : (
        // If no channel is selected, show a placeholder message.
        <div className="flex flex-col items-center justify-center h-full">
          <h2 className="text-2xl font-semibold text-muted-foreground mb-4">
            No chat selected
          </h2>
          <p className="text-muted-foreground">
            Select a chat from the sidebar or start a new conversation
          </p>
        </div>
      )}
    </div>
  );
}

export default Dashboard;