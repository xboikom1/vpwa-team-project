import { hasAccount } from '@/services/mock-auth';
import type {
  Channel,
  ChannelBan,
  ChannelMember,
  ChannelVisibility,
  Invitation,
  JoinedChannel,
  KickResult,
  KickVote,
  Message,
  PendingInvitation,
} from '@/types/types';

const DAY_MS = 24 * 60 * 60 * 1000;
const INACTIVE_DAYS = 30;

export const KICK_VOTES_TO_BAN = 3;

interface ChannelDb {
  channels: Channel[];
  members: ChannelMember[];
  invitations: Invitation[];
  bans: ChannelBan[];
  kickVotes: KickVote[];
  messages: Message[];
}

interface SeedChannel {
  name: string;
  visibility: ChannelVisibility;
  admin: string;
  members: readonly string[];
  idleDays: number;
}

interface SeedMessage {
  channelName: string;
  author: string;
  text: string;
  minutesAgo: number;
}

const EVERYONE = [
  'johndoe',
  'alex',
  'ed',
  'maya',
  'priya',
  'tomas',
  'lucia',
  'kai',
  'rosa',
  'john',
  'marek',
  'sara',
  'viktor',
  'jana',
];

const SEED_CHANNELS: readonly SeedChannel[] = [
  { name: 'general', visibility: 'public', admin: 'alex', members: EVERYONE, idleDays: 0 },
  {
    name: 'engineering',
    visibility: 'public',
    admin: 'johndoe',
    members: ['johndoe', 'ed', 'marek', 'priya', 'tomas', 'kai'],
    idleDays: 0,
  },
  {
    name: 'design',
    visibility: 'public',
    admin: 'maya',
    members: ['maya', 'lucia', 'rosa', 'kai', 'johndoe'],
    idleDays: 2,
  },
  {
    name: 'random',
    visibility: 'public',
    admin: 'john',
    members: ['kai', 'ed', 'lucia', 'rosa', 'johndoe', 'john'],
    idleDays: 1,
  },
  {
    name: 'support',
    visibility: 'public',
    admin: 'priya',
    members: ['priya', 'rosa', 'jana'],
    idleDays: 5,
  },
  {
    name: 'admins',
    visibility: 'private',
    admin: 'alex',
    members: ['alex', 'maya', 'sara', 'johndoe', 'john'],
    idleDays: 1,
  },
  {
    name: 'sec-review',
    visibility: 'private',
    admin: 'johndoe',
    members: ['johndoe', 'viktor', 'sara'],
    idleDays: 3,
  },
  {
    name: 'q3-planning',
    visibility: 'private',
    admin: 'maya',
    members: ['maya', 'alex'],
    idleDays: 0,
  },
  {
    name: 'old-announcements',
    visibility: 'public',
    admin: 'ed',
    members: ['ed', 'alex', 'johndoe'],
    idleDays: 45,
  },
];

const SEED_MESSAGES: readonly SeedMessage[] = [
  {
    channelName: 'general',
    author: 'alex',
    text: 'Morning! Standup moves to 10:30 today.',
    minutesAgo: 95,
  },
  {
    channelName: 'general',
    author: 'maya',
    text: 'Thanks for the heads-up, @alex.',
    minutesAgo: 90,
  },
  {
    channelName: 'general',
    author: 'viktor',
    text: 'FREE crypto giveaway!!! DM me your wallet.',
    minutesAgo: 40,
  },
  {
    channelName: 'general',
    author: 'priya',
    text: '@johndoe can you check the deploy checklist before lunch?',
    minutesAgo: 25,
  },
  {
    channelName: 'engineering',
    author: 'ed',
    text: 'CI is green again after the cache fix.',
    minutesAgo: 30,
  },
  {
    channelName: 'engineering',
    author: 'marek',
    text: 'The migration PR is ready for review, @johndoe.',
    minutesAgo: 8,
  },
];

const SEED_KICK_VOTES: readonly KickVote[] = [
  { channelName: 'general', target: 'viktor', voter: 'kai' },
  { channelName: 'general', target: 'viktor', voter: 'rosa' },
];

const HISTORY_AUTHORS = ['alex', 'maya', 'ed', 'priya', 'kai', 'lucia'] as const;
const HISTORY_TEXTS = [
  'Sharing a quick update from today.',
  'I reviewed the latest changes and everything looks good.',
  'Can someone take a look when they have a moment?',
  'The next release candidate is ready for testing.',
  'I added the notes from our last discussion.',
  'Thanks, I will follow up on this tomorrow.',
] as const;

