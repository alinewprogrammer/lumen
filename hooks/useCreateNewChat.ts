import streamClient from "@/lib/stream";
// Removed the incorrect 'diagnostics_channel' import which caused errors.

export const useCreateNewChat = () => {
  const createNewChat = async ({
    members,
    createdBy,
    groupName,
  }: {
    members: string[];
    createdBy: string;
    groupName?: string;
  }) => {
    // Determine if it's a group chat (more than 2 people, including the creator).
    const isGroupChat = members.length > 2;

    // --- Logic for One-on-One Chats ---
    if (!isGroupChat) {
      // First, check if a channel with these exact members already exists.
      const existingChannel = await streamClient.queryChannels(
        {
          type: "messaging",
          members: { $eq: members }, // Filter for channels with this exact member set
        },
        { created_at: -1 }, // Sort by creation date to get the latest
        { limit: 1 } // We only need one
      );

      if (existingChannel.length > 0) {
        // This variable holds the actual channel object from Stream
        const channel = existingChannel[0];

        // Use the correct variable here to access its state
        const channelMembers = Object.keys(channel.state.members);

        // For 1-1 chats, ensure exactly the same 2 members
        if (
          channelMembers.length === 2 &&
          members.length === 2 &&
          members.every((member) => channelMembers.includes(member))
        ) {
          console.log("Existing 1-1 chat found");
          // Also make sure to return the correct variable
          return channel;
        }
      }
    } // <-- Added missing closing brace for the 'if' block.

    const channelId = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`; // Always unique

    try {
      // Create channel with appropriate configuration for group vs 1-1 chat
      const channelData: {
        members: string[];
        created_by_id: string;
        name?: string;
      } = {
        members,
        created_by_id: createdBy,
      };

      // For group chats, add group-specific metadata
      if (isGroupChat) {
        channelData.name =
          groupName || `Group chat (${members.length} members)`;
      }

      const channel = streamClient.channel(
        isGroupChat ? "team" : "messaging",
        channelId,
        channelData
      );

      await channel.watch({
        presence: true,
      });
      
      return channel; // <-- Added missing return statement for the new channel.

    } catch (error) {
      throw error;
    }
  };

  return createNewChat; // <-- Moved this return statement inside the hook's body.
};
