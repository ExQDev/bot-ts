import type { Client, Guild, Message, TextChannel } from 'discord.js';
import { Db, MongoClient } from 'mongodb';
import { ICommand } from '@/types';
// import config from '../config.json';
import commands from '../commands';

class Help implements ICommand { 
  bot: Client | null = null;
  db: Db | null = null;
  channel: TextChannel | null = null;

  init = (bot: Client, db: Db) => {
    if(!this.bot) this.bot = bot;
    if(!this.db) this.db = db;
  }

  execute = (msg: Message) => {
    return async (args: string[]) => {
      const error = (...msg: string[]) => console.error('[Help].[execute]', ...msg)
      const log = (...msg: string[]) => console.log('[Help].[execute]', ...msg)

      this.channel = msg.channel as TextChannel;
      if (!msg.guild) {
        log('Not a guild message')
        return
      }
      if (!this.db) {
        error('Database not set')
        return
      }
      const helpcmd = args.shift();
      const guild = (await this.db.collection('guilds').findOne({
        id: msg.guild.id
      }))
      if (!guild) {
        error('Not registered guild')
        return
      }
      const guildPrefix = guild.prefix
      if(!helpcmd){

        return this.channel.send({
          content: `No command entered, ${msg.member}.\nMy prefix is \`${guildPrefix || '>'}\`.\nYou can use \`${guildPrefix || '>'}help music\` e.g. to get description and detailed help for each command.`,
          embeds: [{
            color: 3447003,
            fields: [
              /* @ts-ignore */
              ...Object.keys(commands).map(cmd => ({name: cmd, value: commands[cmd].shortDescription()}))
            ],
          }]
        })
      }
      return this.channel.send({ 
        content: `Detailed help, ${msg.member}`,
        embeds: [{
          title: helpcmd,
          color: 3447003,
          /* @ts-ignore */
          description: `${commands[helpcmd.toLowerCase()].detailedDescription()}`,
        }]
      });
    }
  }
  
  shortDescription = (): string => {
    return 'Help provider';
  }

  detailedDescription = (): string => {
    return 'Can provide detailed help for each command that was documented.\nJust use `\>help {command}\` to display detailed info.';
  }
}


export default Help;
