import React from 'react';
import { Quest } from '../types';
import { Briefcase, CheckCircle, Clock, AlertTriangle, X, Terminal } from 'lucide-react';
import { sound } from '../engine/sound';

interface QuestsModalProps {
  quests: Quest[];
  onClose: () => void;
  onActivateQuest: (questId: string) => void;
  onRunHint: (hintCmd: string) => void;
}

export const QuestsModal: React.FC<QuestsModalProps> = ({
  quests,
  onClose,
  onActivateQuest,
  onRunHint
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 select-none">
      <div className="w-full max-w-2xl bg-cyber-darker border border-cyber-cyan/50 rounded-lg shadow-2xl overflow-hidden font-mono text-sm flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-cyber-terminal border-b border-cyber-border">
          <div className="flex items-center gap-2 text-cyber-cyan font-bold">
            <Briefcase className="w-5 h-5" />
            <span>TABLÓN DE CONTRATOS & INTELIGENCIA</span>
          </div>
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {quests.map(quest => {
            const factionColor =
              quest.faction === 'CypherSec'
                ? 'text-cyber-cyan border-cyber-cyan/40 bg-cyber-cyan/10'
                : quest.faction === 'GhostProtocol'
                ? 'text-cyber-green border-cyber-green/40 bg-cyber-green/10'
                : 'text-cyber-purple border-cyber-purple/40 bg-cyber-purple/10';

            return (
              <div
                key={quest.id}
                className={`p-4 rounded-lg border transition-all ${
                  quest.isCompleted
                    ? 'border-gray-800 bg-black/40 opacity-70'
                    : quest.isActive
                    ? 'border-cyber-green/60 bg-cyber-green/5 shadow-lg'
                    : 'border-cyber-border bg-cyber-terminal'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${factionColor}`}>
                        {quest.faction}
                      </span>
                      <span className="text-[11px] text-gray-400">Dificultad: {quest.difficulty}</span>
                    </div>
                    <h3 className="font-bold text-gray-100 text-base">{quest.title}</h3>
                  </div>

                  {quest.isCompleted ? (
                    <div className="flex items-center gap-1 text-cyber-green text-xs font-semibold px-2 py-1 bg-cyber-green/10 rounded border border-cyber-green/30">
                      <CheckCircle className="w-4 h-4" /> COMPLETADO
                    </div>
                  ) : quest.isActive ? (
                    <div className="flex items-center gap-1 text-cyber-yellow text-xs font-semibold px-2 py-1 bg-cyber-yellow/10 rounded border border-cyber-yellow/30 animate-pulse">
                      <Clock className="w-4 h-4" /> ACTIVO
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        sound.executeSound();
                        onActivateQuest(quest.id);
                      }}
                      className="px-3 py-1 bg-cyber-cyan/10 hover:bg-cyber-cyan/20 border border-cyber-cyan/40 text-cyber-cyan rounded text-xs transition-colors"
                    >
                      Aceptar
                    </button>
                  )}
                </div>

                <p className="text-gray-300 text-xs mt-2 leading-relaxed">{quest.description}</p>

                {/* Target & Rewards */}
                <div className="mt-3 pt-3 border-t border-cyber-border flex flex-wrap items-center justify-between text-xs gap-2">
                  <div className="flex items-center gap-3">
                    <span className="text-gray-400">Objetivo: <span className="text-cyber-cyan font-bold">{quest.targetIp}</span></span>
                    <span className="text-gray-400">Recompensa: <span className="text-cyber-green font-bold">+{quest.rewardXp} XP</span> | <span className="text-cyber-yellow font-bold">+{quest.rewardCrypto} CR</span></span>
                  </div>

                  {quest.isActive && !quest.isCompleted && (
                    <button
                      onClick={() => {
                        sound.executeSound();
                        onRunHint(quest.targetIp);
                        onClose();
                      }}
                      className="flex items-center gap-1 text-xs text-cyber-yellow hover:underline"
                    >
                      <Terminal className="w-3.5 h-3.5" /> Escanear {quest.targetIp}
                    </button>
                  )}
                </div>

                {/* Hint */}
                {quest.isActive && !quest.isCompleted && (
                  <div className="mt-2 text-[11px] bg-black/60 p-2 rounded border border-cyber-border/70 text-gray-400 flex items-start gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-cyber-yellow flex-shrink-0 mt-0.5" />
                    <span><strong className="text-cyber-yellow">Pista:</strong> {quest.hint}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
