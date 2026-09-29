import { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import { supabase } from "./supabaseClient";

const timeAgo = (isoDate) => {
  const seconds = Math.floor((Date.now() - new Date(isoDate).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

function NotificationBell({ session, isAdmin }) {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  const audience = isAdmin ? "admin" : "user";

  const loadNotifications = async () => {
    let query = supabase
      .from("notifications")
      .select("*")
      .eq("audience", audience)
      .order("created_at", { ascending: false })
      .limit(20);

    if (!isAdmin) {
      query = query.eq("user_id", session.user.id);
    }

    const { data, error } = await query;
    if (error) {
      console.error("loadNotifications error:", error);
      return;
    }
    setNotifications(data || []);
  };

  useEffect(() => {
    if (!session) return;
    loadNotifications();

    const channel = supabase
      .channel(`notifications-${session.user.id}-${audience}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications" },
        (payload) => {
          const n = payload.new;
          const relevant = isAdmin
            ? n.audience === "admin"
            : n.audience === "user" && n.user_id === session.user.id;
          if (relevant) {
            setNotifications((prev) => [n, ...prev]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id, isAdmin]);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const markAsRead = async (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", id);
    if (error) console.error("markAsRead error:", error);
  };

  const handleNotificationClick = (n) => {
    markAsRead(n.id);
    if (
      isAdmin &&
      (n.type === "call_request" ||
        n.type === "subscription_request" ||
        n.type === "subscription_expiring" ||
        n.type === "subscription_expired")
    ) {
      window.location.href = "/admin";
    } else if (
      !isAdmin &&
      (n.type === "call_status" ||
        n.type === "message" ||
        n.type === "plan_update" ||
        n.type === "subscription_expiring" ||
        n.type === "subscription_expired")
    ) {
      window.location.href = "/profile";
    }
  };

  const markAllAsRead = async () => {
    const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id);
    if (unreadIds.length === 0) return;
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .in("id", unreadIds);
    if (error) console.error("markAllAsRead error:", error);
  };

  if (!session) return null;

  return (
    <div className="notif-wrap" ref={wrapRef}>
      <button
        type="button"
        className="notif-bell-btn"
        aria-label="Notifications"
        onClick={() => setOpen((v) => !v)}
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="notif-badge">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="notif-dropdown">
          <div className="notif-dropdown-head">
            <span>Notifications</span>
            {unreadCount > 0 && (
              <button type="button" onClick={markAllAsRead}>
                Mark all read
              </button>
            )}
          </div>

          <div className="notif-list">
            {notifications.length === 0 ? (
              <p className="notif-empty">No notifications yet.</p>
            ) : (
              notifications.map((n) => (
                <button
                  type="button"
                  key={n.id}
                  className={`notif-item ${n.is_read ? "" : "notif-item-unread"}`}
                  onClick={() => handleNotificationClick(n)}
                >
                  <div className="notif-item-top">
                    <span className="notif-item-title">{n.title}</span>
                    <span className="notif-item-time">
                      {timeAgo(n.created_at)}
                    </span>
                  </div>
                  {n.message && (
                    <p className="notif-item-message">{n.message}</p>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationBell;
