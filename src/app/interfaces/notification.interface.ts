export interface Notification {
  id: string;
  message: string;
  type?: 'success' | 'error' | 'info' | 'warning';
  timeout?: number; // in milliseconds
  fadingOut?: boolean;
}
