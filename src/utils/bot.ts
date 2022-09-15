import 'reflect-metadata';

// import config from '../config.json'

import { IntentsBitField, Partials } from 'discord.js';
import { Client } from 'discordx';

export default new Client({
  botGuilds: [(client) => client.guilds.cache.map((guild) => guild.id)],

  // Discord intents
  intents: [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMembers,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.MessageContent,
    IntentsBitField.Flags.GuildMessageReactions,
    IntentsBitField.Flags.GuildVoiceStates,
    IntentsBitField.Flags.GuildMessageTyping,
    IntentsBitField.Flags.DirectMessageTyping,
    IntentsBitField.Flags.GuildPresences
  ],

  partials: [ Partials.Channel, Partials.GuildMember, Partials.Message, Partials.Reaction ],
  // Debug logs are disabled in silent mode
  silent: false,

  // Configuration for @SimpleCommand
  simpleCommand: {
    prefix: '>'// config.prefix,
  },
})