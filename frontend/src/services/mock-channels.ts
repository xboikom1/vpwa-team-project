import type {
  Channel,
  ChannelMember,
  ChannelVisibility,
  Invitation,
  JoinedChannel,
  PendingInvitation,
} from '@/types/types';

const DAY_MS = 24 * 60 * 60 * 1000;
const INACTIVE_DAYS = 30;

interface ChannelDb {
  channels: Channel[];
  members: ChannelMember[];
  invitations: Invitation[];
}

interface SeedChannel {
  name: string;
  visibility: ChannelVisibility;
  admin: string;
  members: readonly string[];
  idleDays: number;
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

function ago(ms: number): string {
  return new Date(Date.now() - ms).toISOString();
}

function seedDb(): ChannelDb {
  const db: ChannelDb = { channels: [], members: [], invitations: [] };

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

  return db;
}

function deleteChannelData(db: ChannelDb, channelName: string): void {
  db.channels = db.channels.filter((channel) => channel.name !== channelName);
  db.members = db.members.filter((member) => member.channelName !== channelName);
  db.invitations = db.invitations.filter((invitation) => invitation.channelName !== channelName);
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

function findMember(
  db: ChannelDb,
  nickName: string,
  channelName: string,
): ChannelMember | undefined {
  return db.members.find(
    (member) => member.nickName === nickName && member.channelName === channelName,
  );
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

export function acceptInvitation(nickName: string, channelName: string): string | null {
  const db = loadDb();
  const invitation = db.invitations.find(
    (item) => item.nickName === nickName && item.channelName === channelName,
  );

  if (invitation === undefined) return `The invitation to #${channelName} is no longer valid.`;

  db.invitations = db.invitations.filter((item) => item !== invitation);
  db.members.push({ channelName, nickName, role: 'member', joinedAt: new Date().toISOString() });

  return null;
}

export function declineInvitation(nickName: string, channelName: string): string | null {
  const db = loadDb();

  db.invitations = db.invitations.filter(
    (item) => !(item.nickName === nickName && item.channelName === channelName),
  );

  return null;
}

export function markActivity(channelName: string): void {
  const db = loadDb();
  const channel = db.channels.find((item) => item.name === channelName);
  if (channel === undefined) return;

  channel.lastActivityAt = new Date().toISOString();
}
