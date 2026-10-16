import { EmailMessage, NetworkNode, PlayerProfile, Quest, ShopItem, TerminalOutputLine } from '../types';
import { getNodeByPath, removeNodeByPath, resolvePath, writeFileByPath } from './virtualFileSystem';
import { sound } from './sound';

export interface CommandContext {
  nodes: NetworkNode[];
  currentNodeId: string;
  currentPath: string;
  currentUser: string;
  player: PlayerProfile;
  quests: Quest[];
  shopItems: ShopItem[];
  emails: EmailMessage[];
  activeTrace: {
    targetIp: string;
    totalSeconds: number;
    remainingSeconds: number;
    isActive: boolean;
  } | null;
  onUpdateNodes: (nodes: NetworkNode[]) => void;
  onUpdateCurrentNode: (nodeId: string, user: string, path: string) => void;
  onUpdatePlayer: (updater: (prev: PlayerProfile) => PlayerProfile) => void;
  onUpdateQuests: (quests: Quest[]) => void;
  onUpdateShop: (shop: ShopItem[]) => void;
  onUpdateEmails: (emails: EmailMessage[]) => void;
  onStartTrace: (ip: string, seconds: number) => void;
  onCancelTrace: () => void;
  onOpenModal: (modal: 'quests' | 'shop' | 'skills' | 'mail' | null) => void;
  onResetGame?: () => void;
}

