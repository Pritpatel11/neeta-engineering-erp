import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, Bell, HelpCircle, Plus, LogOut, Bot, Menu, CheckCircle2, 
  Clock, AlertTriangle, CheckCheck, Trash2, ExternalLink, Globe, CheckSquare 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { 
  getPendingEnquiriesCount, 
  getNotifications, 
  markNotificationRead, 
  markAllNotificationsRead 
} from '../../services/api';
import { useShortcuts } from '../../contexts/ShortcutsContext';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function Header({ onToggleMobileMenu }) {
  const [pendingCount, setPendingCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpenNotifications, setIsOpenNotifications] = useState(false);
  const notifDropdownRef = useRef(null);

  const navigate = useNavigate();
  const { setIsCommandPaletteOpen, setIsQuickCreateOpen } = useShortcuts();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    toast.success('Signed out successfully');
    navigate('/login');
  };

  // Close notifications dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifDropdownRef.current && !notifDropdownRef.current.contains(e.target)) {
        setIsOpenNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNotificationData = async () => {
    try {
      // 1. Task Notifications
      const notifData = await getNotifications();
      if (notifData) {
        setNotifications(notifData.notifications || []);
        setUnreadCount(notifData.unreadCount || 0);
      }

      // 2. Enquiries Count (for admin/owner/sales)
      if (user?.role === 'admin' || user?.role === 'owner' || user?.department === 'sales') {
        const { count } = await getPendingEnquiriesCount();
        setPendingCount(count || 0);
      }
    } catch (err) {
      console.error('Notification fetch error:', err);
    }
  };

  useEffect(() => {
    fetchNotificationData();
    const interval = setInterval(fetchNotificationData, 20000);
    return () => clearInterval(interval);
  }, [user]);

  const handleNotificationClick = async (notif) => {
    try {
      if (!notif.isRead) {
        await markNotificationRead(notif._id);
        setNotifications(prev => prev.map(n => n._id === notif._id ? { ...n, isRead: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Failed to mark read:', err);
    }

    setIsOpenNotifications(false);

    if (notif.link) {
      navigate(notif.link);
    } else if (user?.role === 'owner') {
      navigate('/owner-dashboard?tab=tasks');
    } else {
      navigate('/my-tasks');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch (err) {
      console.error('Failed to mark all read:', err);
    }
  };

  const totalBadges = unreadCount + (pendingCount > 0 ? 1 : 0);

  return (
    <header className="sticky top-0 z-30 h-16 px-3 sm:px-6 bg-white/85 backdrop-blur-md border-b border-slate-200/90 flex items-center justify-between gap-2 sm:gap-4">
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Mobile Hamburger Toggle */}
        <button
          type="button"
          onClick={onToggleMobileMenu}
          aria-label="Open sidebar menu"
          className="lg:hidden p-2 -ml-1 text-slate-700 hover:bg-slate-100 hover:text-[#0059bb] rounded-xl transition-colors flex items-center justify-center cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global Command Palette Trigger */}
        <div 
          className="flex items-center justify-between gap-2 sm:gap-3 px-2.5 sm:px-3 py-1.5 bg-slate-100/80 hover:bg-slate-100 border border-slate-200/80 rounded-xl cursor-pointer transition-all w-32 sm:w-64" 
          onClick={() => setIsCommandPaletteOpen(true)}
        >
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-hidden">
            <Search size={15} className="text-slate-400 shrink-0" />
            <span className="text-slate-500 text-xs sm:text-sm truncate">Search...</span>
          </div>
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-semibold text-slate-500 bg-white border border-slate-200 rounded shadow-2xs font-mono">
            Ctrl K
          </kbd>
        </div>
      </div>
      
      <div className="flex items-center gap-1.5 sm:gap-3">
        {/* Quick Create Button (Owner / Staff) */}
        {user?.role !== 'owner' && (
          <button 
            className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-xl bg-[#0059bb] hover:bg-[#004899] text-white shadow-sm transition-all cursor-pointer shrink-0" 
            onClick={() => setIsQuickCreateOpen(true)}
          >
            <Plus size={15} /> 
            <span className="hidden sm:inline">Create</span>
            <kbd className="hidden md:inline-block ml-1 px-1.5 py-0.2 text-[10px] bg-white/20 text-white rounded font-mono">
              Ctrl N
            </kbd>
          </button>
        )}

        {/* AI Assistant Button */}
        {user && (
          <button 
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-semibold text-[#0059bb] bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition-all cursor-pointer" 
            onClick={() => window.dispatchEvent(new CustomEvent('open-ai-chat'))}
            title="Open AI Assistant"
          >
            <Bot size={16} className="text-[#0059bb]" />
            <span className="hidden md:inline">AI Assistant</span>
          </button>
        )}

        {/* Real-time Notification Bell Dropdown */}
        <div className="relative" ref={notifDropdownRef}>
          <button 
            className={`relative p-2 rounded-xl transition-colors cursor-pointer ${
              isOpenNotifications ? 'bg-blue-50 text-[#0059bb]' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
            }`}
            onClick={() => setIsOpenNotifications(prev => !prev)}
            title="Notifications & Tasks"
          >
            <Bell size={18} />
            {totalBadges > 0 && (
              <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 bg-red-600 text-white text-[10px] font-bold flex items-center justify-center rounded-full leading-none shadow-xs animate-pulse">
                {unreadCount > 99 ? '99+' : unreadCount || (pendingCount > 0 ? '!' : '')}
              </span>
            )}
          </button>

          {/* Floating Notification Popover Panel */}
          {isOpenNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200/90 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
              {/* Dropdown Header */}
              <div className="px-4 py-3 bg-slate-50/90 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 text-sm">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#0059bb] text-white">
                      {unreadCount} new
                    </span>
                  )}
                </div>

                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#0059bb] hover:underline cursor-pointer"
                  >
                    <CheckCheck size={14} />
                    <span>Mark all read</span>
                  </button>
                )}
              </div>

              {/* Website Enquiries Bar (if pending) */}
              {pendingCount > 0 && (
                <div 
                  onClick={() => { setIsOpenNotifications(false); navigate('/enquiries'); }}
                  className="px-4 py-2.5 bg-blue-50/70 border-b border-blue-100 hover:bg-blue-100/70 flex items-center justify-between cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Globe size={15} className="text-[#0059bb]" />
                    <span className="text-xs font-semibold text-[#0059bb]">
                      {pendingCount} Pending Website {pendingCount === 1 ? 'Enquiry' : 'Enquiries'}
                    </span>
                  </div>
                  <ExternalLink size={13} className="text-[#0059bb]" />
                </div>
              )}

              {/* Notifications List */}
              <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="py-12 px-4 text-center">
                    <CheckCircle2 size={32} className="mx-auto mb-2 text-slate-300" />
                    <p className="text-sm font-medium text-slate-600">You're all caught up!</p>
                    <p className="text-xs text-slate-400 mt-0.5">No notifications at the moment.</p>
                  </div>
                ) : (
                  notifications.map((notif) => {
                    const isUrgent = notif.metadata?.priority === 'urgent' || notif.type === 'task_overdue';
                    const isHigh = notif.metadata?.priority === 'high';

                    return (
                      <div
                        key={notif._id}
                        onClick={() => handleNotificationClick(notif)}
                        className={`p-3.5 hover:bg-slate-50/90 cursor-pointer transition-colors flex items-start gap-3 relative ${
                          !notif.isRead ? 'bg-blue-50/40' : ''
                        }`}
                      >
                        {/* Icon by Type */}
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                          isUrgent 
                            ? 'bg-rose-100 text-rose-700' 
                            : isHigh 
                              ? 'bg-amber-100 text-amber-700' 
                              : notif.type === 'task_completed'
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-blue-100 text-[#0059bb]'
                        }`}>
                          {isUrgent ? (
                            <AlertTriangle size={16} />
                          ) : notif.type === 'task_completed' ? (
                            <CheckCircle2 size={16} />
                          ) : (
                            <CheckSquare size={16} />
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1 mb-0.5">
                            <span className={`text-xs font-bold truncate ${!notif.isRead ? 'text-slate-900' : 'text-slate-700'}`}>
                              {notif.title}
                            </span>
                            <span className="text-[10px] text-slate-400 shrink-0">
                              {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>

                          <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed whitespace-pre-line">
                            {notif.message}
                          </p>

                          <div className="flex items-center gap-2 mt-1.5">
                            {notif.metadata?.priority && (
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                                notif.metadata.priority === 'urgent'
                                  ? 'bg-rose-100 text-rose-700 border border-rose-200'
                                  : notif.metadata.priority === 'high'
                                    ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                    : 'bg-slate-100 text-slate-600 border border-slate-200'
                              }`}>
                                {notif.metadata.priority}
                              </span>
                            )}
                            {notif.metadata?.dueDate && (
                              <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                <Clock size={11} />
                                Due: {new Date(notif.metadata.dueDate).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Unread indicator dot */}
                        {!notif.isRead && (
                          <div className="w-2 h-2 rounded-full bg-[#0059bb] shrink-0 mt-2" />
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Dropdown Footer Link */}
              <div className="p-2.5 bg-slate-50 border-t border-slate-200 text-center">
                <button
                  onClick={() => {
                    setIsOpenNotifications(false);
                    if (user?.role === 'owner') {
                      navigate('/owner-dashboard?tab=tasks');
                    } else {
                      navigate('/my-tasks');
                    }
                  }}
                  className="text-xs font-semibold text-[#0059bb] hover:underline cursor-pointer"
                >
                  {user?.role === 'owner' ? 'View All Owner Tasks →' : 'View My Assigned Tasks →'}
                </button>
              </div>
            </div>
          )}
        </div>
        
        {/* User Profile Avatar & Role */}
        <div className="flex items-center gap-2.5 pl-2 sm:border-l sm:border-slate-200">
          <div className="w-8 h-8 rounded-full bg-[#0059bb] text-white font-bold text-xs flex items-center justify-center uppercase shadow-xs">
            {user?.name ? user.name.charAt(0) : (user?.username ? user.username.charAt(0) : 'A')}
          </div>
          <div className="hidden sm:flex flex-col">
            <span className="text-xs font-bold text-slate-900 leading-tight">
              {user?.name || user?.username || 'ERP User'}
            </span>
            <span className="text-[11px] text-slate-500 capitalize leading-tight">
              {user?.role || 'Staff'}
            </span>
          </div>

          <button
            onClick={handleLogout}
            title="Sign Out"
            className="p-1.5 text-rose-600 hover:text-white bg-rose-50 hover:bg-rose-600 border border-rose-200 hover:border-rose-600 rounded-lg transition-all cursor-pointer ml-1"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </header>
  );
}

