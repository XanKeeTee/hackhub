import { EmailMessage, NetworkNode, Quest, ShopItem } from '../types';
import { createDirectory, createFile } from './virtualFileSystem';

export function createInitialWorld(): NetworkNode[] {
  // 1. LOCALHOST (Player Rig)
  const playerFS = createDirectory('');
  playerFS.children['bin'] = createDirectory('bin');
  playerFS.children['etc'] = createDirectory('etc');
  playerFS.children['home'] = createDirectory('home');

  const playerHome = createDirectory('player', 'player');
  playerHome.children['notes.txt'] = createFile(
    'notes.txt',
    `# === HACKHUB OPERATOR NOTES ===
* Para escanear un objetivo: nmap <ip> o nmap -sV <ip>
* Para consultar vulnerabilidades: searchsploit <servicio> <version>
* Para lanzar un exploit: exploit -t <ip> -v <vuln_id>
* Para fuerza bruta SSH: hydra -l <user> -P /home/player/wordlists/passwords.txt <ip> ssh
* SIEMPRE borra los logs (/var/log/...) antes de desconectarte si el objetivo tiene IDS.
* Comandos del sistema: quests, status, hardware, darknet.
`,
    'player'
  );

  const wordlistsDir = createDirectory('wordlists', 'player');
  wordlistsDir.children['passwords.txt'] = createFile(
    'passwords.txt',
    `123456\npassword\nadmin123\nqwerty\nletmein\nwelcome\nhunter2\nroot2026\nshadow`,
    'player'
  );
  playerHome.children['wordlists'] = wordlistsDir;

  playerFS.children['home'].children['player'] = playerHome;

  const playerNode: NetworkNode = {
    id: 'player-rig',
    ip: '127.0.0.1',
    hostname: 'kali-rig',
    organization: 'Operador Local',
    isPlayer: true,
    discovered: true,
    compromised: true,
    rootAccess: true,
    securityLevel: 0,
    ports: [],
    fileSystem: playerFS,
    hasIDS: false,
    traceSpeedSeconds: 0,
    coords: { x: 120, y: 150 }
  };

  // 2. TARGET 1: RELAY GATEWAY (Nivel 1)
  const relayFS = createDirectory('');
  relayFS.children['etc'] = createDirectory('etc');
  relayFS.children['etc'].children['shadow'] = createFile(
    'shadow',
    `root:$6$nexus$rootsecret:19000:0:99999:7:::\nadmin:$6$salt$hunter2:19000:0:99999:7:::\n`,
    'root',
    'r--------'
  );
  relayFS.children['home'] = createDirectory('home');
  relayFS.children['var'] = createDirectory('var');
  relayFS.children['var'].children['log'] = createDirectory('log');
  relayFS.children['var'].children['log'].children['auth.log'] = createFile(
    'auth.log',
    `[SYSTEM BOOT] Kernel 5.4.0-relay\n[AUTH] Accepted publickey for backup_daemon from 10.0.0.1\n`
  );

  const adminHome = createDirectory('admin', 'admin');
  adminHome.children['todo.txt'] = createFile(
    'todo.txt',
    `RECORDATORIO INTERNO:
- Recordar al equipo de Helios Corp que su servidor web en 192.168.1.45 sigue corriendo una versión antigua de FTP.
- La IP del servidor de bases de datos de OmniBank es 192.168.1.200.
- Cambiar la contraseña del usuario admin pronto, ahora mismo es 'admin123'.`,
    'admin'
  );
  relayFS.children['home'].children['admin'] = adminHome;

  const relayNode: NetworkNode = {
    id: 'node-relay-1',
    ip: '192.168.1.10',
    hostname: 'nexus-relay.net',
    organization: 'Nexus Telcom',
    isPlayer: false,
    discovered: true,
    compromised: false,
    rootAccess: false,
    securityLevel: 1,
    ports: [
      {
        port: 22,
        service: 'ssh',
        version: 'OpenSSH 7.2p2',
        isOpen: true,
        requiresAuth: true,
        validCredentials: [{ user: 'admin', pass: 'admin123' }]
      }
    ],
    fileSystem: relayFS,
    hasIDS: false,
    traceSpeedSeconds: 120,
    coords: { x: 300, y: 100 },
    sudoRules: [
      { user: 'admin', command: '/bin/cat', nopasswd: true },
      { user: 'admin', command: '/bin/sh', nopasswd: false }
    ]
  };

  // 3. TARGET 2: HELIOS CORP WEB & FTP (Nivel 2)
  const heliosFS = createDirectory('');
  heliosFS.children['etc'] = createDirectory('etc');
  heliosFS.children['var'] = createDirectory('var');
  heliosFS.children['var'].children['www'] = createDirectory('www');
  heliosFS.children['var'].children['www'].children['config.php'] = createFile(
    'config.php',
    `<?php
// Configuración de base de datos corporativa
define('DB_HOST', '192.168.1.200');
define('DB_USER', 'vault_admin');
define('DB_PASS', 'OmniSecret#2026!');
define('DB_NAME', 'omnibank_ledger');
?>`
  );
  heliosFS.children['var'].children['log'] = createDirectory('log');
  heliosFS.children['var'].children['log'].children['vsftpd.log'] = createFile(
    'vsftpd.log',
    `[LOG] Sun Oct 14 09:21:10 2026 vsftpd 2.3.4 service started.\n[LOG] Mon Oct 15 11:00:23 2026 Connection from 192.168.1.10\n`
  );

  const heliosNode: NetworkNode = {
    id: 'node-helios',
    ip: '192.168.1.45',
    hostname: 'helios-corp.web',
    organization: 'Helios Corporation',
    isPlayer: false,
    discovered: false,
    compromised: false,
    rootAccess: false,
    securityLevel: 2,
    ports: [
      {
        port: 21,
        service: 'ftp',
        version: 'vsftpd 2.3.4',
        isOpen: true,
        requiresAuth: false,
        vulnerabilityId: 'vsftpd-234-backdoor',
        vulnDescription: 'vsftpd 2.3.4 Backdoor Command Execution (Trigger :) smile)'
      },
      {
        port: 80,
        service: 'http',
        version: 'Apache 2.4.49',
        isOpen: true,
        requiresAuth: false
      }
    ],
    fileSystem: heliosFS,
    hasIDS: true,
    traceSpeedSeconds: 80,
    coords: { x: 480, y: 220 }
  };

  // 4. TARGET 3: OMNIBANK VAULT (Nivel 4)
  const bankFS = createDirectory('');
  bankFS.children['etc'] = createDirectory('etc');
  bankFS.children['secure'] = createDirectory('secure');
  bankFS.children['secure'].children['crypto_wallets.json'] = createFile(
    'crypto_wallets.json',
    `{
  "vault_cold_storage": "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
  "balance_btc": 240.55,
  "balance_eth": 4890.12,
  "emergency_key": "SEC-KEY-9988-XALPHA-OMEGA"
}`
  );
  bankFS.children['var'] = createDirectory('var');
  bankFS.children['var'].children['log'] = createDirectory('log');
  bankFS.children['var'].children['log'].children['auth.log'] = createFile(
    'auth.log',
    `[AUDIT] High Security Sector Active.\n[IDS] Deep Packet Inspection enabled.\n`
  );

  const bankNode: NetworkNode = {
    id: 'node-bank',
    ip: '192.168.1.200',
    hostname: 'vault.omnibank.net',
    organization: 'OmniBank Financial Services',
    isPlayer: false,
    discovered: false,
    compromised: false,
    rootAccess: false,
    securityLevel: 4,
    ports: [
      {
        port: 22,
        service: 'ssh',
        version: 'OpenSSH 8.9',
        isOpen: true,
        requiresAuth: true,
        validCredentials: [{ user: 'vault_admin', pass: 'OmniSecret#2026!' }]
      },
      {
        port: 3306,
        service: 'mysql',
        version: 'MySQL 5.7.35',
        isOpen: true,
        requiresAuth: true
      }
    ],
    fileSystem: bankFS,
    hasIDS: true,
    traceSpeedSeconds: 45,
    coords: { x: 650, y: 150 }
  };

  return [playerNode, relayNode, heliosNode, bankNode];
}

