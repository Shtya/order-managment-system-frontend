"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

const ConversationContext = createContext();

export const useConversation = () => useContext(ConversationContext);

export const ConversationProvider = ({ children }) => {
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [showDetails, setShowDetails] = useState(false);
    const [activeTab, setActiveTab] = useState("all");
    const [conversations, setConversations] = useState([]);
    const [messages, setMessages] = useState([]);
    const [pendingMedia, setPendingMedia] = useState(null);
    const [showInteractiveModal, setShowInteractiveModal] = useState(false);
    const [headerMediaFile, setHeaderMediaFile] = useState(null);
    const [interactiveMessage, setInteractiveMessage] = useState({
        headerType: "NONE",
        headerText: "",
        headerUrl: "",
        bodyText: "",
        footerText: "",
        buttons: []
    });
    const [showLocationRequestModal, setShowLocationRequestModal] = useState(false);
    const [locationRequestBody, setLocationRequestBody] = useState("");
    const [showContactModal, setShowContactModal] = useState(false);
    const [showLocationModal, setShowLocationModal] = useState(false);
    const [showListModal, setShowListModal] = useState(false);
    const [listMessage, setListMessage] = useState({
        headerType: "NONE",
        headerText: "",
        headerUrl: "",
        bodyText: "",
        footerText: "",
        menuLabel: "View Options",
        sections: [{
            title: "",
            rows: []
        }]
    });
    const [showTemplateModal, setShowTemplateModal] = useState(false);
    const [templateMessage, setTemplateMessage] = useState({
        templateId: null,
        templateName: "",
        templateData: null,
        headerVariables: {},
        bodyVariables: {},
        buttonVariables: {}
    });

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
            content: msg.type === "text" ? { text: { body: msg.text } } :
                msg.type === "audio" ? { audio: msg.audio } :
                    msg.type === "image" ? { image: msg.image, caption: msg.caption } :
                        msg.type === "video" ? { video: msg.video, caption: msg.caption } :
                            msg.type === "document" ? { document: msg.document, caption: msg.caption } :
                                msg.type === "template" ? { template: msg.template } : {},
            createdAt: new Date().toISOString(),
            status: "SENT"
        };
        setMessages([...messages, newMessage]);
    };

    const handleReaction = (messageId, emoji) => {
        setMessages(prev => prev.map(msg =>
            msg.id === messageId
                ? { ...msg, reactions: [emoji] }
                : msg
        ));
    };

    const toggleDetails = () => setShowDetails(!showDetails);

    return (
        <ConversationContext.Provider value={{
            selectedConversation,
            setSelectedConversation,
            showDetails,
            setShowDetails,
            toggleDetails,
            activeTab,
            setActiveTab,
            conversations,
            setConversations,
            messages,
            setMessages,
            handleSendMessage,
            handleReaction,
            pendingMedia,
            setPendingMedia,
            showInteractiveModal,
            setShowInteractiveModal,
            interactiveMessage,
            setInteractiveMessage,
            headerMediaFile,
            setHeaderMediaFile,
            showLocationRequestModal,
            setShowLocationRequestModal,
            locationRequestBody,
            setLocationRequestBody,
            showContactModal,
            setShowContactModal,
            showLocationModal,
            setShowLocationModal,
            showListModal,
            setShowListModal,
            listMessage,
            setListMessage,
            showTemplateModal,
            setShowTemplateModal,
            templateMessage,
            setTemplateMessage
        }}>
            {children}
        </ConversationContext.Provider>
    );
};
