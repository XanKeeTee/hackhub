import React from 'react';
import { PlayerProfile } from '../types';
import { Zap, Shield, Crosshair, Users, Key, X, Plus } from 'lucide-react';
import { sound } from '../engine/sound';

interface SkillsModalProps {
  player: PlayerProfile;
  onClose: () => void;
  onUpgradeStat: (statKey: keyof PlayerProfile['attributes']) => void;
}

export const SkillsModal: React.FC<SkillsModalProps> = ({
  player,
  onClose,
  onUpgradeStat
}) => {
  // Available talent points based on level
  const totalAllocated = 
    player.attributes.offensive +
    player.attributes.evasion +
    player.attributes.social +
    player.attributes.crypto;

  const totalEarned = (player.level - 1) * 2 + 3; // Starts with 3 points, 2 per level
  const availablePoints = Math.max(0, totalEarned - totalAllocated);

  const skillsConfig = [
    {
      key: 'offensive' as const,
      name: 'Ofensiva & Exploits (Red Team)',
      icon: Crosshair,
      color: 'text-cyber-red border-cyber-red/40 bg-cyber-red/10',
      description: 'Acelera la velocidad de ataques de fuerza bruta (hydra) y desbloquea el uso de scripts de explotación remota.',
      value: player.attributes.offensive
    },
    {
      key: 'evasion' as const,
      name: 'Evasión & Sigilo (Stealth)',
      icon: Shield,
      color: 'text-cyber-cyan border-cyber-cyan/40 bg-cyber-cyan/10',
      description: 'Otorga +10 segundos extra por punto antes de que el IDS del objetivo complete el rastreo de tu máquina física.',
      value: player.attributes.evasion
    },
    {
      key: 'social' as const,
      name: 'Ingeniería Social (OSINT)',
      icon: Users,
      color: 'text-cyber-yellow border-cyber-yellow/40 bg-cyber-yellow/10',
      description: 'Permite interceptar contraseñas predeterminadas y notas de administradores descuidados.',
      value: player.attributes.social
    },
    {
      key: 'crypto' as const,
      name: 'Criptografía & Forense',
      icon: Key,
      color: 'text-cyber-purple border-cyber-purple/40 bg-cyber-purple/10',
      description: 'Aumenta el valor de rescates de datos y desbloquea descifrado de bases de datos financieras.',
      value: player.attributes.crypto
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 select-none">
      <div className="w-full max-w-2xl bg-cyber-darker border border-cyber-purple/50 rounded-lg shadow-2xl overflow-hidden font-mono text-sm flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-cyber-terminal border-b border-cyber-border">
          <div className="flex items-center gap-2 text-cyber-purple font-bold">
            <Zap className="w-5 h-5" />
            <span>ÁRBOL DE TALENTOS & HABILIDADES RPG</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-cyber-green bg-black/60 px-2 py-0.5 rounded border border-cyber-border font-bold">
              Puntos Disponibles: {availablePoints}
            </span>
            <button
              onClick={() => {
                sound.executeSound();
                onClose();
              }}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {skillsConfig.map(skill => {
            const Icon = skill.icon;
            const canUpgrade = availablePoints > 0;

            return (
              <div
                key={skill.key}
                className="p-4 rounded-lg border border-cyber-border bg-cyber-terminal hover:border-cyber-purple/40 transition-all flex items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-lg border flex items-center justify-center flex-shrink-0 mt-0.5 ${skill.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-100">{skill.name}</h4>
                    <p className="text-gray-400 text-xs mt-1 leading-relaxed">{skill.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="flex items-center gap-1 font-mono text-base font-bold text-gray-200 bg-black/60 px-2.5 py-1 rounded border border-cyber-border">
                    <span>{skill.value}</span>
                    <span className="text-gray-500 text-xs">pts</span>
                  </div>

                  <button
                    disabled={!canUpgrade}
                    onClick={() => {
                      if (canUpgrade) {
                        sound.success();
                        onUpgradeStat(skill.key);
                      }
                    }}
                    className={`p-1.5 rounded transition-colors ${
                      canUpgrade
                        ? 'bg-cyber-purple/20 hover:bg-cyber-purple/30 border border-cyber-purple text-cyber-purple cursor-pointer'
                        : 'bg-gray-800/40 border border-gray-700 text-gray-600 cursor-not-allowed'
                    }`}
                    title="Mejorar Habilidad"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
