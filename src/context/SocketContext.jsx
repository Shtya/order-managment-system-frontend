
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
    accessToken

    if (!user?.id || !accessToken) return;

    // Disconnect if token changes
    if (socketRef.current) {
      const oldToken = socketRef.current.auth?.token;
      if (oldToken !== accessToken) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    }

    // Create socket instance
    if (!socketRef.current) {
      socketRef.current = io(process.env.NEXT_PUBLIC_BASE_URL, {
        auth: { accessToken },
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
      socket.auth = { accessToken };
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
    };
  }, [user?.id, accessToken]);

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
