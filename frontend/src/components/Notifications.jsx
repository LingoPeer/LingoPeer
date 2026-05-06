import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { apiFetch, API_BASE_URL } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import './Notifications.css';

function formatTime(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

function getNotificationIcon(type) {
  switch (type) {
    case 'practice_request':
      return 'person_add';
    case 'practice_accepted':
      return 'check_circle';
    case 'community_message':
      return 'forum';
    case 'private_message':
      return 'chat';
    default:
      return 'notifications';
  }
}

export default function Notifications() {
  const { auth } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    const onDown = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [isOpen]);

  useEffect(() => {
    if (!auth.token) return;
    
    // Set up socket connection for real-time notifications
    const socket = io(API_BASE_URL, {
      transports: ['websocket', 'polling'],
      auth: {
        token: auth.token,
      },
      reconnectionAttempts: 5,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Notifications socket connected');
    });

    socket.on('disconnect', () => {
      console.log('Notifications socket disconnected');
    });

    socket.on('connect_error', (err) => {
      console.error('Notifications socket connection error:', err);
    });

    socket.on('notification:new', (notification) => {
      console.log('New notification received:', notification);
      setNotifications(prev => {
        if (prev.some(n => n.id === notification.id)) return prev;
        return [notification, ...prev];
      });
      setUnreadCount(prev => prev + 1);
    });

    fetchNotifications();
    fetchUnreadCount();
    
    // Poll for new notifications every 30 seconds (fallback)
    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 60000);
    
    return () => {
      clearInterval(interval);
      socket.off('notification:new');
      socket.disconnect();
    };
  }, [auth.token]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      console.log('🔔 DEBUG: Fetching notifications...');
      const data = await apiFetch('/api/notifications?limit=10');
      console.log('🔔 DEBUG: Notifications API response:', data);
      setNotifications(data.notifications || []);
      console.log('🔔 DEBUG: Notifications set:', data.notifications || []);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      console.log('🔔 DEBUG: Fetching unread count...');
      const data = await apiFetch('/api/notifications/unread-count');
      console.log('🔔 DEBUG: Unread count API response:', data);
      setUnreadCount(data.unreadCount || 0);
      console.log('🔔 DEBUG: Unread count set:', data.unreadCount || 0);
    } catch (err) {
      console.error('Failed to fetch unread count:', err);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await apiFetch(`/api/notifications/${notificationId}/read`, {
        method: 'PATCH',
      });
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await apiFetch('/api/notifications/read-all', {
        method: 'PATCH',
      });
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const handleDelete = async (notificationId) => {
    try {
      await apiFetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
      });
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      const deleted = notifications.find(n => n.id === notificationId);
      if (deleted && !deleted.is_read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  };

  const handleNotificationClick = (notification) => {
    if (!notification.is_read) {
      handleMarkAsRead(notification.id);
    }
    setIsOpen(false);
    
    // Navigate to relevant page based on notification type
    switch (notification.type) {
      case 'practice_request':
        // Navigate to Community page and show requests panel
        window.location.hash = '#/community';
        // Trigger requests panel to open after navigation
        setTimeout(() => {
          const requestsBtn = document.querySelector('.requests-toggle-btn');
          if (requestsBtn) requestsBtn.click();
        }, 100);
        break;
      case 'practice_accepted':
        // Navigate to Community page and open private chat with the sender
        window.location.hash = '#/community';
        // Open private chat with the user who accepted the request
        setTimeout(() => {
          // Find the user in active users and click to open chat
          const userButtons = document.querySelectorAll('.community-active-user');
          userButtons.forEach(btn => {
            if (btn.getAttribute('data-user-id') === notification.sender_id) {
              btn.click();
            }
          });
        }, 100);
        break;
      case 'private_message':
        // Navigate to Community page and open private chat with the sender
        window.location.hash = '#/community';
        // Try to find existing accepted chat first, then open private chat directly
        setTimeout(() => {
          // Look for existing private chat buttons
          const privateChatButtons = document.querySelectorAll('[data-chat-id]');
          if (privateChatButtons.length > 0) {
            // Find the chat with the sender
            const senderId = notification.sender_id;
            let targetChat = null;
            
            privateChatButtons.forEach(btn => {
              const chatId = btn.getAttribute('data-chat-id');
              const chatData = btn.getAttribute('data-chat-data');
              if (chatData) {
                const chat = JSON.parse(chatData);
                if ((chat.senderId === senderId && chat.receiverId === window.currentUserId) ||
                    (chat.receiverId === senderId && chat.senderId === window.currentUserId)) {
                  targetChat = chat;
                }
              }
            });
            
            if (targetChat) {
              // Open the existing private chat directly
              privateChatButtons.forEach(btn => {
                if (btn.getAttribute('data-chat-id') === targetChat.id) {
                  btn.click();
                }
              });
            } else {
              // Fallback: click user to open profile
              const userButtons = document.querySelectorAll('.community-active-user');
              userButtons.forEach(btn => {
                if (btn.getAttribute('data-user-id') === notification.sender_id) {
                  btn.click();
                }
              });
            }
          }
        }, 100);
        break;
      case 'community_message':
        // Navigate to Community page and switch to relevant room
        if (notification.relatedId) {
          window.location.hash = '#/community';
          // Could extract room from message and switch, but for now just go to Community
          setTimeout(() => {
            // Find the room button and click it
            const roomButtons = document.querySelectorAll('.community-room-item');
            roomButtons.forEach(btn => {
              // This would need the room name from the notification
              // For now, just go to Community
            });
          }, 100);
        }
        break;
      default:
        break;
    }
  };

  return (
    <div className="notifications-container" ref={dropdownRef}>
      <button
        type="button"
        className="icon-button notification-bell"
        aria-label="Notifications"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="material-symbols-outlined">notifications</span>
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <div className="notifications-dropdown">
          <div className="notifications-header">
            <h3>Notifications</h3>
            {unreadCount > 0 && (
              <button
                type="button"
                className="mark-all-read-btn"
                onClick={handleMarkAllAsRead}
              >
                Mark all read
              </button>
            )}
          </div>
          
          <div className="notifications-list">
            {loading ? (
              <div className="notifications-loading">Loading...</div>
            ) : notifications.length === 0 ? (
              <div className="notifications-empty">No notifications</div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`notification-item ${!notification.is_read ? 'unread' : ''}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="notification-icon">
                    <span className="material-symbols-outlined">
                      {getNotificationIcon(notification.type)}
                    </span>
                  </div>
                  <div className="notification-content">
                    <div className="notification-title">{notification.title}</div>
                    <div className="notification-message">{notification.message}</div>
                    <div className="notification-time">{formatTime(notification.created_at)}</div>
                  </div>
                  <div className="notification-actions">
                    <button
                      type="button"
                      className="notification-delete"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(notification.id);
                      }}
                      aria-label="Delete notification"
                    >
                      <span className="material-symbols-outlined">close</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
