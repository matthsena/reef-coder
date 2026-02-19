export interface Command {
  name: string;
  aliases: string[];
  description: string;
}

export const COMMANDS: Command[] = [
  {
    name: '/switch',
    aliases: ['/engine'],
    description: 'Switch to another engine/model',
  },
  {
    name: '/exit',
    aliases: ['/quit'],
    description: 'Exit the application',
  },
  {
    name: '/clear',
    aliases: [],
    description: 'Clear session history',
  },
  {
    name: '/help',
    aliases: [],
    description: 'Show available commands',
  },
  {
    name: '/model',
    aliases: [],
    description: 'Change current session model (e.g., /model <id>)',
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