export const INITIAL_QUESTS: Quest[] = [
  {
    id: 'q1',
    title: 'Operación: Puerta Trasera en Nexus',
    faction: 'CypherSec',
    difficulty: 'Fácil',
    rewardXp: 150,
    rewardCrypto: 500,
    description: 'Comprueba la seguridad del nodo de retransmisión 192.168.1.10. Escanea los puertos abiertos con nmap, encuentra credenciales y descarga el archivo todo.txt de la cuenta admin.',
    targetIp: '192.168.1.10',
    targetFile: '/home/admin/todo.txt',
    actionRequired: 'exfiltrate',
    isCompleted: false,
    isActive: true,
    hint: 'Usa "nmap 192.168.1.10", luego fuerza bruta con "hydra -l admin -P /home/player/wordlists/passwords.txt 192.168.1.10 ssh" y conéctate con "ssh admin@192.168.1.10".'
  },
  {
    id: 'q2',
    title: 'Sabotaje Silencioso en Helios Corp',
    faction: 'GhostProtocol',
    difficulty: 'Media',
    rewardXp: 350,
    rewardCrypto: 1200,
    description: 'Helios Corp está usando software obsoleto. Escanea 192.168.1.45, encuentra el exploit para vsftpd 2.3.4, obtén acceso root, lee config.php y BORRA el archivo /var/log/vsftpd.log antes de que termine el rastreo IDS.',
    targetIp: '192.168.1.45',
    targetFile: '/var/www/config.php',
    actionRequired: 'delete_logs',
    isCompleted: false,
    isActive: false,
    hint: 'Usa "nmap -sV 192.168.1.45", luego "searchsploit vsftpd 2.3.4" y finalmente "exploit -t 192.168.1.45 -v vsftpd-234-backdoor". Recuerda: "rm /var/log/vsftpd.log" para limpiar tu rastro!'
  },
  {
    id: 'q3',
    title: 'El Gran Golpe a OmniBank',
    faction: 'OnyxSyndicate',
    difficulty: 'Extrema',
    rewardXp: 800,
    rewardCrypto: 5000,
    description: 'Accede al servidor ultra-protegido de OmniBank en 192.168.1.200 usando las claves encontradas en Helios Corp. Exfiltra el archivo /secure/crypto_wallets.json y desconéctate antes de que el IDS militar te rastree.',
    targetIp: '192.168.1.200',
    targetFile: '/secure/crypto_wallets.json',
    actionRequired: 'exfiltrate',
    isCompleted: false,
    isActive: false,
    hint: 'Usa "ssh vault_admin@192.168.1.200" con la contraseña de config.php. ¡Cuidado con el temporizador IDS!'
  }
];

