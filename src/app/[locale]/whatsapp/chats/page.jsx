"use client";

import ChatList from "../atoms/chats/ChatList";
import ChatWindow from "../atoms/chats/ChatWindow";
import ChatSidebar from "../atoms/chats/ChatSidebar";
import { ConversationProvider, useConversation } from "../atoms/chats/ConversationContext";

function ChatsContent() {
    const { 
        selectedConversation, 
        setSelectedConversation, 
        showDetails, 
        toggleDetails,
        activeTab, 
        setActiveTab, 
        conversations, 
        messages, 
        handleSendMessage, 
        handleReaction 
    } = useConversation();

    return (
        <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-white">
            {/* Left Sidebar */}
            <ChatList
                conversations={conversations}
                activeId={selectedConversation?.id}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                onSelect={(conv) => setSelectedConversation(conv)}
            />

            {/* Main Chat Area */}
            <ChatWindow
                conversation={selectedConversation}
                messages={messages}
                onSendMessage={handleSendMessage}
                onReaction={handleReaction}
                onToggleDetails={toggleDetails}
            />

            {/* Right Sidebar */}
            {showDetails && selectedConversation && (
                <ChatSidebar
                    conversation={selectedConversation}
                    onClose={toggleDetails}
                />
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
