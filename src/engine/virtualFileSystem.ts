import { VDirectory, VFile, VNode } from '../types';

export function createDirectory(name: string, owner: string = 'root', permissions: string = 'rwxr-xr-x'): VDirectory {
  return {
    name,
    type: 'dir',
    permissions,
    owner,
    children: {}
  };
}

export function createFile(name: string, content: string, owner: string = 'root', permissions: string = 'rw-r--r--'): VFile {
  return {
    name,
    type: 'file',
    content,
    permissions,
    owner,
    size: content.length
  };
}

// Resolves a path like "/var/log" or "../etc" relative to currentPath
export function resolvePath(currentPath: string, targetPath: string): string {
  if (!targetPath) return currentPath;
  let parts: string[];

  if (targetPath.startsWith('/')) {
    parts = targetPath.split('/').filter(Boolean);
  } else {
    parts = (currentPath === '/' ? [] : currentPath.split('/').filter(Boolean)).concat(targetPath.split('/').filter(Boolean));
  }

  const stack: string[] = [];
  for (const part of parts) {
    if (part === '.') continue;
    if (part === '..') {
      stack.pop();
    } else {
      stack.push(part);
    }
  }

  return '/' + stack.join('/');
}

// Finds a node (file or directory) given an absolute path
export function getNodeByPath(rootDir: VDirectory, absolutePath: string): VNode | null {
  const parts = absolutePath.split('/').filter(Boolean);
  let current: VNode = rootDir;

  for (const part of parts) {
    if (current.type !== 'dir') return null;
    if (!current.children[part]) return null;
    current = current.children[part];
  }

  return current;
}

// Remove a file or directory at absolute path
export function removeNodeByPath(rootDir: VDirectory, absolutePath: string): boolean {
  const parts = absolutePath.split('/').filter(Boolean);
  if (parts.length === 0) return false; // Cannot remove root

  const targetName = parts.pop()!;
  const parentPath = '/' + parts.join('/');
  const parentNode = getNodeByPath(rootDir, parentPath);

  if (parentNode && parentNode.type === 'dir' && parentNode.children[targetName]) {
    delete parentNode.children[targetName];
    return true;
  }
  return false;
}

// Add or overwrite file at absolute path
export function writeFileByPath(rootDir: VDirectory, absolutePath: string, content: string, owner: string = 'root'): boolean {
  const parts = absolutePath.split('/').filter(Boolean);
  if (parts.length === 0) return false;

  const fileName = parts.pop()!;
  const parentPath = '/' + parts.join('/');
  const parentNode = getNodeByPath(rootDir, parentPath);

  if (parentNode && parentNode.type === 'dir') {
    parentNode.children[fileName] = createFile(fileName, content, owner);
    return true;
  }
  return false;
}

// Autocompletion helper for paths and files
export function getCompletionsForPath(
  rootDir: VDirectory,
  currentPath: string,
  partialInput: string
): string[] {
  let dirPart = '';
  let prefix = partialInput;

  const lastSlashIndex = partialInput.lastIndexOf('/');
  if (lastSlashIndex !== -1) {
    dirPart = partialInput.slice(0, lastSlashIndex + 1);
    prefix = partialInput.slice(lastSlashIndex + 1);
  }

  const resolvedDir = resolvePath(currentPath, dirPart);
  const dirNode = getNodeByPath(rootDir, resolvedDir);

  if (!dirNode || dirNode.type !== 'dir') return [];

  const matches: string[] = [];
  for (const name of Object.keys(dirNode.children)) {
    if (name.toLowerCase().startsWith(prefix.toLowerCase())) {
      const child = dirNode.children[name];
      const isDir = child.type === 'dir';
      matches.push(dirPart + name + (isDir ? '/' : ''));
    }
  }

  return matches;
}