export function executeCommand(
  rawInput: string,
  context: CommandContext
): TerminalOutputLine[] {
  const trimmed = rawInput.trim();
  if (!trimmed) return [];

  const parts = trimmed.match(/(?:[^\s"']+|"[^"]*"|'[^']*')+/g) || [];
  const command = parts[0]?.toLowerCase();
  const args = parts.slice(1).map(arg => arg.replace(/^["']|["']$/g, ''));

  const currentNode = context.nodes.find(n => n.id === context.currentNodeId);
  if (!currentNode) {
    return [{ id: Math.random().toString(), type: 'error', content: 'Error crítico: Nodo no encontrado.' }];
  }

  const lines: TerminalOutputLine[] = [];

  const addLine = (type: TerminalOutputLine['type'], content: string) => {
    lines.push({ id: Math.random().toString(), type, content });
  };

  switch (command) {
    // ==========================================
    // HELP
    // ==========================================
    case 'help': {
      sound.executeSound();
      addLine('info', '╔══════════════════════════════════════════════════════════════════════════════╗');
      addLine('info', '║                       HACKHUB TERMINAL PROTOCOL - V1.0                       ║');
      addLine('info', '╚══════════════════════════════════════════════════════════════════════════════╝');
      addLine('text', 'COMANDOS DE SISTEMA & NAVEGACIÓN:');
      addLine('text', '  ls [-la] [ruta]      Lista archivos y permisos del directorio actual o especificado.');
      addLine('text', '  cd <ruta>            Cambia de directorio (ej: cd /home, cd ..).');
      addLine('text', '  pwd                  Muestra la ruta absoluta del directorio de trabajo actual.');
      addLine('text', '  cat <archivo>        Muestra el contenido en texto del archivo.');
      addLine('text', '  rm [-rf] <archivo>   Elimina un archivo (¡vital para borrar logs en /var/log!).');
      addLine('text', '  clear                Limpia la pantalla de la terminal.');
      addLine('text', '');
      addLine('text', 'COMANDOS DE RED & HACKING:');
      addLine('text', '  ping <ip>            Envía paquetes ICMP para verificar conectividad y latencia.');
      addLine('text', '  nmap [-sV] <ip>      Escaneo de puertos. Con -sV identifica versiones exactas.');
      addLine('text', '  searchsploit <query> Busca vulnerabilidades y exploits conocidos para un servicio.');
      addLine('text', '  exploit -t <ip> -v <id> Lanza un exploit contra un servicio vulnerable del objetivo.');
      addLine('text', '  hydra -l <u] -P <p> <ip> <srv>  Ataque de diccionario por fuerza bruta (ej: hydra -l admin -P /home/player/wordlists/passwords.txt 192.168.1.10 ssh).');
      addLine('text', '  ssh <user>@<ip>      Conéctate a una máquina remota mediante SSH.');
      addLine('text', '  disconnect / exit    Cierra la sesión remota y vuelve a tu máquina local.');
      addLine('text', '');
      addLine('text', 'COMANDOS RPG & GESTIÓN:');
      addLine('text', '  quests / contracts   Abre el panel de contratos y misiones activas.');
      addLine('text', '  status / stats       Muestra nivel, experiencia, cripto y árbol de talentos.');
      addLine('text', '  hardware             Muestra estado de CPU, RAM y nodos proxy de tu Rig.');
      addLine('text', '  darknet / shop       Accede a la tienda clandestina de mejoras de hardware.');
      break;
    }

    // ==========================================
    // CLEAR
    // ==========================================
    case 'clear': {
      return [{ id: 'clear-signal', type: 'system', content: '__CLEAR__' }];
    }

    // ==========================================
    // PWD
    // ==========================================
    case 'pwd': {
      addLine('text', context.currentPath);
      break;
    }

    // ==========================================
    // LS
    // ==========================================
    case 'ls': {
      let targetPath = context.currentPath;
      let showDetails = false;

      for (const arg of args) {
        if (arg === '-la' || arg === '-l' || arg === '-a') {
          showDetails = true;
        } else if (!arg.startsWith('-')) {
          targetPath = resolvePath(context.currentPath, arg);
        }
      }

      const node = getNodeByPath(currentNode.fileSystem, targetPath);
      if (!node) {
        sound.error();
        addLine('error', `ls: no se puede acceder a '${targetPath}': No existe el archivo o el directorio`);
        break;
      }

      if (node.type === 'file') {
        addLine('text', node.name);
        break;
      }

      const children = Object.values(node.children);
      if (children.length === 0) {
        break;
      }

      if (showDetails) {
        addLine('info', `total ${children.length * 4}`);
        children.forEach(item => {
          const perm = item.type === 'dir' ? `d${item.permissions}` : `-${item.permissions}`;
          const size = item.type === 'file' ? item.size.toString().padStart(6, ' ') : '  4096';
          addLine('text', `${perm}  1 ${item.owner.padEnd(8, ' ')} ${size} B  ${item.name}${item.type === 'dir' ? '/' : ''}`);
        });
      } else {
        const names = children.map(item => item.name + (item.type === 'dir' ? '/' : '')).join('   ');
        addLine('text', names);
      }
      break;
    }

    // ==========================================
    // CD
    // ==========================================
    case 'cd': {
      const target = args[0] || '/';
      const resolved = resolvePath(context.currentPath, target);
      const targetNode = getNodeByPath(currentNode.fileSystem, resolved);

      if (!targetNode) {
        sound.error();
        addLine('error', `cd: no existe el directorio: ${target}`);
      } else if (targetNode.type !== 'dir') {
        sound.error();
        addLine('error', `cd: no es un directorio: ${target}`);
      } else {
        context.onUpdateCurrentNode(context.currentNodeId, context.currentUser, resolved);
      }
      break;
    }

    // ==========================================
    // CAT
    // ==========================================
    case 'cat': {
      if (!args[0]) {
        addLine('error', 'Uso: cat <archivo>');
        break;
      }
      const targetPath = resolvePath(context.currentPath, args[0]);
      const fileNode = getNodeByPath(currentNode.fileSystem, targetPath);

      if (!fileNode) {
        sound.error();
        addLine('error', `cat: ${args[0]}: No existe el archivo`);
      } else if (fileNode.type === 'dir') {
        sound.error();
        addLine('error', `cat: ${args[0]}: Es un directorio`);
      } else {
        sound.executeSound();
        addLine('text', fileNode.content);

        // Check quest objectives for reading/exfiltrating files
        context.quests.forEach(q => {
          if (q.isActive && !q.isCompleted && q.targetIp === currentNode.ip) {
            if (q.targetFile && targetPath.endsWith(q.targetFile.split('/').pop()!)) {
              q.isCompleted = true;
              sound.success();
              addLine('success', `\n[★] ¡OBJETIVO DE MISIÓN COMPLETADO: ${q.title}!`);
              addLine('success', `[+] Recompensa obtenida: +${q.rewardXp} XP | +${q.rewardCrypto} CR (Criptos)`);
              context.onUpdatePlayer(p => ({
                ...p,
                xp: p.xp + q.rewardXp,
                cryptoBalance: p.cryptoBalance + q.rewardCrypto
              }));
              context.onUpdateQuests([...context.quests]);
            }
          }
        });
      }
      break;
    }

    // ==========================================
    // RM
    // ==========================================
    case 'rm': {
      let targetFile = args[0];
      if (args[0] === '-rf' || args[0] === '-r' || args[0] === '-f') {
        targetFile = args[1];
      }
      if (!targetFile) {
        addLine('error', 'Uso: rm [-rf] <archivo>');
        break;
      }

      const resolved = resolvePath(context.currentPath, targetFile);
      const success = removeNodeByPath(currentNode.fileSystem, resolved);

      if (success) {
        sound.executeSound();
        addLine('text', `Eliminado: ${resolved}`);

        // Check if logs were wiped to neutralize IDS trace!
        if (resolved.includes('/log/') && context.activeTrace && context.activeTrace.targetIp === currentNode.ip) {
          context.onCancelTrace();
          sound.success();
          addLine('success', `[✓] ¡HUELLAS BORRADAS! El IDS ha perdido la pista de intrusión. Rastreo cancelado.`);

          // Quest check for log wipe
          context.quests.forEach(q => {
            if (q.isActive && !q.isCompleted && q.actionRequired === 'delete_logs' && q.targetIp === currentNode.ip) {
              q.isCompleted = true;
              addLine('success', `[★] ¡CONTRATO COMPLETADO: ${q.title}!`);
              addLine('success', `[+] +${q.rewardXp} XP | +${q.rewardCrypto} CR`);
              context.onUpdatePlayer(p => ({
                ...p,
                xp: p.xp + q.rewardXp,
                cryptoBalance: p.cryptoBalance + q.rewardCrypto
              }));
              context.onUpdateQuests([...context.quests]);
            }
          });
        }
      } else {
        sound.error();
        addLine('error', `rm: no se pudo eliminar '${targetFile}': No existe el archivo`);
      }
      break;
    }

    // ==========================================
    // PING
    // ==========================================
    case 'ping': {
      const targetIp = args[0];
      if (!targetIp) {
        addLine('error', 'Uso: ping <ip_destino>');
        break;
      }

      const target = context.nodes.find(n => n.ip === targetIp || n.hostname.toLowerCase() === targetIp.toLowerCase());
      if (!target) {
        sound.error();
        addLine('text', `PING ${targetIp} (${targetIp}): 56 data bytes`);
        addLine('error', `Request timeout for icmp_seq 0`);
        addLine('error', `Request timeout for icmp_seq 1`);
        addLine('error', `--- ${targetIp} ping statistics ---`);
        addLine('error', `2 packets transmitted, 0 packets received, 100.0% packet loss`);
        break;
      }

      sound.executeSound();
      target.discovered = true;
      context.onUpdateNodes([...context.nodes]);

      addLine('info', `PING ${target.ip} (${target.hostname}): 56 data bytes`);
      addLine('text', `64 bytes from ${target.ip}: icmp_seq=0 ttl=64 time=14.2 ms`);
      addLine('text', `64 bytes from ${target.ip}: icmp_seq=1 ttl=64 time=12.8 ms`);
      addLine('text', `64 bytes from ${target.ip}: icmp_seq=2 ttl=64 time=15.1 ms`);
      addLine('success', `--- ${target.ip} ping statistics: 0% packet loss, host UP ---`);
      break;
    }

    // ==========================================
    // NMAP
    // ==========================================
    case 'nmap': {
      let targetIp = args[0];
      let versionScan = false;

      for (const arg of args) {
        if (arg === '-sV') {
          versionScan = true;
        } else if (!arg.startsWith('-')) {
          targetIp = arg;
        }
      }

      if (!targetIp) {
        addLine('error', 'Uso: nmap [-sV] <ip_objetivo>');
        break;
      }

      const target = context.nodes.find(n => n.ip === targetIp || n.hostname.toLowerCase() === targetIp.toLowerCase());
      if (!target) {
        sound.error();
        addLine('error', `Nmap: Failed to resolve host '${targetIp}'.`);
        break;
      }

      sound.executeSound();
      target.discovered = true;
      context.onUpdateNodes([...context.nodes]);

      addLine('info', `Starting Nmap 7.94 ( https://nmap.org ) at 2026-10-16`);
      addLine('text', `Nmap scan report for ${target.hostname} (${target.ip})`);
      addLine('text', `Host is up (0.014s latency).`);
      addLine('text', `Not shown: 997 closed tcp ports (reset)`);
      addLine('info', `PORT     STATE SERVICE ${versionScan ? '    VERSION' : ''}`);

      target.ports.forEach(p => {
        const portStr = `${p.port}/tcp`.padEnd(9, ' ');
        const stateStr = (p.isOpen ? 'open' : 'closed').padEnd(9, ' ');
        const servStr = p.service.padEnd(10, ' ');
        const verStr = versionScan ? p.version : '';
        addLine('success', `${portStr}${stateStr}${servStr} ${verStr}`);
      });

      addLine('text', `\nNmap done: 1 IP address (1 host up) scanned in 0.82 seconds.`);

      // If host has IDS and wasn't active, high scan triggers trace if aggressive
      if (target.hasIDS && !target.compromised) {
        const bonusProxies = context.player.rig.proxies * 20;
        const totalTraceTime = target.traceSpeedSeconds + bonusProxies + (context.player.attributes.evasion * 10);
        context.onStartTrace(target.ip, totalTraceTime);
        sound.traceAlert();
        addLine('warning', `\n[!] ALERTA: El firewall de ${target.hostname} detectó el escaneo de puertos.`);
        addLine('warning', `[!] SISTEMA IDS ACTIVADO: Rastreo iniciado. Tienes ${totalTraceTime}s.`);
      }
      break;
    }

    // ==========================================
    // SEARCHSPLOIT
    // ==========================================
    case 'searchsploit': {
      const query = args.join(' ').toLowerCase();
      if (!query) {
        addLine('error', 'Uso: searchsploit <termino_busqueda>');
        break;
      }

      sound.executeSound();
      addLine('info', `---------------------------------------------------------------------------------------------------`);
      addLine('info', ` Exploit Title                                                       |  Path`);
      addLine('info', `---------------------------------------------------------------------------------------------------`);

      if (query.includes('vsftpd') || query.includes('2.3.4')) {
        addLine('success', ` vsftpd 2.3.4 - Backdoor Command Execution                           | unix/remote/vsftpd-234-backdoor`);
      } else if (query.includes('apache') || query.includes('2.4.49')) {
        addLine('success', ` Apache HTTP Server 2.4.49 - Path Traversal & Remote Code Execution  | multiple/remote/apache-2449-rce`);
      } else if (query.includes('ssh') || query.includes('openssh')) {
        addLine('text', ` OpenSSH 7.2p2 - Username Enumeration                                | linux/remote/openssh-enum`);
      } else {
        addLine('text', ` No results found for '${query}'. Try searching for service names (vsftpd, apache, etc).`);
      }
      addLine('info', `---------------------------------------------------------------------------------------------------`);
      break;
    }

    // ==========================================
    // EXPLOIT
    // ==========================================
    case 'exploit': {
      let targetIp = '';
      let vulnId = '';

      for (let i = 0; i < args.length; i++) {
        if (args[i] === '-t' && args[i + 1]) targetIp = args[i + 1];
        if (args[i] === '-v' && args[i + 1]) vulnId = args[i + 1];
      }

      if (!targetIp || !vulnId) {
        addLine('error', 'Uso: exploit -t <ip_objetivo> -v <id_vulnerabilidad>');
        addLine('info', 'Ejemplo: exploit -t 192.168.1.45 -v vsftpd-234-backdoor');
        break;
      }

      const target = context.nodes.find(n => n.ip === targetIp);
      if (!target) {
        sound.error();
        addLine('error', `Exploit: Host ${targetIp} inalcanzable.`);
        break;
      }

      const matchingPort = target.ports.find(p => p.vulnerabilityId === vulnId);
      if (!matchingPort) {
        sound.error();
        addLine('error', `[*] Enviando payload a ${targetIp}...`);
        addLine('error', `[-] Fallo en la explotación. El servicio no es vulnerable al exploit '${vulnId}'.`);
        break;
      }

      sound.success();
      target.compromised = true;
      target.rootAccess = true;
      context.onUpdateNodes([...context.nodes]);

      addLine('info', `[*] Objetivo: ${target.hostname} (${target.ip})`);
      addLine('info', `[*] Verificando servicio ${matchingPort.service} en puerto ${matchingPort.port}...`);
      addLine('text', `[*] Inyectando payload de desbordamiento y disparando backdoor...`);
      addLine('success', `[+] ¡SHELL DE ACCESO ROOT OBTENIDA EN ${target.hostname}!`);

      // Automatically connect player to the target
      context.onUpdateCurrentNode(target.id, 'root', '/');

      // Start IDS trace if hasIDS
      if (target.hasIDS && !context.activeTrace) {
        const bonusProxies = context.player.rig.proxies * 25;
        const totalTraceTime = target.traceSpeedSeconds + bonusProxies + (context.player.attributes.evasion * 10);
        context.onStartTrace(target.ip, totalTraceTime);
        sound.traceAlert();
        addLine('warning', `\n[!] ADVERTENCIA CRÍTICA: Intrusión detectada por el IDS de ${target.hostname}.`);
        addLine('warning', `[!] Temporizador de rastreo activo: ${totalTraceTime} segundos.`);
        addLine('warning', `[!] Consejo: Encuentra y elimina los logs en /var/log/ antes de desconectarte.`);
      }
      break;
    }

    // ==========================================
    // HYDRA (BRUTE FORCE)
    // ==========================================
    case 'hydra': {
      let user = '';
      let passList = '';
      let targetIp = '';
      let service = 'ssh';

      for (let i = 0; i < args.length; i++) {
        if (args[i] === '-l' && args[i + 1]) user = args[i + 1];
        if (args[i] === '-P' && args[i + 1]) passList = args[i + 1];
      }
      // Target IP is usually the 2nd to last and service is last
      const positional = args.filter(a => !a.startsWith('-') && a !== user && a !== passList);
      if (positional.length >= 1) targetIp = positional[0];
      if (positional.length >= 2) service = positional[1];

      if (!user || !passList || !targetIp) {
        addLine('error', 'Uso: hydra -l <usuario> -P <ruta_diccionario> <ip> <servicio>');
        addLine('info', 'Ejemplo: hydra -l admin -P /home/player/wordlists/passwords.txt 192.168.1.10 ssh');
        break;
      }

      // Check if wordlist exists on player rig
      const playerNode = context.nodes.find(n => n.isPlayer);
      const wordlistNode = playerNode ? getNodeByPath(playerNode.fileSystem, passList) : null;
      if (!wordlistNode || wordlistNode.type !== 'file') {
        sound.error();
        addLine('error', `Hydra: No se encuentra el diccionario de contraseñas '${passList}'.`);
        break;
      }

      const target = context.nodes.find(n => n.ip === targetIp);
      if (!target) {
        sound.error();
        addLine('error', `Hydra: No se puede conectar con el host ${targetIp}.`);
        break;
      }

      const passwords = wordlistNode.content.split('\n').map(p => p.trim()).filter(Boolean);
      addLine('info', `Hydra v9.5 (c) 2026 by van Hauser - Starting dictionary attack`);
      addLine('text', `[*] Attacking ${service}://${target.ip} with user '${user}' (${passwords.length} passwords)...`);

      const portService = target.ports.find(p => p.service === service && p.isOpen);
      let foundPass = '';

      if (portService && portService.validCredentials) {
        for (const cred of portService.validCredentials) {
          if (cred.user === user && passwords.includes(cred.pass)) {
            foundPass = cred.pass;
            break;
          }
        }
      }

      if (foundPass) {
        sound.success();
        target.compromised = true;
        context.onUpdateNodes([...context.nodes]);
        addLine('success', `[${service.toUpperCase()}] Host: ${target.ip}  Login: ${user}  Password: ${foundPass}`);
        addLine('success', `1 of 1 target successfully completed, 1 valid password found.`);
        addLine('info', `Puedes conectarte usando: ssh ${user}@${target.ip}`);
      } else {
        sound.error();
        addLine('error', `[0] No valid passwords found in wordlist '${passList}' for user '${user}'.`);
      }
      break;
    }

    // ==========================================
    // SSH
    // ==========================================
    case 'ssh': {
      const connStr = args[0];
      if (!connStr || !connStr.includes('@')) {
        addLine('error', 'Uso: ssh <usuario>@<ip>');
        break;
      }

      const [user, targetIp] = connStr.split('@');
      const target = context.nodes.find(n => n.ip === targetIp || n.hostname.toLowerCase() === targetIp.toLowerCase());

      if (!target) {
        sound.error();
        addLine('error', `ssh: connect to host ${targetIp} port 22: Connection refused`);
        break;
      }

      const sshPort = target.ports.find(p => p.service === 'ssh' && p.isOpen);
      if (!sshPort) {
        sound.error();
        addLine('error', `ssh: connect to host ${target.ip} port 22: Port closed`);
        break;
      }

      // Check credentials or rootAccess
      const valid = target.rootAccess || (sshPort.validCredentials && sshPort.validCredentials.some(c => c.user === user));
      if (!valid) {
        sound.error();
        addLine('error', `Permission denied (publickey,password) for user ${user}@${target.ip}`);
        break;
      }

      sound.success();
      target.compromised = true;
      context.onUpdateNodes([...context.nodes]);
      context.onUpdateCurrentNode(target.id, user, user === 'root' ? '/' : `/home/${user}`);

      addLine('success', `Connected to ${target.hostname} (${target.ip}).`);
      addLine('text', `Last login: Sun Oct 14 2026 from 10.0.0.1`);

      if (target.hasIDS && !context.activeTrace) {
        const bonusProxies = context.player.rig.proxies * 25;
        const totalTraceTime = target.traceSpeedSeconds + bonusProxies + (context.player.attributes.evasion * 10);
        context.onStartTrace(target.ip, totalTraceTime);
        sound.traceAlert();
        addLine('warning', `[!] IDS ACTIVO en ${target.hostname}. Rastreo en curso: ${totalTraceTime}s.`);
      }
      break;
    }

    // ==========================================
    // DISCONNECT / EXIT
    // ==========================================
    case 'disconnect':
    case 'exit': {
      if (currentNode.isPlayer) {
        addLine('info', 'Ya estás en tu terminal local (kali-rig).');
        break;
      }

      const playerNode = context.nodes.find(n => n.isPlayer)!;
      context.onUpdateCurrentNode(playerNode.id, 'player', '/home/player');
      sound.executeSound();
      addLine('info', `Desconectado de ${currentNode.hostname}. Regresando a localhost.`);

      // If there was an active trace for this host, disconnect cancels or alerts
      if (context.activeTrace && context.activeTrace.targetIp === currentNode.ip) {
        addLine('warning', `[!] Conexión cerrada. Verificando si quedaron firmas en los logs...`);
      }
      break;
    }

    // ==========================================
    // STATUS / STATS
    // ==========================================
    case 'status':
    case 'stats': {
      sound.executeSound();
      const p = context.player;
      addLine('info', `╔══════════════════════════════════════════════════════════════════════════════╗`);
      addLine('info', `║  OPERADOR: ${p.handle.padEnd(20, ' ')} NIVEL: ${p.level.toString().padEnd(5, ' ')} XP: ${p.xp}/${p.level * 500}           ║`);
      addLine('info', `║  SALDO: ${p.cryptoBalance.toString().padEnd(10, ' ')} CR (Cripto)                                           ║`);
      addLine('info', `╠══════════════════════════════════════════════════════════════════════════════╣`);
      addLine('text', `  [+] Ofensiva (Red Team):      ${p.attributes.offensive} pts (Mejora velocidad de exploits)`);
      addLine('text', `  [+] Evasión & Sigilo:         ${p.attributes.evasion} pts (Añade tiempo extra contra el IDS)`);
      addLine('text', `  [+] Ingeniería Social:        ${p.attributes.social} pts (Pistas de contraseñas)`);
      addLine('text', `  [+] Criptoanálisis:           ${p.attributes.crypto} pts (Cracking de claves)`);
      addLine('info', `╚══════════════════════════════════════════════════════════════════════════════╝`);
      break;
    }

    // ==========================================
    // HARDWARE
    // ==========================================
    case 'hardware': {
      sound.executeSound();
      const rig = context.player.rig;
      addLine('info', `=== ESPECIFICACIONES DE TU RIG LOCAL ===`);
      addLine('text', `  CPU: ${rig.cpuCores} Cores @ ${rig.cpuSpeedGhz} GHz`);
      addLine('text', `  RAM: ${rig.ramUsedMb} MB / ${rig.ramTotalMb} MB`);
      addLine('text', `  Almacenamiento: ${rig.storageGb} GB SSD NVMe Cifrado`);
      addLine('text', `  Nodos Proxy Encadenados: ${rig.proxies} hops (+${rig.proxies * 25}s margen IDS)`);
      addLine('info', `Escribe 'darknet' para adquirir mejoras de hardware.`);
      break;
    }

    // ==========================================
    // QUESTS / CONTRACTS
    // ==========================================
    case 'quests':
    case 'contracts': {
      sound.executeSound();
      context.onOpenModal('quests');
      addLine('info', `Mostrando terminal de contratos e inteligencia...`);
      break;
    }

    // ==========================================
    // DARKNET / SHOP
    // ==========================================
    case 'darknet':
    case 'shop': {
      sound.executeSound();
      context.onOpenModal('shop');
      addLine('info', `Conectando con el mercado negro de la Darknet...`);
      break;
    }

    // ==========================================
    // MAIL
    // ==========================================
    case 'mail': {
      sound.executeSound();
      const subAction = args[0]?.toLowerCase();
      const targetId = args[1]?.toLowerCase();

      if (!subAction) {
        addLine('info', '╔══════════════════════════════════════════════════════════════════════════════╗');
        addLine('info', '║                   BANDEJA DE ENTRADA CIFRADA :: CYBERMAIL                   ║');
        addLine('info', '╚══════════════════════════════════════════════════════════════════════════════╝');

        context.emails.forEach(msg => {
          const status = msg.isRead ? '      ' : '[NUEVO]';
          addLine('text', `${status}  ID: ${msg.id.padEnd(8, ' ')} | De: ${msg.from.padEnd(28, ' ')} | ${msg.subject}`);
        });

        addLine('info', '\nComandos disponibles:');
        addLine('text', '  mail read <id>       Lee el mensaje especificado (ej: mail read msg-01).');
        addLine('text', '  mail download <id>   Descarga el archivo adjunto en tu máquina local.');
        addLine('text', '  mail gui             Abre el cliente visual de correo.');
        break;
      }

      if (subAction === 'gui') {
        context.onOpenModal('mail');
        break;
      }

      if (subAction === 'read') {
        if (!targetId) {
          addLine('error', 'Uso: mail read <id_mensaje> (ej: mail read msg-01)');
          break;
        }

        const msg = context.emails.find(m => m.id.toLowerCase() === targetId);
        if (!msg) {
          sound.error();
          addLine('error', `mail: No existe ningún mensaje con ID '${targetId}'.`);
          break;
        }

        msg.isRead = true;
        context.onUpdateEmails([...context.emails]);

        addLine('info', '--------------------------------------------------------------------------------');
        addLine('text', `DE:      ${msg.from}`);
        addLine('text', `FECHA:   ${msg.date}`);
        addLine('text', `ASUNTO:  ${msg.subject}`);
        if (msg.attachment) {
          addLine('warning', `ADJUNTO: ${msg.attachment.name} [Usa 'mail download ${msg.id}' para guardar]`);
        }
        addLine('info', '--------------------------------------------------------------------------------');
        addLine('text', msg.body);
        addLine('info', '--------------------------------------------------------------------------------');
        break;
      }

      if (subAction === 'download') {
        if (!targetId) {
          addLine('error', 'Uso: mail download <id_mensaje>');
          break;
        }

        const msg = context.emails.find(m => m.id.toLowerCase() === targetId);
        if (!msg || !msg.attachment) {
          sound.error();
          addLine('error', `mail: El mensaje '${targetId}' no contiene ningún archivo adjunto descargable.`);
          break;
        }

        const playerNode = context.nodes.find(n => n.isPlayer);
        if (playerNode) {
          writeFileByPath(playerNode.fileSystem, msg.attachment.targetPath, msg.attachment.content, 'player');
          sound.success();
          addLine('success', `[+] Adjunto '${msg.attachment.name}' extraído correctamente en '${msg.attachment.targetPath}'.`);
        }
        break;
      }

      addLine('error', `Acción de correo desconocida: '${subAction}'. Usa 'mail read <id>' o 'mail download <id>'.`);
      break;
    }

    // ==========================================
    // SUDO (ESCALADA DE PRIVILEGIOS)
    // ==========================================
    case 'sudo': {
      if (context.currentUser === 'root') {
        addLine('info', 'Ya tienes privilegios de superusuario (root).');
        break;
      }

      if (args[0] === '-l') {
        sound.executeSound();
        addLine('text', `Matching Defaults entries for ${context.currentUser} on ${currentNode.hostname}:`);
        addLine('text', `    env_reset, mail_badpass, secure_path=/usr/local/sbin\\:/usr/local/bin\\:/usr/sbin\\:/usr/bin`);
        addLine('info', `\nUser ${context.currentUser} may run the following commands on ${currentNode.hostname}:`);

        if (currentNode.isPlayer) {
          addLine('success', '    (ALL : ALL) ALL');
        } else if (currentNode.sudoRules && currentNode.sudoRules.length > 0) {
          const userRules = currentNode.sudoRules.filter(r => r.user === context.currentUser);
          if (userRules.length > 0) {
            userRules.forEach(r => {
              addLine('success', `    (root) ${r.nopasswd ? 'NOPASSWD: ' : ''}${r.command}`);
            });
          } else {
            addLine('error', `    Sorry, user ${context.currentUser} may not run sudo on ${currentNode.hostname}.`);
          }
        } else {
          addLine('error', `    Sorry, user ${context.currentUser} may not run sudo on ${currentNode.hostname}.`);
        }
        break;
      }

      if (args[0] === 'su' || args[0] === 'bash' || args[0] === 'sh' || args[0] === '-s') {
        const canRoot = currentNode.isPlayer || (currentNode.sudoRules && currentNode.sudoRules.some(r => r.user === context.currentUser && (r.command === '/bin/sh' || r.command === '/bin/bash' || r.command === 'ALL')));

        if (canRoot) {
          sound.success();
          context.onUpdateCurrentNode(currentNode.id, 'root', '/');
          currentNode.rootAccess = true;
          context.onUpdateNodes([...context.nodes]);
          addLine('success', `[+] ¡ESCALADA DE PRIVILEGIOS EXITOSA! Ahora eres root@${currentNode.hostname}.`);
        } else {
          sound.error();
          addLine('error', `[sudo] contraseña para ${context.currentUser}:`);
          addLine('error', `sudo: ${context.currentUser} no está en el archivo de sudoers. Este incidente será reportado.`);
        }
        break;
      }

      if (args[0] === 'cat' && args[1]) {
        // Can run sudo cat if allowed
        const canCat = currentNode.isPlayer || (currentNode.sudoRules && currentNode.sudoRules.some(r => r.user === context.currentUser && r.command.includes('cat')));
        if (canCat) {
          const resolved = resolvePath(context.currentPath, args[1]);
          const file = getNodeByPath(currentNode.fileSystem, resolved);
          if (file && file.type === 'file') {
            sound.executeSound();
            addLine('text', file.content);
          } else {
            sound.error();
            addLine('error', `cat: ${args[1]}: No existe el archivo`);
          }
        } else {
          sound.error();
          addLine('error', `sudo: el usuario ${context.currentUser} no tiene permiso para ejecutar '${args[0]}' como root.`);
        }
        break;
      }

      addLine('error', "Uso: sudo -l | sudo su | sudo <comando>");
      break;
    }

    // ==========================================
    // JOHN THE RIPPER (HASH CRACKING)
    // ==========================================
    case 'john':
    case 'hashcat': {
      const targetFile = args[0];
      if (!targetFile) {
        addLine('error', 'Uso: john <archivo_con_hashes>');
        addLine('info', 'Ejemplo: john /etc/shadow');
        break;
      }

      const resolved = resolvePath(context.currentPath, targetFile);
      const fileNode = getNodeByPath(currentNode.fileSystem, resolved);

      if (!fileNode || fileNode.type !== 'file') {
        sound.error();
        addLine('error', `John: No se encuentra el archivo '${targetFile}'.`);
        break;
      }

      sound.executeSound();
      addLine('info', `John the Ripper 1.9.0-jumbo-1 (x86_64)`);
      addLine('text', `Loaded password hashes from ${targetFile} (SHA512 crypt [64/64])`);
      addLine('text', `Cracking hashes using ${context.player.rig.cpuCores} CPU threads with dictionary attack...`);

      const knownHashes: Record<string, string> = {
        rootsecret: 'root',
        hunter2: 'admin',
        shadow2026: 'root',
        'OmniSecret#2026!': 'vault_admin / root'
      };

      let crackedCount = 0;
      Object.entries(knownHashes).forEach(([pass, user]) => {
        if (fileNode.content.includes(pass) || fileNode.content.includes(pass.slice(0, 8))) {
          crackedCount++;
          addLine('success', `${pass.padEnd(20, ' ')} (${user})`);
        }
      });

      if (crackedCount > 0) {
        sound.success();
        addLine('success', `\n[+] ${crackedCount} password hash(es) cracked in 1.4 seconds.`);
        addLine('info', `¡Has ganado +150 XP por descifrado de credenciales!`);
        context.onUpdatePlayer(p => ({
          ...p,
          xp: p.xp + 150
        }));
      } else {
        addLine('error', `[-] 0 password hashes cracked with current wordlist.`);
      }
      break;
    }

    // ==========================================
    // RESET GAME
    // ==========================================
    case 'reset-game': {
      if (context.onResetGame) {
        sound.executeSound();
        context.onResetGame();
        addLine('success', '[!] Reiniciando sesión y restaurando estado de fábrica...');
      }
      break;
    }

    default: {
      sound.error();
      addLine('error', `hackhub: orden no encontrada: '${command}'. Escribe 'help' para ver la lista de comandos disponibles.`);
      break;
    }
  }

  return lines;
}