let lastMessageId = 0;

function ago(ms: number): string {
  return new Date(Date.now() - ms).toISOString();
}

function seedDb(): ChannelDb {
  const db: ChannelDb = {
    channels: [],
    members: [],
    invitations: [],
    bans: [],
    kickVotes: SEED_KICK_VOTES.map((vote) => ({ ...vote })),
    messages: [],
  };

  const createdAt = ago(60 * DAY_MS);

  for (const seed of SEED_CHANNELS) {
    db.channels.push({
      name: seed.name,
      visibility: seed.visibility,
      createdAt,
      lastActivityAt: ago(seed.idleDays * DAY_MS),
    });

    for (const nickName of seed.members) {
      db.members.push({
        channelName: seed.name,
        nickName,
        role: nickName === seed.admin ? 'admin' : 'member',
        joinedAt: createdAt,
      });
    }
  }

  db.invitations.push({
    channelName: 'q3-planning',
    nickName: 'johndoe',
    invitedBy: 'maya',
    createdAt: ago(4 * 60 * 1000),
  });

  db.invitations.push({
    channelName: 'sec-review',
    nickName: 'john',
    invitedBy: 'johndoe',
    createdAt: ago(2 * 60 * 60 * 1000),
  });

  for (let index = 0; index < 75; index += 1) {
    const author = HISTORY_AUTHORS[index % HISTORY_AUTHORS.length] ?? 'alex';
    const text = HISTORY_TEXTS[index % HISTORY_TEXTS.length] ?? 'General channel update.';
    const minutesAgo = (75 - index) * 10 + 100;

    lastMessageId += 1;
    db.messages.push({
      id: lastMessageId,
      channelName: 'general',
      author,
      text: `${text} (${index + 1})`,
      createdAt: ago(minutesAgo * 60 * 1000),
    });
  }

  for (const seed of SEED_MESSAGES) {
    lastMessageId += 1;
    db.messages.push({
      id: lastMessageId,
      channelName: seed.channelName,
      author: seed.author,
      text: seed.text,
      createdAt: ago(seed.minutesAgo * 60 * 1000),
    });
  }

  return db;
}

function deleteChannelData(db: ChannelDb, channelName: string): void {
  db.channels = db.channels.filter((channel) => channel.name !== channelName);
  db.members = db.members.filter((member) => member.channelName !== channelName);
  db.invitations = db.invitations.filter((invitation) => invitation.channelName !== channelName);
  db.bans = db.bans.filter((ban) => ban.channelName !== channelName);
  db.kickVotes = db.kickVotes.filter((vote) => vote.channelName !== channelName);
  db.messages = db.messages.filter((message) => message.channelName !== channelName);
}

function isInactive(channel: Channel): boolean {
  return Date.now() - Date.parse(channel.lastActivityAt) > INACTIVE_DAYS * DAY_MS;
}

const memoryDb = seedDb();

function loadDb(): ChannelDb {
  for (const channel of memoryDb.channels.filter(isInactive)) {
    deleteChannelData(memoryDb, channel.name);
  }

  return memoryDb;
}

function findChannel(db: ChannelDb, channelName: string): Channel | undefined {
  return db.channels.find((channel) => channel.name === channelName);
}

function findMember(
  db: ChannelDb,
  nickName: string,
  channelName: string,
): ChannelMember | undefined {
  return db.members.find(
    (member) => member.nickName === nickName && member.channelName === channelName,
  );
}

function findInvitation(
  db: ChannelDb,
  nickName: string,
  channelName: string,
): Invitation | undefined {
  return db.invitations.find(
    (invitation) => invitation.nickName === nickName && invitation.channelName === channelName,
  );
}

function removeInvitation(db: ChannelDb, nickName: string, channelName: string): void {
  db.invitations = db.invitations.filter(
    (invitation) => !(invitation.nickName === nickName && invitation.channelName === channelName),
  );
}

function isBanned(db: ChannelDb, nickName: string, channelName: string): boolean {
  return db.bans.some((ban) => ban.nickName === nickName && ban.channelName === channelName);
}

