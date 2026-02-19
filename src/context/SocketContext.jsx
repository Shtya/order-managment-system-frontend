import { getUser } from "@/hook/getUser";
import api from "@/utils/api";
import { createContext, useContext, useRef, useEffect, useState } from "react";
import io from "socket.io-client";


// ------------------------------
// Socket Context
// ------------------------------
const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
    const user = getUser()

    const socketRef = useRef(null);
    const subscribers = useRef(new Map());

    const [isConnected, setIsConnected] = useState(false);
    const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);

    // ------------------------------
    // Pub/Sub
    // ------------------------------
    const publish = (action) => {
        subscribers.current.forEach((cb) => cb(action));
    };


    const subscribe = (actionName, cb) => {
        if (!actionName || typeof cb !== "function") return;

        if (subscribers.current.has(actionName)) {
            subscribers.current.delete(actionName);
        }

        subscribers.current.set(actionName, cb);

        return () => {
            subscribers.current.delete(actionName);
        };
    };


    // ------------------------------
    // External Controls
    // ------------------------------
    const incrementUnread = () =>
        setUnreadNotificationsCount((prev) => prev + 1);

    const decrementUnread = () =>
        setUnreadNotificationsCount((prev) => Math.min(prev - 1, 0));

    const resetUnread = () => setUnreadNotificationsCount(0);

    // ------------------------------
    // Fetch Initial Count
    // ------------------------------
    const fetchUnreadNotificationsCount = async () => {
        if (typeof window === "undefined") return; // ⛔ Prevent SSR cras

        try {

            const { data } = await api.get("/notifications/unread-count");
            setUnreadNotificationsCount(data?.unreadCount || 0);
        } catch {
            setUnreadNotificationsCount(0);
        }
    };

    // ------------------------------
    // Initialize Socket
    // ------------------------------
    useEffect(() => {
        const token = localStorage.getItem("accessToken");

        if (!user?.id || !token) return;

        // Disconnect if token changes
        if (socketRef.current) {
            const oldToken = socketRef.current.auth?.token;
            if (oldToken !== token) {
                socketRef.current.disconnect();
                socketRef.current = null;
            }
        }

        // Create socket instance
        if (!socketRef.current) {
            socketRef.current = io(process.env.NEXT_PUBLIC_BASE_URL, {
                auth: { token },
                transports: ["websocket", 'polling'],
                reconnection: true,
                reconnectionDelay: 1000,
                reconnectionDelayMax: 5000,
                reconnectionAttempts: Infinity,
            });
        }

        const socket = socketRef.current;

        // ------------------ HANDLERS ------------------

        socket.on("connect", () => {
            setIsConnected(true);
        });

        socket.on("disconnect", () => {
            setIsConnected(false);
        });

        socket.on("reconnect", () => {
            // Refresh token on reconnect
            socket.auth = { token };
        });

        socket.on("reconnect_error", (err) => {
            console.error("Reconnect error:", err);
        });

        // ------------------ NEW MESSAGE ------------------

        socket.on("new_notification", (notification) => {

            publish({
                type: "NEW_NOTIFICATION",
                payload: notification,
            });
            incrementUnread();
        })
        // Cleanup listeners
        return () => {
            socket.off("connect");
            socket.off("disconnect");
            socket.off("reconnect");
            socket.off("reconnect_error");
            socket.off("new_message");
        };
    }, [user?.id, user?.accessToken]);



    // Fetch unread counts on mount and when user changes
    useEffect(() => {
        if (user?.id) {
            fetchUnreadNotificationsCount();
        } else {
            setUnreadNotificationsCount(0);
        }
    }, [user?.id]);

    // Disconnect on unmount
    useEffect(() => {
        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
            }
        };
    }, []);

    return (
        <SocketContext.Provider
            value={{
                isConnected,
                unreadNotificationsCount,
                setUnreadNotificationsCount,

                // Publisher/Subscriber
                subscribe,
                socket: socketRef.current,
                // External controls
                incrementUnread,
                decrementUnread,
                resetUnread,
                fetchUnreadNotificationsCount,
            }}
        >
            {children}
        </SocketContext.Provider>
    );
};

export const useSocket = () => useContext(SocketContext);
