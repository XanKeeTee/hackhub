import React, { useState } from 'react';
import { NetworkNode } from '../types';
import { Server, Shield, Unlock, Lock, Globe, Terminal, Play } from 'lucide-react';
import { sound } from '../engine/sound';

interface NetworkGraphProps {
  nodes: NetworkNode[];
  currentNodeId: string;
  onSelectCommand: (cmd: string) => void;
}

export const NetworkGraph: React.FC<NetworkGraphProps> = ({
  nodes,
  currentNodeId,
  onSelectCommand
}) => {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const selectedNode = nodes.find(n => n.id === selectedNodeId) || nodes.find(n => n.id === currentNodeId);

  const handleNodeClick = (node: NetworkNode) => {
    sound.executeSound();
    setSelectedNodeId(node.id);
  };

  return (
    <div className="flex flex-col h-full bg-cyber-terminal border border-cyber-border rounded-lg overflow-hidden select-none">
      {/* Header */}
      <div className="px-3 py-1.5 bg-cyber-darker border-b border-cyber-border text-xs flex items-center justify-between text-gray-400">
        <div className="flex items-center gap-2">
          <Globe className="w-3.5 h-3.5 text-cyber-cyan" />
          <span className="font-semibold text-gray-300">TOPOLOGÍA DE RED VIRTUAL</span>
        </div>
        <span className="text-[10px] text-cyber-cyan bg-cyber-cyan/10 px-1.5 py-0.5 rounded border border-cyber-cyan/30">
          {nodes.filter(n => n.discovered).length} / {nodes.length} Nodos Localizados
        </span>
      </div>

      {/* Visual Canvas Area */}
      <div className="relative flex-1 bg-[#050b11] overflow-hidden p-4 min-h-[220px]">
        {/* Subtle grid background */}
        <div 
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(#00e5ff 1px, transparent 1px)',
            backgroundSize: '24px 24px'
          }}
        />

        {/* SVG connection lines between player and nodes */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          {nodes.filter(n => !n.isPlayer && n.discovered).map(node => {
            const playerNode = nodes.find(n => n.isPlayer);
            if (!playerNode) return null;
            return (
              <line
                key={`line-${node.id}`}
                x1={playerNode.coords.x}
                y1={playerNode.coords.y}
                x2={node.coords.x}
                y2={node.coords.y}
                stroke={node.compromised ? '#00ff66' : '#1b2c3f'}
                strokeWidth={node.compromised ? '2' : '1'}
                strokeDasharray={node.compromised ? undefined : '4 4'}
              />
            );
          })}
        </svg>

        {/* Nodes */}
        {nodes.map(node => {
          if (!node.discovered && !node.isPlayer) {
            return (
              <div
                key={node.id}
                style={{ left: `${node.coords.x - 20}px`, top: `${node.coords.y - 20}px` }}
                className="absolute w-10 h-10 rounded-full bg-cyber-darker/60 border border-dashed border-gray-700/60 flex items-center justify-center opacity-40"
                title="Nodo no descubierto en esta subred"
              >
                <Lock className="w-4 h-4 text-gray-600" />
              </div>
            );
          }

          const isCurrent = node.id === currentNodeId;
          const isSelected = node.id === selectedNodeId;

          let borderColor = 'border-cyber-cyan/50';
          let bgColor = 'bg-cyber-cyan/10';
          let textColor = 'text-cyber-cyan';

          if (node.isPlayer) {
            borderColor = 'border-cyber-green';
            bgColor = 'bg-cyber-green/20';
            textColor = 'text-cyber-green';
          } else if (node.compromised) {
            borderColor = 'border-cyber-purple';
            bgColor = 'bg-cyber-purple/20';
            textColor = 'text-cyber-purple';
          }

          return (
            <div
              key={node.id}
              onClick={() => handleNodeClick(node)}
              style={{ left: `${node.coords.x - 24}px`, top: `${node.coords.y - 24}px` }}
              className={`absolute cursor-pointer transition-all duration-200 group flex flex-col items-center ${
                isSelected ? 'scale-110 z-20' : 'hover:scale-105 z-10'
              }`}
            >
              {/* Outer Glow Ring if Current */}
              {isCurrent && (
                <div className="absolute -inset-1 rounded-full bg-cyber-green/30 animate-ping pointer-events-none" />
              )}

              {/* Node Icon Circle */}
              <div
                className={`w-12 h-12 rounded-full border-2 flex items-center justify-center shadow-lg transition-colors ${borderColor} ${bgColor}`}
              >
                {node.isPlayer ? (
                  <Terminal className={`w-5 h-5 ${textColor}`} />
                ) : node.compromised ? (
                  <Unlock className={`w-5 h-5 ${textColor}`} />
                ) : (
                  <Server className={`w-5 h-5 ${textColor}`} />
                )}
              </div>

              {/* Node IP Label */}
              <span className={`mt-1 text-[11px] font-mono px-1.5 py-0.5 rounded bg-black/80 border ${borderColor} ${textColor}`}>
                {node.ip}
              </span>
            </div>
          );
        })}
      </div>

      {/* Selected Node Details Card & Actions */}
      {selectedNode && (
        <div className="p-3 bg-cyber-darker border-t border-cyber-border text-xs space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-bold text-gray-200 text-sm">{selectedNode.hostname}</span>
              <span className="text-gray-400 ml-2">({selectedNode.organization})</span>
            </div>
            <div className="flex items-center gap-1">
              {selectedNode.compromised ? (
                <span className="px-1.5 py-0.5 bg-cyber-purple/20 text-cyber-purple border border-cyber-purple/40 rounded text-[10px] font-semibold">
                  COMPROMETIDO
                </span>
              ) : selectedNode.hasIDS ? (
                <span className="px-1.5 py-0.5 bg-cyber-red/20 text-cyber-red border border-cyber-red/40 rounded text-[10px] flex items-center gap-1 font-semibold">
                  <Shield className="w-3 h-3" /> IDS ACTIVO
                </span>
              ) : (
                <span className="px-1.5 py-0.5 bg-cyber-cyan/10 text-cyber-cyan border border-cyber-cyan/30 rounded text-[10px]">
                  ESTÁNDAR
                </span>
              )}
            </div>
          </div>

          {/* Ports summary */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {selectedNode.ports.map(p => (
              <span
                key={p.port}
                className="px-2 py-0.5 rounded bg-black/50 border border-cyber-border text-[11px] text-gray-300 font-mono"
              >
                <span className="text-cyber-green">{p.port}</span>/{p.service} ({p.version})
              </span>
            ))}
          </div>

          {/* Quick Action Buttons to paste in terminal */}
          {!selectedNode.isPlayer && (
            <div className="flex items-center gap-2 pt-2 border-t border-cyber-border/60">
              <button
                onClick={() => onSelectCommand(`nmap -sV ${selectedNode.ip}`)}
                className="flex items-center gap-1 px-2 py-1 rounded bg-cyber-cyan/10 hover:bg-cyber-cyan/20 border border-cyber-cyan/40 text-cyber-cyan transition-colors text-[11px]"
              >
                <Play className="w-3 h-3" /> nmap -sV
              </button>

              <button
                onClick={() => onSelectCommand(`ping ${selectedNode.ip}`)}
                className="flex items-center gap-1 px-2 py-1 rounded bg-gray-800 hover:bg-gray-700 border border-gray-600 text-gray-200 transition-colors text-[11px]"
              >
                <Play className="w-3 h-3" /> ping
              </button>

              {selectedNode.ports.some(p => p.service === 'ssh') && (
                <button
                  onClick={() => onSelectCommand(`ssh admin@${selectedNode.ip}`)}
                  className="flex items-center gap-1 px-2 py-1 rounded bg-cyber-purple/10 hover:bg-cyber-purple/20 border border-cyber-purple/40 text-cyber-purple transition-colors text-[11px]"
                >
                  <Play className="w-3 h-3" /> ssh
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
