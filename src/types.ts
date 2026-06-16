export interface Profile {
  port: number;
  purpose: string;
}

export interface ProfileConfig {
  [key: string]: Profile;
}

export interface CDPTarget {
  description: string;
  devtoolsFrontendUrl: string;
  id: string;
  title: string;
  type: string;
  url: string;
  webSocketDebuggerUrl: string;
}

export interface CDPMessage {
  id?: number;
  method?: string;
  params?: any;
  result?: any;
  error?: any;
}

export interface ConsoleMessage {
  type: 'log' | 'warn' | 'error' | 'info' | 'debug';
  args: any[];
  text: string;
  url?: string;
  line?: number;
  column?: number;
}

export interface SessionState {
  currentPageId: string | null;
  currentProfile: string | null;
  port: number;
}
