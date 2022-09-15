import { Role as DsRole } from 'discord.js';
import { Client } from 'discordx'
import { Image } from 'ytsr'
import { Db, MongoClient, ObjectId } from "mongodb";
import { Commands } from '@/commands';
import { AudioPlayer } from '@discordjs/voice';

export type VideoItem = {
  duration?: any;
  shortUrl: string
  id?: string
  title?: string
  author?: {
    name: string
    channelID: string
    url: string
  }
  bestThumbnail?: Image
  source: 'spotify' | 'youtube'
}

export type Song = {
  source: 'youtube' | 'spotify'
  stream?: any;
  videoId: string | null
  title: string | null
  url: string
  duration?: any
  preview?: {
    url: string | null
    width?: number
    heigth?: number
  }
  fpreview?: {
    url: string | null
    width?: number
    height?: number
  }
  author?: {
    name: string
    channelID: string
    url: string
  }
}

export type Queue = {
  resource?: any;
  player: AudioPlayer | null
  textChannel: any // TextChannel
  voiceChannel: any // VoiceChannel
  connection: any // VoiceConnection
  songs: Song[]
  volume: number
  playing: boolean
  currentSong: Song | null
};


export type User = {
  _id?: any;
  id: string
  name: string | null
  nickname: string | null
  _roles?: string[]
  roles?: Role[]
  status?: string | null
  joinedTimestamp: number | null
}

export type DsUser = {
  _id?: ObjectId
  id: string
  avatar: string | null
  discriminator: string
  email: string
  flags: number
  locale: string
  mfa_enabled: boolean
  public_flags: number
  token: string | null
  username: string
  verified: boolean
  accessToken: string | null
  tokenType: string | null
  banner: string | null
  banner_color: string | number | null
  premium_type: number | null
  accent_color: number | null
  avatar_decoration: any | null
}

export type Action = {
  id: string
  type: 'AddRole' | 'RemoveRole' | 'Ban' | 'Kick' | 'Warn' | 'Rename' | 'React' | 'Message' | 'Edit' | 'SoftBan' | 'DirectMessage'
  target: string
  condition: string
  role: DsRole
  emoji: string
  message?: string
}

export type Callback = {
  _id: ObjectId
  id: string
  action: Action
  trigger: 'OnReact' | 'OnUnreact' | 'OnMessage' | 'OnJoin' | 'OnLeave' | 'OnJoinChannel' | 'OnLeaveChannel' | 'OnGetBanned' | 'OnGetKicked'
  guild: string
  channel: {
    id: string
    type: string
    parentId?: string
    guild: string
    name: string
  }
  messageId: string
}

export const UserSchema = {
  name: 'User',
  properties: {
    _id: 'objectId',
    _partition: 'string?',
    name: 'string',
    nickname: 'string',
    status: 'string',
    roles: 'string?',
  }
}

export const ActionSchema = {
  name: 'Action',
  properties: {
    _id: 'objectId',
    _partition: 'string?',
    id: 'string',
    type: 'string',
    target: 'string',
    condition: 'string',
    role: 'string',
    emoji: 'string',
  }
}

export const NewsSchema = {
  name: 'News',
  properties: {
    _id: 'objectId',
    _partition: 'string?',
    id: 'string',
    channelId: 'string',
    timespamp: 'string',
    content: 'string',
    emojis: 'string',
  }
}

export type News = {
  id: string
  channelId: string
  timespamp: string
  content: string
  emojis: string
}

export type Guild = {
  id: string
  users: User[]
  channels: string[]
}

export type Role = {
  id: string
  name: string
}

export interface ICommand {
  init(bot: Client, db: Db): void;
  execute(msg: any /* Message */ ): void;
  shortDescription(): string;
  detailedDescription(): string;
}

export const Schemas = [
  UserSchema
];

export type CallbackProps = {
  db: Db
  method?: string,
  user?: DsUser
  accessToken?: string
  tokenType?: string
  callback?: any
  guild?: Guild
  id?: string
  bot?: Client
  guildId?: string
  code?: string | string[]
  commands?: Commands
  userId?: string
  incomeUser?: any
  token?: string
  pos?: number
  greets?: any
  prefix?: string
  setuser?: User
}

interface ServerToClientEvents {
  noArg: () => void;
  basicEmit: (a: number, b: string, c: Buffer) => void;
  withAck: (d: string, callback: (e: number) => void) => void;
}

interface ClientToServerEvents {
  hello: () => void;
}

interface InterServerEvents {
  ping: () => void;
}

interface SocketData {
  name: string;
  age: number;
}