import React from 'react';
import { PlayerProfile, ShopItem } from '../types';
import { ShoppingCart, Cpu, HardDrive, Shield, Check, X, DollarSign } from 'lucide-react';
import { sound } from '../engine/sound';

interface ShopModalProps {
  player: PlayerProfile;
  shopItems: ShopItem[];
  onClose: () => void;
  onBuyItem: (item: ShopItem) => void;
}

export const ShopModal: React.FC<ShopModalProps> = ({
  player,
  shopItems,
  onClose,
  onBuyItem
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 select-none">
      <div className="w-full max-w-2xl bg-cyber-darker border border-cyber-yellow/50 rounded-lg shadow-2xl overflow-hidden font-mono text-sm flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-cyber-terminal border-b border-cyber-border">
          <div className="flex items-center gap-2 text-cyber-yellow font-bold">
            <ShoppingCart className="w-5 h-5" />
            <span>MERCADO NEGRO :: DARKNET HARDWARE & EXPLOITS</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-cyber-green text-xs bg-black/60 px-2.5 py-1 rounded border border-cyber-border">
              <DollarSign className="w-3.5 h-3.5" />
              <span className="font-bold">{player.cryptoBalance.toLocaleString()} CR</span>
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
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {shopItems.map(item => {
            const canAfford = player.cryptoBalance >= item.cost;

            return (
              <div
                key={item.id}
                className={`p-4 rounded-lg border flex items-center justify-between gap-4 transition-all ${
                  item.purchased
                    ? 'border-gray-800 bg-black/40 opacity-70'
                    : 'border-cyber-border bg-cyber-terminal hover:border-cyber-yellow/40'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-cyber-darker border border-cyber-border flex items-center justify-center text-cyber-yellow">
                    {item.type === 'hardware' && <Cpu className="w-5 h-5" />}
                    {item.type === 'proxy' && <Shield className="w-5 h-5" />}
                    {item.type === 'tool' && <HardDrive className="w-5 h-5" />}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-100">{item.name}</h4>
                    <p className="text-gray-400 text-xs mt-0.5">{item.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-cyber-yellow font-bold text-sm">{item.cost} CR</span>

                  {item.purchased ? (
                    <span className="px-3 py-1 rounded bg-cyber-green/10 text-cyber-green border border-cyber-green/30 text-xs flex items-center gap-1 font-semibold">
                      <Check className="w-3.5 h-3.5" /> INSTALADO
                    </span>
                  ) : (
                    <button
                      disabled={!canAfford}
                      onClick={() => {
                        if (canAfford) {
                          sound.success();
                          onBuyItem(item);
                        } else {
                          sound.error();
                        }
                      }}
                      className={`px-3 py-1 rounded text-xs transition-colors font-semibold ${
                        canAfford
                          ? 'bg-cyber-yellow/10 hover:bg-cyber-yellow/20 border border-cyber-yellow text-cyber-yellow cursor-pointer'
                          : 'bg-gray-800/50 border border-gray-700 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      Comprar
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