export const INITIAL_SHOP_ITEMS: ShopItem[] = [
  {
    id: 'cpu_upgrade_1',
    name: 'Procesador Hexa-Core BlackOnyx',
    type: 'hardware',
    cost: 400,
    description: 'Aumenta la velocidad de ejecución de Hydra y exploits en un 50%.',
    purchased: false,
    statsEffect: { cpu: 2 }
  },
  {
    id: 'ram_upgrade_1',
    name: 'Módulo 8GB ECC CyberRAM',
    type: 'hardware',
    cost: 350,
    description: 'Permite ejecutar múltiples herramientas concurrentemente sin penalización de velocidad.',
    purchased: false,
    statsEffect: { ram: 4096 }
  },
  {
    id: 'proxy_node_1',
    name: 'Proxy Encadenado en Reikiavik',
    type: 'proxy',
    cost: 600,
    description: 'Añade un salto cifrado a tus ataques, sumando +25 segundos a la tolerancia del IDS antes del rastreo.',
    purchased: false,
    statsEffect: { proxies: 1 }
  },
  {
    id: 'proxy_node_2',
    name: 'Red Fantasma Tor BGP',
    type: 'proxy',
    cost: 1500,
    description: 'Añade 2 saltos anónimos extra, sumando +40 segundos al temporizador de rastreo.',
    purchased: false,
    statsEffect: { proxies: 2 }
  }
];

export const INITIAL_EMAILS: EmailMessage[] = [
  {
    id: 'msg-01',
    from: 'Viper <viper@cyphersec.org>',
    subject: 'Bienvenido al Colectivo :: Primera Asignación',
    date: '2026-10-16 01:10',
    body: `Operador Zer0Byte,

Hemos verificado tu firma en la red. Tus habilidades nos serán útiles.
Para empezar, tenemos sospechas de una brecha en nuestro nodo de retransmisión (192.168.1.10).
El administrador original utilizaba contraseñas débiles. Te he adjuntado una lista de claves filtradas recientemente para que la cargues en tu directorio local.

Usa nmap y hydra para verificar el acceso y encuentra el archivo todo.txt.

Buena caza.
-- Viper`,
    isRead: false,
    attachment: {
      name: 'leak_passwords.txt',
      targetPath: '/home/player/wordlists/leak_passwords.txt',
      content: 'hunter2\nadmin123\nroot2026\nshadow\nOmniSecret#2026!\n'
    }
  },
  {
    id: 'msg-02',
    from: 'K@0s <kaos@ghostprotocol.net>',
    subject: 'URGENTE: Advertencia sobre el IDS de Helios Corp',
    date: '2026-10-16 01:25',
    body: `Ey colega,

Vimos que estás escaneando la subred 192.168.1.45 (Helios Corporation). Ten MUCHO cuidado.
Tienen un Sistema de Detección de Intrusos (IDS) con enlace directo a la policía cibernética.
Si lanzas un exploit o escaneo ruidoso, el temporizador empezará a correr hacia atrás.

Para salvar el pellejo: una vez dentro, localiza '/var/log/vsftpd.log' y bórralo con 'rm'. Eso cortará la triangulación al instante.

No digas que no te avisé.
-- K@0s`,
    isRead: false
  },
  {
    id: 'msg-03',
    from: 'The_Broker <broker@darknet.onion>',
    subject: 'Recompensa de 5000 CR :: Bóveda OmniBank',
    date: '2026-10-16 01:40',
    body: `Saludos, fantasma.

Si logras infiltrarte en el servidor de base de datos de OmniBank en 192.168.1.200 y extraes las claves de almacenamiento en frío (/secure/crypto_wallets.json), tengo un cliente dispuesto a pagar 5.000 créditos en mano.

Consejo: Si obtienes acceso al archivo /etc/shadow del sistema, usa la herramienta 'john /etc/shadow' para descifrar los hashes de contraseñas de las cuentas de altos ejecutivos.

Mantente invisible.
-- The Broker`,
    isRead: false
  }
];

