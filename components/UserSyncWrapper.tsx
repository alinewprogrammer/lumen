"use client"
import React, { useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { createToken } from "@/actions/createToken";
import streamClient from "@/lib/stream";
import { LoadingSpinner } from "@/components/LoadingSpinner";

function UserSyncWrapper({ children }: { children: React.ReactNode }) {
  const { user, isLoaded } = useUser();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Convex mutation to sync user
  const createOrUpdateUser = useMutation(api.users.upsertUser);

  const syncUser = useCallback(async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      setError(null);

      const tokenProvider = async () => {
        if (!user?.id) {
          throw new Error("User is not authenticated");
        }
        // This calls the server action to securely generate a token
        const token = await createToken(user.id);
        return token;
      };

      // 1. Save user data to our Convex database
      await createOrUpdateUser({
        userId: user.id,
        name: user.fullName || user.firstName || "Unknown User",
        email: user.emailAddresses[0]?.emailAddress || "",
        imageUrl: user.imageUrl || "",
      });

      // 2. Connect the user to the Stream Chat client
      await streamClient.connectUser(
        {
          id: user.id,
          name:
            user.fullName ||
            user.firstName ||
            user.emailAddresses[0]?.emailAddress ||
            "Unknown User",
          image: user.imageUrl || "",
        },
        tokenProvider
      );
    } catch (err) {
      console.error("Failed to sync or connect user:", err);
      setError(err instanceof Error ? err.message : "Failed to sync user");
    } finally {
      setIsLoading(false);
    }
  }, [createOrUpdateUser, user]);

  const disconnectUser = useCallback(async () => {
    try {
      // Disconnects the current user from the stream client instance
      await streamClient.disconnectUser();
    } catch (err) {
      console.error("Failed to disconnect user:", err);
    }
  }, []);

  useEffect(() => {
    // Wait until Clerk has finished loading the user state
    if (!isLoaded) return;

    if (user) {
      // If a user is logged in, sync their data and connect to chat
      syncUser();
    } else {
      // If no user is logged in (e.g., they logged out), disconnect from chat
      disconnectUser();
    }

    //cleanup function
    return () => {
        if (user) {
        disconnectUser()
        }
    }
  }, [user, isLoaded, syncUser, disconnectUser]);

  // Render a loading spinner while Clerk is loading or sync is in progress
  if (!isLoaded || isLoading) {
    return (
      <LoadingSpinner
        size="lg"
        message={!isLoaded ? "Loading..." : "Syncing user data..."}
        className="min-h-screen"
      />
    );
  }

  // Render an error message if anything went wrong
  if (error) {
    return (
      <div className="flex flex-col flex-1 items-center justify-center bg-white px-6 text-center">
        <p className="text-red-500 text-lg font-semibold mb-2">Sync Error</p>
        <p className="text-gray-600 mb-4">{error}</p>
        <p className="text-gray-500 text-sm">
          Please try restarting the app or contact support if the issue persists.
        </p>
      </div>
    );
  }

  // If everything is successful, render the main application
  return <>{children}</>;
}

export default UserSyncWrapper;