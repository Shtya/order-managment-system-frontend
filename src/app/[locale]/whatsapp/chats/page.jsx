"use client";

import { cn } from "@/utils/cn";
import ChatList from "../atoms/chats/ChatList";
import ChatWindow from "../atoms/chats/ChatWindow";
import ChatSidebar from "../atoms/chats/ChatSidebar";
import { ConversationProvider, useConversation } from "../atoms/chats/ConversationContext";

function ChatsContent() {
    const {
        selectedConversation,
        mobileView,
        showDetails,
        toggleDetails,
        handleSendMessage,
    } = useConversation();
    
    return (
        <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-background">
            {/* Left Sidebar - Chat List */}
            <div className={cn(
                "flex-shrink-0 w-full md:w-80 lg:w-96 md:block",
                mobileView === "list" ? "max-md:block!" : "max-md:hidden!"
            )}>
                <ChatList />
            </div>

            {/* Main Chat Area - Chat Window */}
            <div className={cn(
                "flex-1 md:block",
                mobileView === "chat" ? "max-md:block!" : "max-md:hidden!"
            )}>
                <ChatWindow
                    onSendMessage={handleSendMessage}
                    onToggleDetails={toggleDetails}
                />
            </div>

            {/* Right Sidebar - Customer Details */}
            {selectedConversation && (
                <div className={cn(
                    "flex-shrink-0 w-full w-80  fixed md:relative inset-0 md:inset-auto z-50 md:z-auto",
                     showDetails ? "block" : "hidden",
                     mobileView === "details" ? "max-md:block" : ""
                )}>
                    <ChatSidebar
                        conversation={selectedConversation}
                        onClose={toggleDetails}
                    />
                </div>
            )}
        </div>
    );
}

export default function Chats() {
    return (
        <ConversationProvider>
            <ChatsContent />
        </ConversationProvider>
    );
}
