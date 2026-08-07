export type ChatChannel = 'tournament' | 'matchup' | 'draft' | 'spectator';

export type ChatAuthorRole = 'organizer' | 'coach' | 'spectator';

export type ChatMessage = {
  id: string;
  author: string;
  role: ChatAuthorRole;
  teamId?: string;
  text: string;
  createdAt: string;
  isViewer: boolean;
  canDelete: boolean;
};

export type ChatRoom = {
  channel: ChatChannel;
  target?: string;
  canPost: boolean;
  messages: ChatMessage[];
};
