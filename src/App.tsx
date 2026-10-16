import React, { useState, useEffect, useRef } from 'react';
import { EmailMessage, NetworkNode, PlayerProfile, Quest, ShopItem, TerminalOutputLine } from './types';
import { createInitialWorld, INITIAL_QUESTS, INITIAL_SHOP_ITEMS, INITIAL_EMAILS } from './engine/worldData';
import { executeCommand, CommandContext } from './engine/commandEngine';
import { writeFileByPath } from './engine/virtualFileSystem';
import { sound } from './engine/sound';
import { Header } from './components/Header';
import { Terminal } from './components/Terminal';
import { NetworkGraph } from './components/NetworkGraph';
import { QuestsModal } from './components/QuestsModal';
import { ShopModal } from './components/ShopModal';
import { SkillsModal } from './components/SkillsModal';
import { MailModal } from './components/MailModal';
import { CRTOverlay } from './components/CRTOverlay';

const SAVE_KEY = 'hackhub_protocol_save_v1';

function loadSavedData() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

export const App: React.FC = () => {
  const saved = loadSavedData();

  const [nodes, setNodes] = useState<NetworkNode[]>(() => saved?.nodes || createInitialWorld());
  const [currentNodeId, setCurrentNodeId] = useState<string>(() => saved?.currentNodeId || 'player-rig');
  const [currentUser, setCurrentUser] = useState<string>(() => saved?.currentUser || 'player');
  const [currentPath, setCurrentPath] = useState<string>(() => saved?.currentPath || '/home/player');

  const [player, setPlayer] = useState<PlayerProfile>(() => saved?.player || {
    handle: 'Zer0Byte',
    level: 1,
    xp: 0,
    cryptoBalance: 250,
    reputation: {
      cypherSec: 10,
      ghostProtocol: 5,
      onyxSyndicate: 0
    },
    attributes: {
      offensive: 1,
      evasion: 1,
      social: 1,
      crypto: 0
    },
    rig: {
      cpuCores: 2,
      cpuSpeedGhz: 2.8,
      ramTotalMb: 4096,
      ramUsedMb: 1024,
      storageGb: 512,
      proxies: 0
    }
  });

  const [quests, setQuests] = useState<Quest[]>(() => saved?.quests || INITIAL_QUESTS);
  const [shopItems, setShopItems] = useState<ShopItem[]>(() => saved?.shopItems || INITIAL_SHOP_ITEMS);
  const [emails, setEmails] = useState<EmailMessage[]>(() => saved?.emails || INITIAL_EMAILS);

  const [crtEnabled, setCrtEnabled] = useState<boolean>(() => (saved?.crtEnabled !== undefined ? saved.crtEnabled : true));
  const [ambientPlaying, setAmbientPlaying] = useState<boolean>(false);

  const [activeTrace, setActiveTrace] = useState<{
    targetIp: string;
    totalSeconds: number;
    remainingSeconds: number;
    isActive: boolean;
  } | null>(null);

  const [activeModal, setActiveModal] = useState<'quests' | 'shop' | 'skills' | 'mail' | null>(null);

  const terminalInputRef = useRef<HTMLInputElement>(null);

  // Auto-Save game state to localStorage
  useEffect(() => {
    try {
      const dataToSave = {
        nodes,
        currentNodeId,
        currentUser,
        currentPath,
        player,
        quests,
        shopItems,
        emails,
        crtEnabled
      };
      localStorage.setItem(SAVE_KEY, JSON.stringify(dataToSave));
    } catch {}
  }, [nodes, currentNodeId, currentUser, currentPath, player, quests, shopItems, emails, crtEnabled]);

  // Initial welcome message
  const [terminalLines, setTerminalLines] = useState<TerminalOutputLine[]>([
    {
      id: 'boot-1',
      type: 'info',
      content: `
██╗  ██╗ █████╗  ██████╗██╗  ██╗██╗  ██╗██╗   ██╗██████╗ 
██║  ██║██╔══██╗██╔════╝██║ ██╔╝██║  ██║██║   ██║██╔══██╗
███████║███████║██║     █████═╝ ███████║██║   ██║██████╔╝
██╔══██║██╔══██║██║     ██╔═██╗ ██╔══██║██║   ██║██╔══██╗
██║  ██║██║  ██║╚██████╗██║ ╚██╗██║  ██║╚██████╔╝██████╔╝
╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝ ╚═════╝ 
        [ HACKHUB OS - PROTOCOLO DE INTRUSIÓN V1.2 ]
`
    },
    {
      id: 'boot-2',
      type: 'success',
      content: '✓ Sistema iniciado. Entorno de virtualización cargado con persistencia de estado.'
    },
    {
      id: 'boot-3',
      type: 'text',
      content: 'Tienes mensajes sin leer en tu bandeja cifrada (escribe "mail" para verlos).'
    },
    {
      id: 'boot-4',
      type: 'info',
      content: 'Nuevas herramientas disponibles: "sudo" (escalada), "john" (cracking de hashes) y "mail download".'
    }
  ]);

  // Trace Countdown Timer
  useEffect(() => {
    if (!activeTrace || !activeTrace.isActive) return;

    const interval = setInterval(() => {
      setActiveTrace(prev => {
        if (!prev || !prev.isActive) return null;
        if (prev.remainingSeconds <= 1) {
          // TRACE COMPLETED - DISCONNECT
          clearInterval(interval);
          sound.error();

          // Force return to localhost
          setCurrentNodeId('player-rig');
          setCurrentUser('player');
          setCurrentPath('/home/player');

          setTerminalLines(lines => [
            ...lines,
            {
              id: Math.random().toString(),
              type: 'error',
              content: `\n[☠] ¡RASTREO IDS COMPLETADO! Tu dirección física ha sido triangulada.`
            },
            {
              id: Math.random().toString(),
              type: 'error',
              content: `[!] Conexión forzosamente abortada. Penalización de 50 CR en gastos de evasión.`
            }
          ]);

          setPlayer(p => ({
            ...p,
            cryptoBalance: Math.max(0, p.cryptoBalance - 50)
          }));

          return null;
        }

        // Trace siren tick
        if (prev.remainingSeconds % 5 === 0) {
          sound.traceAlert();
        }

        return {
          ...prev,
          remainingSeconds: prev.remainingSeconds - 1
        };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [activeTrace?.isActive]);

  // Level Up Check
  useEffect(() => {
    const requiredXp = player.level * 500;
    if (player.xp >= requiredXp) {
      sound.success();
      setPlayer(prev => ({
        ...prev,
        level: prev.level + 1,
        xp: prev.xp - requiredXp
      }));
      setTerminalLines(lines => [
        ...lines,
        {
          id: Math.random().toString(),
          type: 'success',
          content: `\n[★] ¡FELICIDADES! Has subido al NIVEL ${player.level + 1}. Tienes nuevos puntos de talento disponibles en 'skills'.`
        }
      ]);
    }
  }, [player.xp, player.level]);

  // Reset Game Progress
  const handleResetGame = () => {
    if (window.confirm('¿Seguro que deseas reiniciar tu progreso de juego y comenzar de cero?')) {
      localStorage.removeItem(SAVE_KEY);
      setNodes(createInitialWorld());
      setCurrentNodeId('player-rig');
      setCurrentUser('player');
      setCurrentPath('/home/player');
      setPlayer({
        handle: 'Zer0Byte',
        level: 1,
        xp: 0,
        cryptoBalance: 250,
        reputation: { cypherSec: 10, ghostProtocol: 5, onyxSyndicate: 0 },
        attributes: { offensive: 1, evasion: 1, social: 1, crypto: 0 },
        rig: { cpuCores: 2, cpuSpeedGhz: 2.8, ramTotalMb: 4096, ramUsedMb: 1024, storageGb: 512, proxies: 0 }
      });
      setQuests(INITIAL_QUESTS);
      setShopItems(INITIAL_SHOP_ITEMS);
      setEmails(INITIAL_EMAILS);
      setActiveTrace(null);
      sound.success();
      setTerminalLines(lines => [
        ...lines,
        {
          id: Math.random().toString(),
          type: 'system',
          content: '[!] Partida reiniciada. Se ha restaurado la configuración original de red.'
        }
      ]);
    }
  };

  // Toggle Ambient Music
  const handleToggleAmbient = () => {
    const isPlaying = sound.toggleAmbient();
    setAmbientPlaying(isPlaying);
  };

  // Toggle CRT
  const handleToggleCRT = () => {
    sound.executeSound();
    setCrtEnabled(prev => !prev);
  };

  // Handle command dispatch
  const handleCommand = (cmdText: string) => {
    if (!cmdText.trim()) return;

    const isRoot = currentUser === 'root';
    const promptSymbol = isRoot ? '#' : '$';
    const icon = isRoot ? '💀' : '㉿';
    const currentNode = nodes.find(n => n.id === currentNodeId);
    const hostName = currentNode ? currentNode.hostname : 'unknown';
    const displayP = currentPath.startsWith('/home/player')
      ? currentPath.replace('/home/player', '~')
      : currentPath;

    // Echo command with Kali Linux dual-line prompt
    setTerminalLines(prev => [
      ...prev,
      {
        id: Math.random().toString(),
        type: 'cmd',
        content: `┌──(${currentUser}${icon}${hostName})-[${displayP}]\n└─${promptSymbol} ${cmdText}`
      }
    ]);

    const context: CommandContext = {
      nodes,
      currentNodeId,
      currentPath,
      currentUser,
      player,
      quests,
      shopItems,
      emails,
      activeTrace,
      onUpdateNodes: setNodes,
      onUpdateCurrentNode: (nodeId, user, path) => {
        setCurrentNodeId(nodeId);
        setCurrentUser(user);
        setCurrentPath(path);
      },
      onUpdatePlayer: setPlayer,
      onUpdateQuests: setQuests,
      onUpdateShop: setShopItems,
      onUpdateEmails: setEmails,
      onStartTrace: (ip, seconds) => {
        setActiveTrace({
          targetIp: ip,
          totalSeconds: seconds,
          remainingSeconds: seconds,
          isActive: true
        });
      },
      onCancelTrace: () => {
        setActiveTrace(null);
      },
      onOpenModal: setActiveModal,
      onResetGame: handleResetGame
    };

    const newLines = executeCommand(cmdText, context);

    if (newLines.length === 1 && newLines[0].content === '__CLEAR__') {
      setTerminalLines([]);
    } else {
      setTerminalLines(prev => [...prev, ...newLines]);
    }
  };

  const currentNode = nodes.find(n => n.id === currentNodeId);

  // Quick command paste from Network Graph or Quests
  const handleSelectCommand = (cmd: string) => {
    if (terminalInputRef.current) {
      terminalInputRef.current.value = cmd;
      terminalInputRef.current.focus();
    }
  };

  // Buy Shop Item
  const handleBuyItem = (item: ShopItem) => {
    if (player.cryptoBalance < item.cost) return;

    setPlayer(prev => {
      const updatedRig = { ...prev.rig };
      if (item.statsEffect?.cpu) updatedRig.cpuCores += item.statsEffect.cpu;
      if (item.statsEffect?.ram) updatedRig.ramTotalMb += item.statsEffect.ram;
      if (item.statsEffect?.proxies) updatedRig.proxies += item.statsEffect.proxies;

      return {
        ...prev,
        cryptoBalance: prev.cryptoBalance - item.cost,
        rig: updatedRig
      };
    });

    setShopItems(prev =>
      prev.map(i => (i.id === item.id ? { ...i, purchased: true } : i))
    );

    setTerminalLines(lines => [
      ...lines,
      {
        id: Math.random().toString(),
        type: 'success',
        content: `[+] Instalado con éxito: ${item.name}. Especificaciones de tu Rig actualizadas.`
      }
    ]);
  };

  // Upgrade RPG Attribute
  const handleUpgradeStat = (statKey: keyof PlayerProfile['attributes']) => {
    setPlayer(prev => ({
      ...prev,
      attributes: {
        ...prev.attributes,
        [statKey]: prev.attributes[statKey] + 1
      }
    }));
  };

  // Activate Quest
  const handleActivateQuest = (questId: string) => {
    setQuests(prev =>
      prev.map(q => ({
        ...q,
        isActive: q.id === questId
      }))
    );
  };

  // Read email
  const handleReadEmail = (emailId: string) => {
    setEmails(prev =>
      prev.map(e => (e.id === emailId ? { ...e, isRead: true } : e))
    );
  };

  // Download attachment from email modal
  const handleDownloadAttachment = (email: EmailMessage) => {
    if (!email.attachment) return;
    const playerNode = nodes.find(n => n.isPlayer);
    if (playerNode) {
      writeFileByPath(playerNode.fileSystem, email.attachment.targetPath, email.attachment.content, 'player');
      setTerminalLines(lines => [
        ...lines,
        {
          id: Math.random().toString(),
          type: 'success',
          content: `[+] Adjunto '${email.attachment?.name}' guardado en '${email.attachment?.targetPath}'.`
        }
      ]);
    }
  };

  const unreadEmailCount = emails.filter(e => !e.isRead).length;

  return (
    <div className="flex flex-col h-screen w-screen bg-cyber-dark text-gray-200 overflow-hidden font-mono relative">
      {/* CRT Scanline Retro Effect */}
      <CRTOverlay enabled={crtEnabled} />

      {/* Top Header */}
      <Header
        player={player}
        activeTrace={activeTrace}
        currentHost={currentNode ? `${currentNode.hostname} (${currentNode.ip})` : '127.0.0.1'}
        unreadEmailCount={unreadEmailCount}
        crtEnabled={crtEnabled}
        ambientPlaying={ambientPlaying}
        onOpenModal={setActiveModal}
        onToggleCRT={handleToggleCRT}
        onToggleAmbient={handleToggleAmbient}
        onResetGame={handleResetGame}
      />

      {/* Main Workspace: Split View */}
      <main className="flex-1 flex flex-col lg:flex-row gap-3 p-3 overflow-hidden min-h-0">
        {/* Left: Terminal View */}
        <section className="flex-1 flex flex-col min-h-0">
          <Terminal
            lines={terminalLines}
            onCommand={handleCommand}
            promptUser={currentUser}
            promptHost={currentNode ? currentNode.hostname : 'kali-rig'}
            promptPath={currentPath}
            nodes={nodes}
            currentNodeId={currentNodeId}
            emails={emails}
            inputRef={terminalInputRef}
          />
        </section>

        {/* Right: Network Map */}
        <section className="w-full lg:w-[420px] xl:w-[480px] flex flex-col min-h-0 h-[280px] lg:h-auto">
          <NetworkGraph
            nodes={nodes}
            currentNodeId={currentNodeId}
            onSelectCommand={handleSelectCommand}
          />
        </section>
      </main>

      {/* Modals */}
      {activeModal === 'mail' && (
        <MailModal
          emails={emails}
          onClose={() => setActiveModal(null)}
          onReadEmail={handleReadEmail}
          onDownloadAttachment={handleDownloadAttachment}
        />
      )}

      {activeModal === 'quests' && (
        <QuestsModal
          quests={quests}
          onClose={() => setActiveModal(null)}
          onActivateQuest={handleActivateQuest}
          onRunHint={ip => handleSelectCommand(`nmap -sV ${ip}`)}
        />
      )}

      {activeModal === 'shop' && (
        <ShopModal
          player={player}
          shopItems={shopItems}
          onClose={() => setActiveModal(null)}
          onBuyItem={handleBuyItem}
        />
      )}

      {activeModal === 'skills' && (
        <SkillsModal
          player={player}
          onClose={() => setActiveModal(null)}
          onUpgradeStat={handleUpgradeStat}
        />
      )}
    </div>
  );
};
