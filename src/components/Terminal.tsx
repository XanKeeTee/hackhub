import React, { useState, useRef, useEffect } from 'react';
import { TerminalOutputLine, NetworkNode, EmailMessage } from '../types';
import { sound } from '../engine/sound';
import { getAutocomplete, ALL_COMMANDS } from '../engine/autocomplete';
import { Terminal as TerminalIcon, Sparkles } from 'lucide-react';

interface TerminalProps {
  lines: TerminalOutputLine[];
  onCommand: (command: string) => void;
  promptUser: string;
  promptHost: string;
  promptPath: string;
  nodes: NetworkNode[];
  currentNodeId: string;
  emails: EmailMessage[];
  inputRef?: React.RefObject<HTMLInputElement>;
}

export const Terminal: React.FC<TerminalProps> = ({
  lines,
  onCommand,
  promptUser,
  promptHost,
  promptPath,
  nodes,
  currentNodeId,
  emails,
  inputRef: externalInputRef
}) => {
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [tabSuggestions, setTabSuggestions] = useState<string[]>([]);

  const internalInputRef = useRef<HTMLInputElement>(null);
  const inputRef = externalInputRef || internalInputRef;
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new output or suggestions
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [lines, tabSuggestions]);

  // Always keep focus on input when clicking terminal container
  const handleContainerClick = () => {
    inputRef.current?.focus();
  };

  // Format path to show ~ if in player home
  const displayPath = promptPath.startsWith('/home/player')
    ? promptPath.replace('/home/player', '~')
    : promptPath;

  const isRoot = promptUser === 'root';

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    sound.keyTick();

    // CTRL + L: Clear screen
    if (e.ctrlKey && e.key.toLowerCase() === 'l') {
      e.preventDefault();
      onCommand('clear');
      setTabSuggestions([]);
      return;
    }

    // CTRL + C: Cancel line
    if (e.ctrlKey && e.key.toLowerCase() === 'c') {
      e.preventDefault();
      onCommand(`^C`);
      setInput('');
      setTabSuggestions([]);
      return;
    }

    // CTRL + U: Clear line before cursor
    if (e.ctrlKey && e.key.toLowerCase() === 'u') {
      e.preventDefault();
      setInput('');
      setTabSuggestions([]);
      return;
    }

    // ENTER: Submit command
    if (e.key === 'Enter') {
      const trimmed = input.trim();
      if (trimmed) {
        setHistory(prev => [...prev, trimmed]);
        setHistoryIndex(-1);
      }
      onCommand(input);
      setInput('');
      setTabSuggestions([]);
      return;
    }

    // ARROW UP: Previous history
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (history.length === 0) return;
      const nextIndex = historyIndex === -1 ? history.length - 1 : Math.max(0, historyIndex - 1);
      setHistoryIndex(nextIndex);
      setInput(history[nextIndex]);
      setTabSuggestions([]);
      return;
    }

    // ARROW DOWN: Next history
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex === -1) return;
      const nextIndex = historyIndex + 1;
      if (nextIndex >= history.length) {
        setHistoryIndex(-1);
        setInput('');
      } else {
        setHistoryIndex(nextIndex);
        setInput(history[nextIndex]);
      }
      setTabSuggestions([]);
      return;
    }

    // TAB: Linux-Style Intelligent Autocompletion
    if (e.key === 'Tab') {
      e.preventDefault();

      const result = getAutocomplete(input, {
        nodes,
        currentNodeId,
        currentPath: promptPath,
        emails
      });

      if (result.hasChanged) {
        setInput(result.newInput);
        setTabSuggestions([]);
      } else if (result.candidates.length > 1) {
        // Show candidates like double-tab in bash
        setTabSuggestions(result.candidates);
        sound.executeSound();
      }
    } else {
      // Clear suggestions on any other key
      if (tabSuggestions.length > 0) {
        setTabSuggestions([]);
      }
    }
  };

  // Syntax highlighting for live input
  const renderHighlightedInput = () => {
    if (!input) return null;
    const parts = input.split(' ');
    const firstWord = parts[0];
    const rest = parts.slice(1);

    const isKnownCommand = ALL_COMMANDS.includes(firstWord.toLowerCase());
    const commandColor = isKnownCommand ? 'text-cyber-green font-bold' : 'text-gray-300';

    return (
      <span className="pointer-events-none select-none">
        <span className={commandColor}>{firstWord}</span>
        {rest.length > 0 && ' '}
        {rest.map((word, idx) => {
          let color = 'text-gray-200';
          if (word.startsWith('-')) {
            color = 'text-cyber-yellow'; // Flags
          } else if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/.test(word) || word.includes('.net') || word.includes('.web')) {
            color = 'text-cyber-cyan font-semibold'; // IPs / Hosts
          } else if (word.includes('/') || word.endsWith('.txt') || word.endsWith('.log') || word.endsWith('.php')) {
            color = 'text-blue-300'; // Paths
          }
          return (
            <React.Fragment key={idx}>
              <span className={color}>{word}</span>
              {idx < rest.length - 1 && ' '}
            </React.Fragment>
          );
        })}
      </span>
    );
  };

  const renderLineContent = (line: TerminalOutputLine) => {
    switch (line.type) {
      case 'cmd':
        return <span className="text-gray-200 font-semibold">{line.content}</span>;
      case 'success':
        return <span className="text-cyber-green">{line.content}</span>;
      case 'error':
        return <span className="text-cyber-red font-medium">{line.content}</span>;
      case 'warning':
        return <span className="text-cyber-yellow">{line.content}</span>;
      case 'info':
        return <span className="text-cyber-cyan">{line.content}</span>;
      case 'system':
        return <span className="text-cyber-purple italic">{line.content}</span>;
      default:
        return <span className="text-gray-300">{line.content}</span>;
    }
  };

  return (
    <div
      ref={containerRef}
      onClick={handleContainerClick}
      className="flex-1 flex flex-col bg-[#090d12] font-mono text-sm overflow-hidden border border-cyber-border rounded-lg shadow-2xl relative cursor-text"
    >
      {/* Kali Terminal Title Bar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-cyber-darker border-b border-cyber-border text-xs text-gray-400 select-none">
        <div className="flex items-center gap-2">
          <TerminalIcon className="w-3.5 h-3.5 text-cyber-cyan" />
          <span className="font-semibold text-gray-300">
            kali@{promptHost}: {displayPath}
          </span>
          <span className="text-[10px] text-gray-500 hidden sm:inline">(zsh)</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-1.5 text-[11px] text-gray-500">
            <Sparkles className="w-3 h-3 text-cyber-green" />
            <span>Tab: Autocompletar | Ctrl+L: Limpiar | Ctrl+C: Cancelar</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-600/70" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-600/70" />
            <div className="w-2.5 h-2.5 rounded-full bg-red-600/70" />
          </div>
        </div>
      </div>

      {/* Terminal Output Stream */}
      <div className="flex-1 p-4 overflow-y-auto space-y-1">
        {lines.map((line) => (
          <div key={line.id} className="whitespace-pre-wrap leading-relaxed break-all">
            {renderLineContent(line)}
          </div>
        ))}

        {/* Tab Autocompletion Suggestions Display (like Bash/Zsh) */}
        {tabSuggestions.length > 0 && (
          <div className="py-2 px-3 my-2 bg-cyber-darker/90 rounded border border-cyber-cyan/30 text-xs">
            <div className="text-[10px] text-cyber-cyan font-bold uppercase tracking-wider mb-1">
              Coincidencias ({tabSuggestions.length}):
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 font-mono">
              {tabSuggestions.map((item, idx) => (
                <span
                  key={idx}
                  className={`truncate ${
                    item.endsWith('/')
                      ? 'text-cyber-cyan font-bold'
                      : item.startsWith('-')
                      ? 'text-cyber-yellow'
                      : 'text-gray-300'
                  }`}
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Active Command Input Line with Kali Prompt */}
        <div className="pt-2 select-none">
          {/* Line 1: ┌──(user㉿host)-[path] */}
          <div className="flex items-center gap-1 text-xs leading-none">
            <span className="text-blue-500 font-bold">┌──(</span>
            <span className={isRoot ? 'text-cyber-red font-bold flex items-center gap-0.5' : 'text-blue-400 font-bold'}>
              {promptUser}
              <span className="text-gray-400 mx-0.5">{isRoot ? '💀' : '㉿'}</span>
              {promptHost}
            </span>
            <span className="text-blue-500 font-bold">)-[</span>
            <span className="text-cyber-cyan font-semibold">{displayPath}</span>
            <span className="text-blue-500 font-bold">]</span>
          </div>

          {/* Line 2: └─$ input */}
          <div className="flex items-center gap-2 mt-1">
            <span className="text-blue-500 font-bold text-sm leading-none flex-shrink-0">
              └─<span className={isRoot ? 'text-cyber-red' : 'text-blue-400'}>{isRoot ? '#' : '$'}</span>
            </span>

            <div className="flex-1 relative flex items-center">
              {/* Highlighted text behind invisible input for authentic zsh-syntax coloring */}
              <div className="absolute inset-0 flex items-center font-mono pointer-events-none text-transparent">
                {renderHighlightedInput()}
              </div>

              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  if (tabSuggestions.length > 0) setTabSuggestions([]);
                }}
                onKeyDown={handleKeyDown}
                className="w-full bg-transparent text-gray-100 outline-none border-none p-0 focus:ring-0 font-mono caret-cyber-green text-sm"
                autoFocus
                spellCheck={false}
                autoComplete="off"
              />
            </div>
          </div>
        </div>
        <div ref={bottomRef} />
      </div>
    </div>
  );
};
