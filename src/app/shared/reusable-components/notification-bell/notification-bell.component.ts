import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  inject,
  output,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import {
  formatRelativeTime,
  resolveNotificationLink,
  type AppNotification,
} from '../../../core/helpers/notification.helper';
import { NotificationsService } from '../../../core/services/notifications.service';

/** The header bell: an unread badge and a dropdown with the latest notifications. */
@Component({
  selector: 'app-notification-bell',
  standalone: true,
  templateUrl: './notification-bell.component.html',
  styleUrls: ['./notification-bell.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationBellComponent {
  private readonly router = inject(Router);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  protected readonly notifications = inject(NotificationsService);

  /** Emits after a notification navigated somewhere, so the header can close its mobile menu. */
  readonly navigated = output<void>();

  protected readonly isOpen = signal(false);

  protected toggle(): void {
    if (this.isOpen()) {
      this.isOpen.set(false);
      return;
    }

    this.isOpen.set(true);
    this.notifications.loadLatest();
  }

  protected retry(): void {
    this.notifications.loadLatest();
  }

  protected markAllRead(): void {
    this.notifications.markAllRead();
  }

  protected open(notification: AppNotification): void {
    this.notifications.markRead(notification);

    const link = resolveNotificationLink(notification);
    switch (link.kind) {
      case 'internal':
        this.isOpen.set(false);
        void this.router.navigate([...link.commands]);
        this.navigated.emit();
        break;
      case 'external':
        this.isOpen.set(false);
        window.open(link.url, '_blank', 'noopener,noreferrer');
        break;
      default:
        // Nothing to open: the notification is read and the list stays as it is.
        break;
    }
  }

  protected timeAgo(notification: AppNotification): string {
    return formatRelativeTime(notification.createdAt);
  }

  protected badgeText(): string {
    const count = this.notifications.unreadCount();
    return count > 9 ? '9+' : String(count);
  }

  /** Keeps clicks inside the bell from reaching the user card, which would toggle the user menu. */
  @HostListener('click', ['$event'])
  protected onHostClick(event: Event): void {
    event.stopPropagation();
  }

  @HostListener('document:click', ['$event'])
  protected onDocumentClick(event: Event): void {
    if (this.isOpen() && !this.host.nativeElement.contains(event.target as Node)) {
      this.isOpen.set(false);
    }
  }

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    this.isOpen.set(false);
  }
}
