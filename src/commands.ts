export interface Command {
  name: string;
  aliases: string[];
  description: string;
}

export const COMMANDS: Command[] = [
  {
    name: '/switch',
    aliases: ['/engine'],
    description: 'Trocar para outro engine/modelo',
  },
  {
    name: '/exit',
    aliases: ['/quit'],
    description: 'Sair do aplicativo',
  },
  {
    name: '/clear',
    aliases: [],
    description: 'Limpar histórico da sessão',
  },
  {
    name: '/help',
    aliases: [],
    description: 'Mostrar comandos disponíveis',
  },
  {
    name: '/model',
    aliases: [],
    description: 'Alterar modelo da sessão atual (ex: /model <id>)',
  },
];

export function getMatchingCommands(input: string): Command[] {
  if (!input.startsWith('/')) return [];
  
  const search = input.toLowerCase();
  
  return COMMANDS.filter((cmd) => {
    if (cmd.name.toLowerCase().startsWith(search)) return true;
    return cmd.aliases.some((alias) => alias.toLowerCase().startsWith(search));
  });
}

export function isValidCommand(input: string): Command | null {
  const search = input.toLowerCase();
  
  for (const cmd of COMMANDS) {
    if (cmd.name.toLowerCase() === search) return cmd;
    if (cmd.aliases.some((alias) => alias.toLowerCase() === search)) return cmd;
  }
  
  return null;
}
