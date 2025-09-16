'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    CallControls,
    CallingState,
    SpeakerLayout,
    useCallStateHooks,
} from '@stream-io/video-react-sdk';
import { Check, Copy } from 'lucide-react';
import "@stream-io/video-react-sdk/dist/css/styles.css"


// Assumed imports
import StatusCard from '@/components/StatusCard';
import { InlineSpinner } from '@/components/LoadingSpinner';
import { useSidebar } from '@/components/ui/sidebar';

export default function VideoCall() {
    const { useCallCallingState, useParticipants } = useCallStateHooks();
    const callingState = useCallCallingState();
    const participants = useParticipants();
    const router = useRouter();
    const { setOpen } = useSidebar();
    const [copied, setCopied] = useState(false);

    // Automatically hide the sidebar for an immersive experience
    useEffect(() => {
        setOpen(false);
    }, [setOpen]);

    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(window.location.href);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error("Failed to copy invite link: ", err);
        }
    };

    const handleLeave = () => {
        router.push('/dashboard');
    };

    // --- Loading and Connection States ---
    if (!callingState) {
        return (
            <StatusCard
                title="Loading call..."
                description={`Status: ${callingState}`}
                className="bg-gray-50 rounded-lg"
            >
                <div className="animate-pulse rounded-full h-12 w-12 bg-gray-400 mx-auto"></div>
            </StatusCard>
        );
    }

    if (callingState === CallingState.JOINING) {
        return (
            <StatusCard
                title="Joining call..."
                description="Please wait while we connect you to the call."
                className="bg-gray-50 rounded-lg"
            >
                <InlineSpinner size="lg" />
            </StatusCard>
        );
    }

    if (callingState === CallingState.RECONNECTING) {
        return (
            <StatusCard
                title="Reconnecting..."
                description="Connection lost, attempting to reconnect."
                className="bg-yellow-50 rounded-lg border border-yellow-200"
            >
                <div className="animate-pulse rounded-full h-12 w-12 bg-yellow-400 mx-auto"></div>
            </StatusCard>
        );
    }

    // --- Return Statement for Joined State ---
    if (callingState === CallingState.JOINED) {
        return (
            <div className="flex flex-col h-screen w-full">
                <div className="flex-1 relative">
                    <SpeakerLayout />

                    {/* Waiting Screen Overlay */}
                    {participants.length === 1 && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                            <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-lg w-full shadow-2xl">
                                <div className="text-center space-y-6">
                                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                                        <Copy className="w-8 h-8 text-blue-600" />
                                    </div>
                                    <div className="space-y-2">
                                        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                                            Waiting for others to join
                                        </h2>
                                        <p className="text-gray-600">
                                            Share this link to invite them to the call
                                        </p>
                                    </div>
                                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                                            <p className="flex-1 text-sm text-gray-700 font-mono break-all text-left sm:text-center">
                                                {typeof window !== 'undefined' ? window.location.href : ''}
                                            </p>
                                            <button
                                                onClick={copyToClipboard}
                                                className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 whitespace-nowrap"
                                            >
                                                {copied ? (
                                                    <>
                                                        <Check className="w-4 h-4" />
                                                        Copied!
                                                    </>
                                                ) : (
                                                    <>
                                                        <Copy className="w-4 h-4" />
                                                        Copy Link
                                                    </>
                                                )}
                                            </button>
                                            {/* Bottom Controls */}
                                          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10 flex flex-col items-center gap-2">
                                              <CallControls onLeave={handleLeave} />
                                              {/* Cancel Call Button */}
                                              <button
                                                  onClick={handleLeave}
                                                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                                              >
                                                  Cancel Call
                                              </button>
                                          </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                
            </div>
        );
    }

    return <div>Video Call State: {callingState}</div>;
}
