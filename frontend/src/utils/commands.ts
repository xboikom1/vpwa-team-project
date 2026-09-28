import type { CommandInput } from '@/types/types';
import { validateChannelName } from '@/utils/validation';

const USAGE = {
  join: '/join <channelName> [private]',
  invite: '/invite <nickName>',
  revoke: '/revoke <nickName>',
  kick: '/kick <nickName>',
  quit: '/quit',
  cancel: '/cancel',
  list: '/list',
} as const;

type CommandName = keyof typeof USAGE;

const COMMANDS: readonly string[] = Object.keys(USAGE);

function isCommandName(value: string): value is CommandName {
  return COMMANDS.includes(value);
}

function usage(name: CommandName): CommandInput {
  return { kind: 'error', message: `Usage: ${USAGE[name]}` };
}

export function parseInput(raw: string): CommandInput {
  const text = raw.trim();
  if (!text.startsWith('/')) return { kind: 'message', text };

  const [command = '', ...args] = text.slice(1).split(/\s+/);
  const name = command.toLowerCase();

  if (!isCommandName(name)) {
    const known = COMMANDS.map((item) => `/${item}`).join(', ');
    return { kind: 'error', message: `Unknown command /${command}. Try ${known}.` };
  }

  switch (name) {
    case 'join': {
      const [channelName = '', flag] = args;
      if (args.length === 0 || args.length > 2) return usage(name);
      if (flag !== undefined && flag.toLowerCase() !== 'private') return usage(name);

      const normalized = channelName.replace(/^#/, '').toLowerCase();
      const error = validateChannelName(normalized);
      if (error !== null) return { kind: 'error', message: error };

      return {
        kind: 'join',
        channelName: normalized,
        visibility: flag === undefined ? 'public' : 'private',
      };
    }

    case 'invite':
    case 'revoke':
    case 'kick': {
      const nickName = (args[0] ?? '').replace(/^@/, '');
      if (args.length !== 1 || nickName === '') return usage(name);

      return { kind: name, nickName };
    }

    case 'quit':
    case 'cancel':
    case 'list':
      return args.length === 0 ? { kind: name } : usage(name);
  }
}
