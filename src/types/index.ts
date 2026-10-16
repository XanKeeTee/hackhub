export type NodeType = 'file' | 'dir';

export interface VFile {
  name: string;
  type: 'file';
  content: string;
  permissions: string; // e.g. "rw-r--r--"
  owner: string;
  size: number;
}

export interface VDirectory {
  name: string;
  type: 'dir';
  permissions: string; // e.g. "rwxr-xr-x"
  owner: string;
  children: Record<string, VFile | VDirectory>;
}

export type VNode = VFile | VDirectory;

export interface NetworkService {
  port: number;
  service: 'ssh' | 'ftp' | 'http' | 'mysql' | 'smtp';
  version: string;
  isOpen: boolean;
  requiresAuth: boolean;
  validCredentials?: { user: string; pass: string }[];
  vulnerabilityId?: string; // ID for searchsploit / exploit
  vulnDescription?: string;
}

export interface SudoRule {
  user: string;
  command: string;
  nopasswd: boolean;
}

export interface NetworkNode {
  id: string;
  ip: string;
  hostname: string;
  organization: string;
  isPlayer: boolean;
  discovered: boolean;
  compromised: boolean;
  rootAccess: boolean;
  securityLevel: number; // 1 to 5
  ports: NetworkService[];
  fileSystem: VDirectory;
  hasIDS: boolean;
  traceSpeedSeconds: number; // Max seconds before trace completes
  coords: { x: number; y: number }; // For visual network map
  sudoRules?: SudoRule[];
}

export interface EmailMessage {
  id: string;
  from: string;
  subject: string;
  date: string;
  body: string;
  isRead: boolean;
  attachment?: {
    name: string;
    targetPath: string;
    content: string;
  };
}

export interface PlayerStats {
  offensive: number;   // Boosts cracking speed & exploit reliability
  evasion: number;     // Slows down IDS trace timer
  social: number;      // Gives extra clues / credentials
  crypto: number;      // Unlocks hash cracking
}

export interface PlayerRig {
  cpuCores: number;
  cpuSpeedGhz: number;
  ramTotalMb: number;
  ramUsedMb: number;
  storageGb: number;
  proxies: number;     // Bounces connection to add seconds to trace
}

export interface PlayerProfile {
  handle: string;
  level: number;
  xp: number;
  cryptoBalance: number;
  reputation: {
    cypherSec: number;
    ghostProtocol: number;
    onyxSyndicate: number;
  };
  attributes: PlayerStats;
  rig: PlayerRig;
}

export interface Quest {
  id: string;
  title: string;
  faction: 'CypherSec' | 'GhostProtocol' | 'OnyxSyndicate';
  difficulty: 'Fácil' | 'Media' | 'Difícil' | 'Extrema';
  rewardXp: number;
  rewardCrypto: number;
  description: string;
  targetIp: string;
  targetFile?: string;
  actionRequired: 'exfiltrate' | 'delete_logs' | 'root_access' | 'deface';
  isCompleted: boolean;
  isActive: boolean;
  hint: string;
}

export interface ShopItem {
  id: string;
  name: string;
  type: 'hardware' | 'exploit' | 'tool' | 'proxy';
  cost: number;
  description: string;
  purchased: boolean;
  statsEffect?: {
    cpu?: number;
    ram?: number;
    proxies?: number;
  };
}

export interface TerminalOutputLine {
  id: string;
  type: 'cmd' | 'text' | 'success' | 'error' | 'warning' | 'info' | 'system';
  content: string;
  timestamp?: string;
}
