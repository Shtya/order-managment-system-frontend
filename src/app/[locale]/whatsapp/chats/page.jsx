"use client";

import { useState, useEffect } from "react";
import ChatList from "../atoms/chats/ChatList";
import ChatWindow from "../atoms/chats/ChatWindow";
import ChatSidebar from "../atoms/chats/ChatSidebar";

export default function Chats() {
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [showDetails, setShowDetails] = useState(true);
    const [activeTab, setActiveTab] = useState("all");
    const [conversations, setConversations] = useState([]);
    const [messages, setMessages] = useState([]);

    // Mock data based on the design image
    useEffect(() => {
        const mockConversations = [
            {
                id: "1",
                phoneNumber: "+201012345678",
                unreadCount: 2,
                lastMessageAt: new Date().toISOString(),
                lastMessagePreview: "Hi, I need more info about your products...",
                status: "Open",
                createdAt: "2026-05-10T10:00:00Z",
                customer: {
                    name: "Ahmed Mohamed",
                    phoneNumber: "+2010 1234 5678",
                    email: "ahmed@example.com",
                    isOnline: true,
                    // profilePicture: "https://i.pravatar.cc/150?u=ahmed",
                    createdAt: "2026-05-10T10:00:00Z",
                    country: "Egypt",
                    language: "Arabic"
                }
            },
            {
                id: "2",
                phoneNumber: "+201087654321",
                unreadCount: 1,
                lastMessageAt: new Date(Date.now() - 120000).toISOString(),
                lastMessagePreview: "Thanks! 👍",
                status: "Open",
                customer: {
                    name: "Sara Ali",
                    isOnline: false,
                    profilePicture: "https://i.pravatar.cc/150?u=sara"
                }
            },
            {
                id: "3",
                phoneNumber: "+201122334455",
                unreadCount: 0,
                lastMessageAt: new Date(Date.now() - 3600000).toISOString(),
                lastMessagePreview: "Can I get the price list?",
                status: "Open",
                customer: {
                    name: "Mona Hassan",
                    isOnline: false,
                    profilePicture: "https://i.pravatar.cc/150?u=mona"
                }
            }
        ];

        setConversations(mockConversations);
        setSelectedConversation(mockConversations[0]);

        const mockMessages = [
            {
                id: "m1",
                direction: "INBOUND",
                messageType: "text",
                content: { text: { body: "Hi, I need more info about your products" } },
                createdAt: "2026-05-29T10:28:00Z",
                status: "READ"
            },
            {
                id: "m2",
                direction: "OUTBOUND",
                messageType: "text",
                content: { text: { body: "Hello Ahmed 👋\nSure! What would you like to know?" } },
                createdAt: "2026-05-29T10:29:00Z",
                status: "READ"
            },
            {
                id: "m3",
                direction: "INBOUND",
                messageType: "interactive",
                content: {
                    interactive: {
                        type: "button",
                        header: { type: "text", text: "Products List" },
                        body: { text: "Please choose a category:" },
                        action: {
                            buttons: [
                                { reply: { id: "p1", title: "Phones" } },
                                { reply: { id: "p2", title: "Accessories" } },
                                { reply: { id: "p3", title: "Tablets" } },
                                { reply: { id: "p4", title: "Laptops" } }
                            ]
                        }
                    }
                },
                createdAt: "2026-05-29T10:30:00Z",
                status: "READ"
            }
        ];
        setMessages(mockMessages);
    }, []);

    const handleSendMessage = (msg) => {
        const newMessage = {
            id: Date.now().toString(),
            direction: "OUTBOUND",
            messageType: msg.type,
            content: msg.type === "text" ? { text: { body: msg.text } } : {},
            createdAt: new Date().toISOString(),
            status: "SENT"
        };
        setMessages([...messages, newMessage]);
    };

    const handleReaction = (messageId, emoji) => {
        setMessages(prev => prev.map(msg =>
            msg.id === messageId
                ? { ...msg, reaction: emoji }
                : msg
        ));
    };

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
                onToggleDetails={() => setShowDetails(!showDetails)}
            />

            {/* Right Sidebar */}
            {showDetails && selectedConversation && (
                <ChatSidebar
                    conversation={selectedConversation}
                    onClose={() => setShowDetails(false)}
                />
            )}
        </div>
    );
}