function banMember(db: ChannelDb, nickName: string, channelName: string): void {
  db.members = db.members.filter(
    (member) => !(member.nickName === nickName && member.channelName === channelName),
  );
  db.kickVotes = db.kickVotes.filter(
    (vote) => !(vote.target === nickName && vote.channelName === channelName),
  );
  removeInvitation(db, nickName, channelName);
  db.bans.push({ channelName, nickName });
}

export function listChannels(nickName: string): JoinedChannel[] {
  const db = loadDb();
  const joined: JoinedChannel[] = [];

  for (const channel of db.channels) {
    const member = findMember(db, nickName, channel.name);
    if (member !== undefined) joined.push({ ...channel, role: member.role });
  }

  return joined.sort((a, b) => a.name.localeCompare(b.name));
}

export function listInvitations(nickName: string): PendingInvitation[] {
  const db = loadDb();

  return db.invitations
    .filter((invitation) => invitation.nickName === nickName)
    .map((invitation) => {
      const channel = db.channels.find((item) => item.name === invitation.channelName);
      return { ...invitation, visibility: channel?.visibility ?? 'private' };
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function listMembers(nickName: string, channelName: string): ChannelMember[] {
  const db = loadDb();
  if (findMember(db, nickName, channelName) === undefined) return [];

  return db.members
    .filter((member) => member.channelName === channelName)
    .map((member) => ({ ...member }))
    .sort((a, b) => {
      if (a.role !== b.role) return a.role === 'admin' ? -1 : 1;
      return a.nickName.localeCompare(b.nickName);
    });
}

export function createChannel(
  nickName: string,
  channelName: string,
  visibility: ChannelVisibility,
): string | null {
  const db = loadDb();

  if (db.channels.some((channel) => channel.name === channelName)) {
    return `#${channelName} already exists. Pick another name.`;
  }

  const now = new Date().toISOString();
  db.channels.push({ name: channelName, visibility, createdAt: now, lastActivityAt: now });
  db.members.push({ channelName, nickName, role: 'admin', joinedAt: now });

  return null;
}

export function joinChannel(
  nickName: string,
  channelName: string,
  visibility: ChannelVisibility,
): string | null {
  const db = loadDb();
  const channel = findChannel(db, channelName);

  if (channel === undefined) return createChannel(nickName, channelName, visibility);
  if (findMember(db, nickName, channelName) !== undefined) return null;
  if (isBanned(db, nickName, channelName)) return `You are banned from #${channelName}.`;
  if (findInvitation(db, nickName, channelName) !== undefined) {
    return acceptInvitation(nickName, channelName);
  }
  if (channel.visibility === 'private') {
    return `#${channelName} is private. Ask its admin for an invite.`;
  }

  db.members.push({ channelName, nickName, role: 'member', joinedAt: new Date().toISOString() });
  return null;
}

export function deleteChannel(nickName: string, channelName: string): string | null {
  const db = loadDb();
  const member = findMember(db, nickName, channelName);

  if (member === undefined) return `You are not a member of #${channelName}.`;
  if (member.role !== 'admin') return `Only the admin can delete #${channelName}.`;

  deleteChannelData(db, channelName);
  return null;
}

export function leaveChannel(nickName: string, channelName: string): string | null {
  const db = loadDb();
  const member = findMember(db, nickName, channelName);

  if (member === undefined) return `You are not a member of #${channelName}.`;
  if (member.role === 'admin') return deleteChannel(nickName, channelName);

  db.members = db.members.filter((item) => item !== member);
  return null;
}

export function inviteMember(nickName: string, channelName: string, target: string): string | null {
  const db = loadDb();
  const channel = findChannel(db, channelName);
  const member = findMember(db, nickName, channelName);

  if (channel === undefined || member === undefined) {
    return `You are not a member of #${channelName}.`;
  }

  if (channel.visibility === 'private' && member.role !== 'admin') {
    return `Only the admin can invite people to private channels.`;
  }

  if (!hasAccount(target)) return `There is no user @${target}.`;

  if (findMember(db, target, channelName) !== undefined) {
    return `@${target} is already in the channel #${channelName}.`;
  }
  if (findInvitation(db, target, channelName) !== undefined) {
    return `@${target} is already invited to the channel #${channelName}.`;
  }

  if (isBanned(db, target, channelName)) {
    if (member.role !== 'admin') {
      return `@${target} is banned from #${channelName}. Only the admin can let them back in.`;
    }

    db.bans = db.bans.filter(
      (ban) => !(ban.nickName === target && ban.channelName === channelName),
    );
  }

  db.invitations.push({
    channelName,
    nickName: target,
    invitedBy: nickName,
    createdAt: new Date().toISOString(),
  });

  return null;
}

export function revokeMember(nickName: string, channelName: string, target: string): string | null {
  const db = loadDb();
  const channel = findChannel(db, channelName);
  const member = findMember(db, nickName, channelName);

  if (channel === undefined || member === undefined) {
    return `You are not a member of #${channelName}.`;
  }
  if (channel.visibility !== 'private') {
    return `/revoke only works in private channels. Use /kick in #${channelName}.`;
  }
  if (member.role !== 'admin') return `Only the admin can remove people from #${channelName}.`;
  if (target === nickName) return `You are the admin. Use /quit to close #${channelName}.`;

  const targetMember = findMember(db, target, channelName);
  if (targetMember === undefined && findInvitation(db, target, channelName) === undefined) {
    return `@${target} is not in #${channelName}.`;
  }

  db.members = db.members.filter((item) => item !== targetMember);
  removeInvitation(db, target, channelName);
  return null;
}

export function kickMember(nickName: string, channelName: string, target: string): KickResult {
  const db = loadDb();
  const channel = findChannel(db, channelName);
  const member = findMember(db, nickName, channelName);

  if (channel === undefined || member === undefined) {
    return { ok: false, error: `You are not a member of #${channelName}.` };
  }
  if (target === nickName) {
    return { ok: false, error: 'You cannot kick yourself. Use /cancel to leave.' };
  }

  const targetMember = findMember(db, target, channelName);
  if (targetMember === undefined) {
    return { ok: false, error: `@${target} is not in #${channelName}.` };
  }
  if (targetMember.role === 'admin') {
    return { ok: false, error: `@${target} is the admin of #${channelName} and cannot be kicked.` };
  }

  if (member.role === 'admin') {
    banMember(db, target, channelName);
    return { ok: true, votes: KICK_VOTES_TO_BAN, banned: true };
  }

  if (channel.visibility === 'private') {
    return { ok: false, error: `Only the admin can remove people from #${channelName}.` };
  }

  const votes = db.kickVotes.filter(
    (vote) => vote.channelName === channelName && vote.target === target,
  );

  if (votes.some((vote) => vote.voter === nickName)) {
    return {
      ok: false,
      error: `You already voted to kick @${target} (${votes.length}/${KICK_VOTES_TO_BAN}).`,
    };
  }

  db.kickVotes.push({ channelName, target, voter: nickName });

  const count = votes.length + 1;
  if (count >= KICK_VOTES_TO_BAN) banMember(db, target, channelName);

  return { ok: true, votes: count, banned: count >= KICK_VOTES_TO_BAN };
}

export function acceptInvitation(nickName: string, channelName: string): string | null {
  const db = loadDb();

  if (findInvitation(db, nickName, channelName) === undefined) {
    return `The invitation to #${channelName} is no longer valid.`;
  }

  removeInvitation(db, nickName, channelName);
  db.members.push({ channelName, nickName, role: 'member', joinedAt: new Date().toISOString() });

  return null;
}

export function declineInvitation(nickName: string, channelName: string): string | null {
  const db = loadDb();
  removeInvitation(db, nickName, channelName);

  return null;
}

export function listMessages(nickName: string, channelName: string): Message[] {
  const db = loadDb();
  if (findMember(db, nickName, channelName) === undefined) return [];

  return db.messages
    .filter((message) => message.channelName === channelName)
    .map((message) => ({ ...message }));
}

export function postMessage(nickName: string, channelName: string, text: string): string | null {
  const db = loadDb();

  if (findMember(db, nickName, channelName) === undefined) {
    return `Join #${channelName} before sending messages.`;
  }

  lastMessageId += 1;
  db.messages.push({
    id: lastMessageId,
    channelName,
    author: nickName,
    text,
    createdAt: new Date().toISOString(),
  });

  markActivity(channelName);
  return null;
}

export function markActivity(channelName: string): void {
  const db = loadDb();
  const channel = db.channels.find((item) => item.name === channelName);
  if (channel === undefined) return;

  channel.lastActivityAt = new Date().toISOString();
}
