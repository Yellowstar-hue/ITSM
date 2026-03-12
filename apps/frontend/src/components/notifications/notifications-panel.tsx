'use client';

import { useState } from 'react';
import { formatRelativeTime } from '@/lib/utils';
import { useNotifications } from '@/hooks/use-notifications';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export function NotificationsPanel({ onClose }: { onClose?: () => void }) {
  const { notifications, unreadCount, isLoading, markRead, markAllRead } = useNotifications();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const displayed = filter === 'unread' ? notifications.filter((n) => !n.read) : notifications;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold text-sm">Notifications</h2>
          {unreadCount > 0 && (
            <span className="bg-primary text-primary-foreground text-xs rounded-full px-1.5 py-0.5 min-w-[1.25rem] text-center">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-7"
              onClick={() => markAllRead()}
            >
              Mark all read
            </Button>
          )}
          {onClose && (
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
              ✕
            </Button>
          )}
        </div>
      </div>

      <div className="flex gap-1 p-2 border-b border-border">
        <Button
          variant={filter === 'all' ? 'secondary' : 'ghost'}
          size="sm"
          className="h-7 text-xs"
          onClick={() => setFilter('all')}
        >
          All
        </Button>
        <Button
          variant={filter === 'unread' ? 'secondary' : 'ghost'}
          size="sm"
          className="h-7 text-xs"
          onClick={() => setFilter('unread')}
        >
          Unread {unreadCount > 0 && `(${unreadCount})`}
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-3/4" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : displayed.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
            <div className="text-3xl mb-2">🔔</div>
            <p className="text-sm">
              {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {displayed.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkRead={() => markRead(notification.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function NotificationItem({
  notification,
  onMarkRead,
}: {
  notification: ReturnType<typeof useNotifications>['notifications'][number];
  onMarkRead: () => void;
}) {
  const typeIcon = getTypeIcon(notification.type);

  return (
    <div
      className={`flex gap-3 p-3 hover:bg-muted/50 transition-colors cursor-pointer ${
        !notification.read ? 'bg-primary/5' : ''
      }`}
      onClick={() => {
        if (!notification.read) onMarkRead();
        if (notification.actionUrl) window.location.href = notification.actionUrl;
      }}
    >
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm">
        {typeIcon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={`text-sm font-medium truncate ${!notification.read ? 'text-foreground' : 'text-muted-foreground'}`}>
            {notification.title}
          </p>
          {!notification.read && (
            <span className="flex-shrink-0 w-2 h-2 rounded-full bg-primary mt-1" />
          )}
        </div>
        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
          {notification.message}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {formatRelativeTime(notification.createdAt)}
        </p>
      </div>
    </div>
  );
}

function getTypeIcon(type: string): string {
  const icons: Record<string, string> = {
    ticket_assigned: '🎫',
    ticket_updated: '🔄',
    ticket_resolved: '✅',
    sla_warning: '⚠️',
    sla_breach: '🚨',
    mention: '@',
    workflow: '⚙️',
    system: '💡',
  };
  return icons[type] ?? '🔔';
}
