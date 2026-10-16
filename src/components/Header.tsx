import React from 'react';
import { PlayerProfile } from '../types';
import { sound } from '../engine/sound';
import { ShieldAlert, Cpu, HardDrive, Wifi, DollarSign, Award, Volume2, VolumeX, Briefcase, ShoppingCart, Zap, Mail, Tv, Radio, RotateCcw } from 'lucide-react';

interface HeaderProps {
  player: PlayerProfile;
  activeTrace: {
    targetIp: string;
    totalSeconds: number;
    remainingSeconds: number;
    isActive: boolean;
  } | null;
  currentHost: string;
  unreadEmailCount: number;
  crtEnabled: boolean;
  ambientPlaying: boolean;
  onOpenModal: (modal: 'quests' | 'shop' | 'skills' | 'mail') => void;
  onToggleCRT: () => void;
  onToggleAmbient: () => void;
  onResetGame: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  player,
  activeTrace,
  currentHost,
  unreadEmailCount,
  crtEnabled,
  ambientPlaying,
  onOpenModal,
  onToggleCRT,
  onToggleAmbient,
  onResetGame
}) => {
  const [muted, setMuted] = React.useState(sound.getIsMuted());

  const handleToggleSound = () => {
    const isMuted = sound.toggleMute();
    setMuted(isMuted);
  };

  const xpPercentage = Math.min(100, Math.round((player.xp / (player.level * 500)) * 100));

  return (
    <header className="border-b border-cyber-border bg-cyber-darker text-xs font-mono select-none">
      {/* Top Warning Banner if Trace is Active */}
      {activeTrace && activeTrace.isActive && (
        <div className="bg-cyber-red/20 border-b border-cyber-red px-4 py-1.5 flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-2 text-cyber-red font-bold">
            <ShieldAlert className="w-4 h-4" />
            <span>[!] INTRUSIÓN DETECTADA POR EL FIREWALL DE {activeTrace.targetIp}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-gray-300">TIEMPO ANTES DE RASTREO FÍSICO:</span>
            <span className="text-base font-bold text-cyber-red bg-black/60 px-2 py-0.5 rounded border border-cyber-red/50">
              {activeTrace.remainingSeconds}s
            </span>
          </div>
        </div>
      )}

      {/* Main Info Bar */}
      <div className="px-4 py-2 flex flex-wrap items-center justify-between gap-3">
        {/* Logo and Host Status */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-cyber-green animate-pulse" />
            <span className="text-cyber-green font-bold text-sm tracking-wider">HACKHUB</span>
            <span className="text-gray-500 text-[10px]">v1.0.4</span>
          </div>

          <div className="h-4 w-[1px] bg-cyber-border hidden sm:block" />

          <div className="hidden sm:flex items-center gap-1.5 text-gray-400">
            <Wifi className="w-3.5 h-3.5 text-cyber-cyan" />
            <span>Nodo Actual:</span>
            <span className="text-cyber-cyan font-semibold">{currentHost}</span>
          </div>
        </div>

        {/* Rig Stats (CPU / RAM / Proxies) */}
        <div className="hidden md:flex items-center gap-4 text-gray-300 bg-cyber-terminal px-3 py-1 rounded border border-cyber-border">
          <div className="flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-cyber-green" />
            <span>CPU: {player.rig.cpuCores}c @ {player.rig.cpuSpeedGhz}GHz</span>
          </div>
          <div className="flex items-center gap-1.5">
            <HardDrive className="w-3.5 h-3.5 text-cyber-cyan" />
            <span>RAM: {player.rig.ramTotalMb}MB</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-cyber-yellow" />
            <span>Proxies: {player.rig.proxies} saltos</span>
          </div>
        </div>

        {/* Player Level, Money & Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Level & XP */}
          <div className="flex items-center gap-1.5 bg-cyber-terminal px-2.5 py-1 rounded border border-cyber-border">
            <Award className="w-3.5 h-3.5 text-cyber-purple" />
            <span>NIVEL {player.level}</span>
            <div className="w-16 h-1.5 bg-gray-800 rounded-full overflow-hidden border border-gray-700">
              <div 
                className="h-full bg-cyber-purple transition-all duration-300"
                style={{ width: `${xpPercentage}%` }}
              />
            </div>
          </div>

          {/* Crypto Balance */}
          <div className="flex items-center gap-1 bg-cyber-terminal px-2.5 py-1 rounded border border-cyber-border text-cyber-green">
            <DollarSign className="w-3.5 h-3.5" />
            <span className="font-bold">{player.cryptoBalance.toLocaleString()} CR</span>
          </div>

          {/* Quick Action Buttons */}
          <button
            onClick={() => onOpenModal('mail')}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-cyber-green/10 hover:bg-cyber-green/20 border border-cyber-green/40 text-cyber-green transition-colors relative"
            title="Bandeja de Correo Cifrado"
          >
            <Mail className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Correo</span>
            {unreadEmailCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-cyber-green animate-ping absolute -top-0.5 -right-0.5" />
            )}
          </button>

          <button
            onClick={() => onOpenModal('quests')}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-cyber-cyan/10 hover:bg-cyber-cyan/20 border border-cyber-cyan/40 text-cyber-cyan transition-colors"
            title="Ver Contratos y Misiones"
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Contratos</span>
          </button>

          <button
            onClick={() => onOpenModal('shop')}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-cyber-yellow/10 hover:bg-cyber-yellow/20 border border-cyber-yellow/40 text-cyber-yellow transition-colors"
            title="Darknet Shop"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Darknet</span>
          </button>

          <button
            onClick={() => onOpenModal('skills')}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-cyber-purple/10 hover:bg-cyber-purple/20 border border-cyber-purple/40 text-cyber-purple transition-colors"
            title="Árbol de Talentos"
          >
            <Zap className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Talentos</span>
          </button>

          <div className="h-4 w-[1px] bg-cyber-border hidden sm:block" />

          {/* CRT Monitor Effect Toggle */}
          <button
            onClick={onToggleCRT}
            className={`p-1 rounded border transition-colors ${
              crtEnabled
                ? 'bg-cyber-green/20 border-cyber-green text-cyber-green'
                : 'bg-cyber-terminal hover:bg-cyber-border border-cyber-border text-gray-400 hover:text-white'
            }`}
            title={crtEnabled ? 'Desactivar Filtro CRT Retro' : 'Activar Filtro CRT Retro'}
          >
            <Tv className="w-3.5 h-3.5" />
          </button>

          {/* Ambient Cyberpunk Synth Music Toggle */}
          <button
            onClick={onToggleAmbient}
            className={`p-1 rounded border transition-colors ${
              ambientPlaying
                ? 'bg-cyber-cyan/20 border-cyber-cyan text-cyber-cyan'
                : 'bg-cyber-terminal hover:bg-cyber-border border-cyber-border text-gray-400 hover:text-white'
            }`}
            title={ambientPlaying ? 'Pausar Música Ambiental Cyberpunk' : 'Reproducir Música Ambiental Cyberpunk'}
          >
            <Radio className="w-3.5 h-3.5" />
          </button>

          {/* Sound FX Toggle */}
          <button
            onClick={handleToggleSound}
            className="p-1 rounded bg-cyber-terminal hover:bg-cyber-border border border-cyber-border text-gray-400 hover:text-white transition-colors"
            title={muted ? 'Activar Efectos Sonoros' : 'Silenciar Efectos'}
          >
            {muted ? <VolumeX className="w-3.5 h-3.5 text-cyber-red" /> : <Volume2 className="w-3.5 h-3.5 text-cyber-green" />}
          </button>

          {/* Reset Game button */}
          <button
            onClick={onResetGame}
            className="p-1 rounded bg-cyber-terminal hover:bg-red-950/50 border border-cyber-border hover:border-cyber-red text-gray-500 hover:text-cyber-red transition-colors"
            title="Reiniciar Progreso de Partida"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
