export type ChatChannel = 'tournament' | 'matchup' | 'draft' | 'spectator';

export type ChatAuthorRole = 'organizer' | 'coach' | 'spectator';

export type ChatMessage = {
  id: string;
  author: string;
  authorProfileId?: string;
  role: ChatAuthorRole;
  teamId?: string;
  text: string;
  createdAt: string;
  isViewer: boolean;
  canDelete: boolean;
};

export const CHAT_REPORT_REASON_MAX = 300;

export type ChatReportPerson = {
  name: string;
  profileId?: string;
};

export type ChatReport = {
  id: string;
  messageId: string;
  channel: ChatChannel;
  target?: string;
  reason: string;
  createdAt: string;
  reporter: ChatReportPerson;
  author: ChatReportPerson;
  text: string;
  messageExists: boolean;
  league?: { name: string; slug: string } | null;
  tournament?: { name: string; slug: string } | null;
};

export type ChatReportResolution = 'dismiss' | 'remove';

export type ChatRoom = {
  channel: ChatChannel;
  target?: string;
  canPost: boolean;
  messages: ChatMessage[];
};
