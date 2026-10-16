import { EmailMessage, NetworkNode } from '../types';
import { getCompletionsForPath } from './virtualFileSystem';

export interface AutocompleteContext {
  nodes: NetworkNode[];
  currentNodeId: string;
  currentPath: string;
  emails: EmailMessage[];
}

export interface AutocompleteResult {
  newInput: string;
  candidates: string[];
  hasChanged: boolean;
}

// Find longest common prefix among an array of strings
export function findCommonPrefix(strings: string[]): string {
  if (strings.length === 0) return '';
  if (strings.length === 1) return strings[0];

  let prefix = strings[0];
  for (let i = 1; i < strings.length; i++) {
    while (!strings[i].toLowerCase().startsWith(prefix.toLowerCase())) {
      prefix = prefix.slice(0, -1);
      if (prefix === '') return '';
    }
  }
  return prefix;
}

export const ALL_COMMANDS = [
  'help', 'clear', 'ls', 'cd', 'pwd', 'cat', 'rm',
  'ping', 'nmap', 'searchsploit', 'exploit', 'hydra',
  'ssh', 'disconnect', 'exit', 'status', 'stats', 'hardware',
  'quests', 'contracts', 'darknet', 'shop', 'mail', 'sudo',
  'john', 'hashcat', 'reset-game'
];

export function getAutocomplete(
  input: string,
  context: AutocompleteContext
): AutocompleteResult {
  const currentNode = context.nodes.find(n => n.id === context.currentNodeId);
  if (!currentNode) {
    return { newInput: input, candidates: [], hasChanged: false };
  }

  const trimmedStart = input.trimStart();
  const leadingSpaces = input.slice(0, input.length - trimmedStart.length);

  // If user hasn't typed anything or is at the very beginning of the command
  if (!trimmedStart || (!trimmedStart.includes(' ') && !input.endsWith(' '))) {
    const matches = ALL_COMMANDS.filter(cmd => cmd.startsWith(trimmedStart.toLowerCase()));

    if (matches.length === 0) {
      return { newInput: input, candidates: [], hasChanged: false };
    }

    if (matches.length === 1) {
      return {
        newInput: leadingSpaces + matches[0] + ' ',
        candidates: matches,
        hasChanged: leadingSpaces + matches[0] + ' ' !== input
      };
    }

    const common = findCommonPrefix(matches);
    return {
      newInput: leadingSpaces + common,
      candidates: matches,
      hasChanged: leadingSpaces + common !== input
    };
  }

  // Parse words
  const parts = input.split(' ');
  const lastPart = parts[parts.length - 1];
  const prevParts = parts.slice(0, parts.length - 1);
  const command = parts[0].toLowerCase();

  let candidates: string[] = [];

  // 1. IP & Hostname completion
  const discoveredTargets = context.nodes
    .filter(n => n.discovered || n.isPlayer)
    .flatMap(n => [n.ip, n.hostname]);

  // If after ping or nmap or positional target
  if (
    command === 'ping' ||
    (command === 'nmap' && !lastPart.startsWith('-')) ||
    (command === 'exploit' && prevParts[prevParts.length - 1] === '-t')
  ) {
    candidates = discoveredTargets.filter(t => t.toLowerCase().startsWith(lastPart.toLowerCase()));
  }

  // If in SSH: user@<target>
  else if (command === 'ssh') {
    if (lastPart.includes('@')) {
      const [user, hostPrefix] = lastPart.split('@');
      const matchingHosts = discoveredTargets.filter(h => h.toLowerCase().startsWith(hostPrefix.toLowerCase()));
      candidates = matchingHosts.map(h => `${user}@${h}`);
    } else {
      // Suggest common users
      const commonUsers = ['root@', 'admin@', 'vault_admin@', 'www-data@', 'player@'];
      candidates = commonUsers.filter(u => u.toLowerCase().startsWith(lastPart.toLowerCase()));
    }
  }

  // 2. Mail subcommands
  else if (command === 'mail') {
    if (prevParts.length === 1) {
      const mailActions = ['read', 'download', 'gui'];
      candidates = mailActions.filter(a => a.startsWith(lastPart.toLowerCase()));
    } else if (prevParts[1] === 'read' || prevParts[1] === 'download') {
      candidates = context.emails
        .map(e => e.id)
        .filter(id => id.toLowerCase().startsWith(lastPart.toLowerCase()));
    }
  }

  // 3. Sudo subcommands
  else if (command === 'sudo') {
    if (prevParts.length === 1 && !lastPart.startsWith('-')) {
      const sudoCommands = ['su', '-l', 'bash', 'sh', 'cat', 'ls', 'john', 'rm'];
      candidates = sudoCommands.filter(c => c.startsWith(lastPart.toLowerCase()));
    }
  }

  // 4. Flags completion
  else if (lastPart.startsWith('-')) {
    if (command === 'nmap') {
      candidates = ['-sV', '-p', '-Pn'].filter(f => f.startsWith(lastPart));
    } else if (command === 'hydra') {
      candidates = ['-l', '-P'].filter(f => f.startsWith(lastPart));
    } else if (command === 'ls') {
      candidates = ['-la', '-l', '-a'].filter(f => f.startsWith(lastPart));
    } else if (command === 'rm') {
      candidates = ['-rf', '-r'].filter(f => f.startsWith(lastPart));
    } else if (command === 'exploit') {
      candidates = ['-t', '-v'].filter(f => f.startsWith(lastPart));
    }
  }

  // 5. Exploit IDs completion
  else if (command === 'exploit' && prevParts[prevParts.length - 1] === '-v') {
    candidates = ['vsftpd-234-backdoor', 'apache-2449-rce'].filter(v => v.startsWith(lastPart.toLowerCase()));
  }

  // 6. Hydra services completion
  else if (command === 'hydra' && parts.length >= 6) {
    candidates = ['ssh', 'ftp', 'mysql'].filter(s => s.startsWith(lastPart.toLowerCase()));
  }

  // 7. General File & Directory autocompletion (default for paths)
  if (candidates.length === 0) {
    // Check if currentNode has a file system
    candidates = getCompletionsForPath(currentNode.fileSystem, context.currentPath, lastPart);

    // If on player rig and looking for wordlists
    if (candidates.length === 0 && currentNode.isPlayer) {
      candidates = getCompletionsForPath(currentNode.fileSystem, '/home/player', lastPart);
    }
  }

  if (candidates.length === 0) {
    return { newInput: input, candidates: [], hasChanged: false };
  }

  if (candidates.length === 1) {
    const replacement = candidates[0];
    const isDir = replacement.endsWith('/');
    parts[parts.length - 1] = replacement;
    const completedInput = parts.join(' ') + (isDir ? '' : ' ');
    return {
      newInput: completedInput,
      candidates,
      hasChanged: completedInput !== input
    };
  }

  // Multiple candidates: find longest common prefix
  const common = findCommonPrefix(candidates);
  if (common.length > lastPart.length) {
    parts[parts.length - 1] = common;
    const completedInput = parts.join(' ');
    return {
      newInput: completedInput,
      candidates,
      hasChanged: completedInput !== input
    };
  }

  return {
    newInput: input,
    candidates,
    hasChanged: false
  };
}
