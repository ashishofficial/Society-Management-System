import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Menu, Bell } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { listNotificationsApi, markAllNotificationsReadApi, markNotificationReadApi } from '../../services/notificationService';

const pageTitles = {
  '/': 'Dashboard',
  '/maintenance': 'Maintenance Collection',
  '/payments': 'Payment Records',
  '/expenses': 'Expense Management',
  '/members': 'Members Directory',
  '/ledger': 'Financial Ledger',
  '/notices': 'Notices & Announcements',
  '/complaints': 'Complaints & Helpdesk',
  '/visitors': 'Visitor Management',
  '/facilities': 'Facility Booking',
  '/operations': 'Operations & Security',
  '/finance-compliance': 'Finance & Compliance',
  '/governance': 'Governance Hub',
  '/product-settings': 'Product Settings',
};

export default function Topbar({ onMenuClick }) {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [notificationOpen, setNotificationOpen] = useState(false);
  const notificationRef = useRef(null);
  const [notificationData, setNotificationData] = useState({ unreadCount: 0, items: [] });
  const [notificationLoading, setNotificationLoading] = useState(false);

  const initials = user?.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const pageTitle = location.pathname.startsWith('/invoice/')
    ? 'Invoice Details'
    : (pageTitles[location.pathname] || '');

  const hasUnread = notificationData.unreadCount > 0;
  const unreadLabel = notificationData.unreadCount > 99 ? '99+' : String(notificationData.unreadCount || 0);

  const groupedItems = useMemo(() => notificationData.items.slice(0, 8), [notificationData.items]);

  const openNotifications = () => {
    setNotificationOpen(true);
    loadNotifications({ withLoading: false });
  };

  const closeNotifications = () => {
    setNotificationOpen(false);
  };

  const loadNotifications = async ({ withLoading = true } = {}) => {
    if (!localStorage.getItem('auth_token')) return;
    if (withLoading) setNotificationLoading(true);
    try {
      const data = await listNotificationsApi();
      setNotificationData(data);
    } catch {
      setNotificationData({ unreadCount: 0, items: [] });
    } finally {
      if (withLoading) setNotificationLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications({ withLoading: true });
    const interval = window.setInterval(() => loadNotifications({ withLoading: false }), 4000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) return undefined;
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';
    const societyId = localStorage.getItem('society_id') || import.meta.env.VITE_SOCIETY_ID || 'default';
    const streamUrl = `${baseUrl}/notifications/stream?token=${encodeURIComponent(token)}&societyId=${encodeURIComponent(societyId)}`;
    const sse = new EventSource(streamUrl);
    sse.addEventListener('notifications', (event) => {
      try {
        const payload = JSON.parse(event.data);
        setNotificationData(payload);
      } catch {
        // noop
      }
    });
    sse.onerror = () => {
      // Keep stream alive; browser EventSource reconnects automatically.
    };
    return () => {
      sse.close();
    };
  }, []);

  useEffect(() => {
    setNotificationOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === 'Escape') setNotificationOpen(false);
    };
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('keydown', handleEsc);
    };
  }, []);

  useEffect(() => {
    const handleOutsidePointer = (event) => {
      if (!notificationOpen) return;
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        closeNotifications();
      }
    };
    document.addEventListener('pointerdown', handleOutsidePointer, true);
    return () => {
      document.removeEventListener('pointerdown', handleOutsidePointer, true);
    };
  }, [notificationOpen]);

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
      {/* Left */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 md:hidden"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        {pageTitle && (
          <h1 className="text-lg font-semibold text-gray-800 hidden sm:block">{pageTitle}</h1>
        )}
      </div>

      {/* Right */}
      <div className="flex items-center gap-4">
        <span className="hidden md:block text-sm text-gray-500">{today}</span>

        {/* Notification bell */}
        <div className="relative z-50" ref={notificationRef}>
        <button
          type="button"
          className="relative p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
          aria-label="View notifications"
          onClick={(e) => {
            e.stopPropagation();
            if (notificationOpen) {
              closeNotifications();
            } else {
              openNotifications();
            }
          }}
        >
          <Bell className="w-5 h-5" />
          {hasUnread && (
            <span className="absolute top-1 right-1 min-w-[18px] h-[18px] bg-red-500 rounded-full flex items-center justify-center">
              <span className="text-[10px] font-bold text-white">{unreadLabel}</span>
            </span>
          )}
        </button>
        {notificationOpen && (
          <>
            <button
              type="button"
              className="fixed inset-0 bg-black/25 z-40 md:hidden"
              aria-label="Close notifications"
              onClick={closeNotifications}
            />
            <div
              className="fixed top-16 left-3 right-3 max-h-[75vh] bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden md:absolute md:top-auto md:left-auto md:right-0 md:mt-2 md:w-80 md:max-h-none"
              onClick={(e) => e.stopPropagation()}
            >
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-900">Notifications</p>
              <div className="flex items-center gap-3">
                <button
                  className="text-xs text-blue-600 hover:text-blue-700 disabled:opacity-40"
                  disabled={!hasUnread}
                  onClick={async () => {
                    await markAllNotificationsReadApi();
                    await loadNotifications();
                  }}
                >
                  Mark all read
                </button>
                <button
                  className="text-xs text-gray-500 hover:text-gray-700"
                  onClick={closeNotifications}
                  aria-label="Close notifications panel"
                >
                  Close
                </button>
              </div>
            </div>
            <div className="max-h-96 overflow-auto">
              {notificationLoading ? (
                <p className="px-4 py-6 text-sm text-gray-500 text-center">Loading...</p>
              ) : groupedItems.length === 0 ? (
                <p className="px-4 py-6 text-sm text-gray-500 text-center">No notifications</p>
              ) : (
                groupedItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={async () => {
                      if (!item.read) {
                        try {
                          await markNotificationReadApi(item.id);
                          setNotificationData((prev) => {
                            const items = prev.items.map((x) => x.id === item.id ? { ...x, read: true } : x);
                            const unreadCount = Math.max(0, items.filter((x) => !x.read).length);
                            return { ...prev, items, unreadCount };
                          });
                        } catch {
                          // noop
                        }
                      }
                      closeNotifications();
                      if (item.href) navigate(item.href);
                    }}
                    className={`w-full text-left px-4 py-3 border-b border-gray-50 last:border-b-0 hover:bg-gray-50 transition-colors ${
                      item.read ? 'bg-white' : 'bg-blue-50/40'
                    }`}
                  >
                    <p className="text-sm font-medium text-gray-900 flex items-center gap-2">
                      {!item.read && <span className="w-2 h-2 rounded-full bg-blue-600 inline-block" />}
                      {item.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">{item.subtitle}</p>
                  </button>
                ))
              )}
            </div>
            </div>
          </>
        )}
        </div>

        {/* User avatar */}
        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
          <span className="text-xs font-medium text-white">{initials}</span>
        </div>
      </div>
    </header>
  );
}
