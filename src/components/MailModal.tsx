import React, { useState } from 'react';
import { EmailMessage } from '../types';
import { Mail, Download, Paperclip, X, CheckCircle } from 'lucide-react';
import { sound } from '../engine/sound';

interface MailModalProps {
  emails: EmailMessage[];
  onClose: () => void;
  onReadEmail: (emailId: string) => void;
  onDownloadAttachment: (email: EmailMessage) => void;
}

export const MailModal: React.FC<MailModalProps> = ({
  emails,
  onClose,
  onReadEmail,
  onDownloadAttachment
}) => {
  const [selectedEmailId, setSelectedEmailId] = useState<string>(emails[0]?.id || '');
  const [downloadedAttachments, setDownloadedAttachments] = useState<Record<string, boolean>>({});

  const selectedEmail = emails.find(e => e.id === selectedEmailId) || emails[0];

  const handleSelect = (email: EmailMessage) => {
    sound.executeSound();
    setSelectedEmailId(email.id);
    if (!email.isRead) {
      onReadEmail(email.id);
    }
  };

  const handleDownload = (email: EmailMessage) => {
    if (!email.attachment) return;
    sound.success();
    onDownloadAttachment(email);
    setDownloadedAttachments(prev => ({ ...prev, [email.id]: true }));
  };

  const unreadCount = emails.filter(e => !e.isRead).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 select-none">
      <div className="w-full max-w-4xl bg-cyber-darker border border-cyber-cyan/50 rounded-lg shadow-2xl overflow-hidden font-mono text-sm flex flex-col h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-cyber-terminal border-b border-cyber-border">
          <div className="flex items-center gap-2 text-cyber-cyan font-bold">
            <Mail className="w-5 h-5" />
            <span>CYBERMAIL :: BANDEJA DE ENTRADA CIFRADA PGP</span>
            {unreadCount > 0 && (
              <span className="text-[10px] bg-cyber-cyan text-black font-bold px-1.5 py-0.5 rounded-full ml-2">
                {unreadCount} NUEVOS
              </span>
            )}
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

        {/* Body Split */}
        <div className="flex-1 flex overflow-hidden">
          {/* Email List (Left Column) */}
          <div className="w-1/3 border-r border-cyber-border overflow-y-auto bg-black/40">
            {emails.map(email => {
              const isSelected = email.id === selectedEmailId;
              return (
                <div
                  key={email.id}
                  onClick={() => handleSelect(email)}
                  className={`p-3 border-b border-cyber-border/60 cursor-pointer transition-colors relative ${
                    isSelected
                      ? 'bg-cyber-cyan/15 border-l-4 border-l-cyber-cyan'
                      : 'hover:bg-cyber-terminal/70'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className={`text-xs truncate font-semibold ${email.isRead ? 'text-gray-300' : 'text-cyber-green'}`}>
                      {email.from.split('<')[0].trim()}
                    </span>
                    <span className="text-[10px] text-gray-500 whitespace-nowrap">{email.date.split(' ')[1]}</span>
                  </div>

                  <div className="text-xs text-gray-200 font-medium truncate flex items-center gap-1.5">
                    {!email.isRead && <div className="w-2 h-2 rounded-full bg-cyber-green flex-shrink-0 animate-pulse" />}
                    <span className="truncate">{email.subject}</span>
                  </div>

                  {email.attachment && (
                    <div className="flex items-center gap-1 text-[10px] text-cyber-yellow mt-1">
                      <Paperclip className="w-3 h-3" />
                      <span className="truncate">{email.attachment.name}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Email Reader (Right Column) */}
          <div className="flex-1 flex flex-col overflow-y-auto bg-cyber-terminal p-5">
            {selectedEmail ? (
              <div className="space-y-4">
                {/* Meta details */}
                <div className="pb-3 border-b border-cyber-border/70 space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-gray-100">{selectedEmail.subject}</span>
                    <span className="text-gray-400">{selectedEmail.date}</span>
                  </div>
                  <div className="text-gray-300">
                    <strong className="text-cyber-cyan">De:</strong> {selectedEmail.from}
                  </div>
                </div>

                {/* Attachment Bar */}
                {selectedEmail.attachment && (
                  <div className="p-3 bg-cyber-darker rounded border border-cyber-yellow/40 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2 text-cyber-yellow">
                      <Paperclip className="w-4 h-4" />
                      <div>
                        <span className="font-bold">{selectedEmail.attachment.name}</span>
                        <div className="text-[11px] text-gray-400">Destino: {selectedEmail.attachment.targetPath}</div>
                      </div>
                    </div>

                    {downloadedAttachments[selectedEmail.id] ? (
                      <span className="flex items-center gap-1 text-cyber-green font-semibold px-2.5 py-1 bg-cyber-green/10 border border-cyber-green/30 rounded">
                        <CheckCircle className="w-3.5 h-3.5" /> DESCARGADO
                      </span>
                    ) : (
                      <button
                        onClick={() => handleDownload(selectedEmail)}
                        className="flex items-center gap-1.5 px-3 py-1 bg-cyber-yellow/15 hover:bg-cyber-yellow/25 border border-cyber-yellow text-cyber-yellow rounded font-semibold transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" /> Extraer a Rig
                      </button>
                    )}
                  </div>
                )}

                {/* Message Body */}
                <div className="text-gray-200 text-xs whitespace-pre-wrap leading-relaxed bg-black/30 p-4 rounded border border-cyber-border">
                  {selectedEmail.body}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                Selecciona un correo para leer su contenido.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
