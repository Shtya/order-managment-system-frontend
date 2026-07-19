
import api, { getOnboardingStatus } from "@/utils/api";
import {
  createContext,
  useContext,
  useRef,
  useEffect,
  useState,
  useCallback,
} from "react";
import io from "socket.io-client";
import { useAuth } from "./AuthContext";

// ------------------------------
// Socket Context
// ------------------------------
const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const { user, accessToken } = useAuth();

  const socketRef = useRef(null);
  const subscribers = useRef(new Map());

  const [isConnected, setIsConnected] = useState(false);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);

  // ------------------------------
  // Pub/Sub
  // ------------------------------
  const publish = useCallback(({ type, payload }) => {
    const typeGroup = subscribers.current.get(type);
    if (typeGroup) {
      typeGroup.forEach((callback) => {
        callback(payload);
      });
    }
  }, []); // Empty deps because subscribers.current (Ref) doesn't change

  /**
   * Subscribes a callback to a specific action name.
   */
  const subscribe = useCallback((actionType, cb) => {
    if (!actionType || typeof cb !== "function") return;

    const id = crypto.randomUUID();

    if (!subscribers.current.has(actionType)) {
      subscribers.current.set(actionType, new Map());
    }

    subscribers.current.get(actionType).set(id, cb);

    return () => {
      const typeGroup = subscribers.current.get(actionType);
      if (typeGroup) {
        typeGroup.delete(id);
        if (typeGroup.size === 0) {
          subscribers.current.delete(actionType);
        }
      }
    };
  }, []);

  // ------------------------------
  // External Controls
  // ------------------------------
  const incrementUnread = () => setUnreadNotificationsCount((prev) => prev + 1);

  const decrementUnread = () =>
    setUnreadNotificationsCount((prev) => Math.max(prev - 1, 0));

  const resetUnread = () => {
    const prev = unreadNotificationsCount;
    setUnreadNotificationsCount(0);
    return prev;
  };

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
    const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;

    if (!token) return;

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
        // 1. CRITICAL FIX: Use an auth callback. 
        // This guarantees Socket.io fetches the FRESHEST token from localStorage 
        // on the initial connection AND every single time it tries to reconnect.
        auth: (cb) => {
          const currentToken = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
          cb({ token: currentToken });
        },
        transports: ["websocket", "polling"],
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
    });

    socket.on("store:sync-status", (payload) => {
      publish({
        type: "STORE_SYNC_STATUS",
        payload,
      });
    });
    socket.on("failed-order:update", (payload) => {
      publish({
        type: "FAILED_ORDER_UPDATE",
        payload,
      });
    });

    socket.on("shipment:status", (payload) => {
      publish({
        type: "SHIPMENT_STATUS",
        payload,
      });
    });

    socket.on("automation:run-status", (payload) => {
      publish({
        type: "AUTOMATION_RUN_UPDATE",
        payload,
      });
    });

    socket.on("automation:preview:update", (payload) => {
      console.log("socket", payload)
      publish({
        type: "AUTOMATION_PREVIEW_UPDATE",
        payload,
      });
    });

    // ------------------ WHATSAPP ------------------

    socket.on("whatsapp:message-new", (payload) => {
      publish({
        type: "WHATSAPP_MESSAGE_NEW",
        payload,
      });
    });

    socket.on("whatsapp:message-updated", (payload) => {
      publish({
        type: "WHATSAPP_MESSAGE_UPDATED",
        payload,
      });
    });

    socket.on("whatsapp:conversation-new", (payload) => {
      publish({
        type: "WHATSAPP_CONVERSATION_NEW",
        payload,
      });
    });

    socket.on("whatsapp:customer-new", (payload) => {
      publish({
        type: "WHATSAPP_CUSTOMER_NEW",
        payload,
      });
    });

    socket.on("whatsapp:signup-status", (payload) => {
      publish({
        type: "WHATSAPP_SIGNUP_STATUS",
        payload,
      });
    });

    // Cleanup listeners
    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("reconnect");
      socket.off("reconnect_error");
      socket.off("new_notification");
      socket.off("store:sync-status");
      socket.off("failed-order:update");
      socket.off("shipment:status");
      socket.off("automation:run-status");
      socket.off("whatsapp:message-new");
      socket.off("whatsapp:message-updated");
      socket.off("whatsapp:conversation-new");
      socket.off("whatsapp:customer-new");

      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  const isOnboarding = getOnboardingStatus();
  // Fetch unread counts on mount and when user changes
  useEffect(() => {
    if (user?.id && !isOnboarding) {
      fetchUnreadNotificationsCount();
    } else {
      setUnreadNotificationsCount(0);
    }
  }, [user?.id, isOnboarding]);

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
