// @flow
import type { ActivityType, Client, Guild, GuildMember, Message, MessageReaction, PartialMessageReaction, PartialUser, Role, TextChannel, User } from 'discord.js';
import Discord from 'discord.js';
import { ICommand, Callback, Action, User as LatteUser } from '../types';
// import config from '../config.json';
import diff from '../utils/diff';
import { Db, MongoClient } from 'mongodb';
import { forEach } from 'lodash';
import renderString from '../utils/stringParser';
import { EmbedBuilder } from '@discordjs/builders';

const ADMIN_PERMS = 2147483647;

type ManageGuild = {
  guild: Guild,
  currentChannel: TextChannel,
};

class Admin implements ICommand { 
  bot : Client | null = null;
  db: Db | null = null;
  guilds : Map<string, ManageGuild> = new Map<string, ManageGuild>();

  init = (bot: Client, db: Db) => {
    if(!this.bot) this.bot = bot;
    if(!this.db) this.db = db;
  }

  getIsAllowed = async (msg: Message) => {
    const error = (...msg: string[]) => console.error('[Admin].[getIsAllowed]', ...msg)
    const log = (...msg: string[]) => console.log('[Admin].[getIsAllowed]', ...msg)

    if (!msg.guild || !msg.member) {
      log('Not a guild message')
      return null
    }
    if (!this.db) {
      error('Database not set')
      return null
    }
    const currentGuild = this.guilds.get(msg.guild.id);

    const cGuild = (await this.db.collection('guilds').findOne({
      id: msg.guild.id
    }))

    if(!cGuild) {
      error('Not registered guild')
      return
    }
    const perms = cGuild.users.find((u: LatteUser) => u.id === msg.member?.id).rights

    return perms
  }

  execute = (msg: Message) => {
    return async (args: string[]) => {
      const error = (...msg: string[]) => console.error('[Admin].[execute]', ...msg)
      const log = (...msg: string[]) => console.log('[Admin].[execute]', ...msg)

      if (!msg.guild || !msg.member) {
        log('Not a guild message')
        return null
      }
      if (!this.db) {
        error('Database not set')
        return null
      }

      if(!this.guilds.has(msg.guild.id))
        this.guilds.set(msg.guild.id, {
          guild: msg.guild,
          currentChannel: msg.channel as TextChannel,
        });

      const perms = await this.getIsAllowed(msg)
      const currentGuild = msg.guild
      // console.log(msg.member.permissions)
      // if(msg.guild.ownerID !== msg.member.id) {
      if(perms !== 'Admin' && perms !== 'Moder' && !msg.member.permissions.has('Administrator')) {
        msg.channel.send({ content: 'You had not permission to use this command. Please, contact to guild owner.' });
        return;
      }

      if(args.length === 0)
      {
        msg.channel.send({ content: 'No commands entered. Please, get help for this provider to get more info for available commands.' });
        return;
      }

      const admcmd = args.shift();
      switch(admcmd) {
        case 'kick':
            {
              if (!msg.mentions.members){
                log('No members mentioned')
                msg.channel.send({ content: `No members mentioned` })
                break
              }
              msg.mentions.members.forEach(async member => {
                await this.kick(member, `(latte) executor: ${msg.member?.displayName}`)
                msg.channel.send({ content: `${member} have been kicked` })
              })
            }
          break;
        case 'ban':
          {
            if (!msg.mentions.members){
              log('No members mentioned')
              msg.channel.send({ content: `No members mentioned` })
              break
            }
            msg.mentions.members.forEach(async member => {
              await this.ban(member, `(latte) executor: ${msg.member?.displayName}`)
              msg.channel.send({ content: `${member} have been banned` })
            })
          }
          break;
        // case 'shutdown':
        //   currentGuild.currentChannel.send('Ok. Bot is shutting down.');
        //   setTimeout(this.shutdown, 1000);
        //   // this.shutdown();
        //   break;
        default:
          msg.channel.send({ content: 'Unrecognized command. Check if it is right and try again.' })
          break;
      }

      // TODO: other stuff
    }
  }

  onJoin = async (member: GuildMember) => {
    const error = (...msg: string[]) => console.error('[Admin].[onJoin]', ...msg)
    const log = (...msg: string[]) => console.log('[Admin].[onJoin]', ...msg)

    if (!this.db) {
      error('Database not set')
      return null
    }


    const welcomeEmbed = new EmbedBuilder()
  
    welcomeEmbed.setColor(0x5cf000)
    welcomeEmbed.setTitle('**' + member.user.username + '** is now Among Us other **' + member.guild.memberCount + '** people')
    welcomeEmbed.setImage('https://cdn.mos.cms.futurecdn.net/93GAa4wm3z4HbenzLbxWeQ-650-80.jpg.webp')
  
    try {
      const cGuild = (await this.db.collection('guilds').findOne({
        id: member.guild.id
      }))
      if (!cGuild) {
        error('Not registered guild')
        return
      }
      if (cGuild.greet) {
        if(cGuild.greetChannel) {
          const greetChannel = member.guild.channels.cache.find(i => i.id === cGuild.greetChannel.id) as TextChannel
          greetChannel?.send({ embeds: [welcomeEmbed]})
        }else{
          console.log('No greet channel')
        }
      }
      if (cGuild.restoreRoles) {
        // for (const rol of )
        // member.addRole()
      }
    } catch (ex) {
      console.log(ex)
    }
  }

  onLeft = async (member: GuildMember) => {
    const error = (...msg: string[]) => console.error('[Admin].[onJoin]', ...msg)
    const log = (...msg: string[]) => console.log('[Admin].[onJoin]', ...msg)

    if (!this.db) {
      error('Database not set')
      return null
    }

    const goodbyeEmbed = new EmbedBuilder()

    const sembed = {
      color: 0xf00000,
      title: renderString(`**{{user}}** was not the impostor there are **{{members}}** left Among Us`, {
        user: member.user.username,
        members: member.guild.memberCount.toString()
      }),
      image: `https://gamewith-en.akamaized.net/article/thumbnail/rectangle/22183.png`
    }
    goodbyeEmbed.setColor(sembed.color)
    goodbyeEmbed.setTitle(sembed.title)
    goodbyeEmbed.setImage(sembed.image)
  
    try {
      const cGuild = (await this.db.collection('guilds').findOne({
        id: member.guild.id
      }))
      if (!cGuild) {
        error('Not registered guild')
        return
      }
      if (cGuild.bye) {
        if(cGuild.byeChannel) {
          const byeChannel = member.guild.channels.cache.find(i => i.id === cGuild.byeChannel.id) as TextChannel
          byeChannel?.send({ embeds: [goodbyeEmbed]})
        }else{
          console.log('No bye channel')
        }
      }
    } catch (ex) {
      console.log(ex)
    }
  }

  onWrite = (member: GuildMember) => {
  }

  doAction = async (act: Action, user: GuildMember, msg?: Message) => {
    switch(act.type) {
      case 'AddRole':
        {
          this.addRole(user, act.role.id);
        }
        break;
      case 'RemoveRole':
        {
          this.removeRole(user, act.role.id);
        }
        break;
      case 'Message':
        {
          this.message(user, act.message);
        }
        break;
      case 'React':
        {
          this.react(user, act, msg);
        }
        break;
      case 'Ban':
        {
          this.ban(user, act.condition)
        }
        break;
      case 'Kick':
        {
          this.kick(user, act.condition)
        }
        break;
      case 'SoftBan':
        {

        }
        break;
      default:
        break;
    }
  }

  message = async (member: GuildMember, msg: string = '') => {
    member.send({
      content: msg
    })
  }

  onReact = async (member: PartialUser | User | GuildMember, reaction: MessageReaction | PartialMessageReaction) => {
    const error = (...msg: string[]) => console.error('[Admin].[onReact]', ...msg)
    const log = (...msg: string[]) => console.log('[Admin].[onReact]', ...msg)

    if (!this.db) {
      error('Database not set')
      return null
    }

    if (!reaction || !reaction.message) {
      error('No reaction or message')
      return
    }

    const guild = reaction.message.guild;
    let memberWhoReacted: GuildMember | null = null
    if (!guild) {
      log('Private message')
      return
    } else {
      memberWhoReacted = guild.members.resolve(member.id);
    }
    // if (!memberWhoReacted)
    //   memberWhoReacted = member as GuildMember
    
    // console.log(member.nickname, reaction.emoji)
    const callbacks = await this.db.collection('callbacks').find ({
      guild: guild.id,
      trigger: 'OnReact',
      messageId: reaction.message.id,
      "action.emoji": reaction.emoji.name,
    }).toArray()

    if(callbacks.length > 0)
      callbacks.forEach((cb: any) => {
        const call = cb as Callback
        this.doAction(call.action, memberWhoReacted || member as GuildMember);
      })
  }

  onUndoReact = async (member: PartialUser | User | GuildMember, reaction: PartialMessageReaction | MessageReaction) => {
    const error = (...msg: string[]) => console.error('[Admin].[onReact]', ...msg)
    const log = (...msg: string[]) => console.log('[Admin].[onReact]', ...msg)

    if (!this.db) {
      error('Database not set')
      return null
    }
    
    if (!reaction ||  !reaction.message) {
      error('No reaction or message')
      return;
    }
    
    const guild = reaction.message.guild;
    let memberWhoReacted: GuildMember | null = null
    if (!guild) {
      log('Private message')
      return
    } else {
      memberWhoReacted = guild.members.resolve(member.id);
    }

    const callbacks = await this.db.collection('callbacks').find ({
      guild: guild.id,
      trigger: 'OnUnreact',
      messageId: reaction.message.id,
      "action.emoji": reaction.emoji.name,
    }).toArray()
    
    if(callbacks.length > 0)
      callbacks.forEach((cb: any) => {
        const call = cb as Callback
        this.doAction(call.action, memberWhoReacted || member as GuildMember);
      })
  }

  onMemberUpdated = async (oldmember: GuildMember, newmember: GuildMember) => {
    const saveUser: LatteUser = {
      id: newmember.id,
      name: newmember.displayName,
      joinedTimestamp: newmember.joinedTimestamp,
      nickname: newmember.nickname,
      status: newmember.presence?.status,
      roles: [ ...newmember.roles.cache.values()],
      _roles: [ ...newmember.roles.cache.keys()] //_roles
    }
    // console.log(saveUser)
    await this.saveUserToGuild(saveUser, newmember.guild)
  }

  onRoleChanged = () => {

  }

  onEmojiCreated = () => {

  }

  onEmojiDeleted = () => {

  }

  onEmojiUpdated = () => {

  }

  onMessageUpdated = () => {

  }

  onMessage = (message: Message, triggers: Callback[]) => {
    const error = (...msg: string[]) => console.error('[Admin].[onMessage]', ...msg)
    const log = (...msg: string[]) => console.log('[Admin].[onMessage]', ...msg)

    for(const trig of triggers) {
      // console.log(message.channel.name, trig.channel)
      if(trig.trigger === 'OnMessage' && trig.channel.id === message.channel.id) {
        const guild = message.guild;
        if (!guild || !message.member) {
          log('Private message')
          return
        }
        // const memberWhoReacted: GuildMember = guild.members.resolve(message.author.id);
        this.doAction(trig.action, message.member, message)
      }
    }
  }

  setStatus = (status: string, type: ActivityType.Competing | ActivityType.Listening | ActivityType.Playing | ActivityType.Streaming | ActivityType.Watching | undefined) => {
    const error = (...msg: string[]) => console.error('[Admin].[onReact]', ...msg)
    const log = (...msg: string[]) => console.log('[Admin].[onReact]', ...msg)

    if (!this.bot) {
      error('Bot not set')
      return null
    }

    this.bot.user?.setActivity(status, {
      type,
      url: 'http://82.193.104.224:8080/'
    });
    // this.bot.user.setActivity({
    //   name: status,
    //   type: type,
    // })
  }

  addRole = (member: GuildMember, role: string | Role) => {
    const error = (...msg: string[]) => console.error('[Admin].[addRole]', ...msg)
    const log = (...msg: string[]) => console.log('[Admin].[addRole]', ...msg)

    const guild = member.guild;
    const irole: Role | undefined = typeof role !== 'string' ? role : guild.roles.cache.find((_role) => ((_role.name === role) || (_role.id === role)));
    if (!irole) {
      error('Role not found', JSON.stringify(role))
      return
    }
    member.roles.add(irole);
  }

  removeRole = (member: GuildMember, role: string | Role) => {
    const error = (...msg: string[]) => console.error('[Admin].[removeRole]', ...msg)
    const log = (...msg: string[]) => console.log('[Admin].[removeRole]', ...msg)

    const guild = member.guild;
    const irole: Role | undefined = typeof role !== 'string' ? role : guild.roles.cache.find((_role) => (_role.name === role) || (_role.id === role));
    if (!irole) {
      error('Role not found', JSON.stringify(role))
      return
    }
    member.roles.remove(irole);
  }

  react = async (user: User | GuildMember, act: Action, msg?: Message) => {
    const error = (...msg: string[]) => console.error('[Admin].[react]', ...msg)
    const log = (...msg: string[]) => console.log('[Admin].[react]', ...msg)

    if(!msg) {
      error('No message provided')
      return
    }

    for(const emoji of act.emoji){
      await msg.react(emoji)
    }
  }

  kick = async (user: GuildMember, reason: string) => {
    if(user.kickable)
      console.log(await user.kick(reason)); 
  }

  ban = async (user: GuildMember, reason: string) => {
    if(user.bannable)
      console.log(await user.ban({
        reason
      }));
  }

  drop = () => {

  }

  shutdown = () => {
    process.exit(0);
  }

  saveUserToGuild = async (user: LatteUser, guild: Guild) => {
    const error = (...msg: string[]) => console.error('[Admin].[saveUserToGuild]', ...msg)
    const log = (...msg: string[]) => console.log('[Admin].[saveUserToGuild]', ...msg)

    if (!this.db) {
      error('Database not set')
      return null
    }

    let guildDB = await(await this.db.collection('guilds').findOne({
      id: guild.id
    }))
    
    if(guildDB) {
      if(!guildDB.users)
      {
        guildDB.users = []
      }
      const userToEdit = guildDB.users.find((u: any) => u.id === user.id)
      // console.log('found', userToEdit)
      if(!userToEdit) {
        guildDB.users.push(user)
      } else {
        guildDB.users[guildDB.users.indexOf(userToEdit)] = {  ...userToEdit, ...user }
      }
      // console.log('applied', JSON.stringify(guildDB))
      await this.db.collection('guilds').updateOne({
        id: guild.id
      }, {
        $set: guildDB
      })
    } else {
      /* @ts-ignore */
      guildDB = await this.db.collection('guilds').insertOne({
        id: guild.id,
        name: guild.name,
        icon: guild.icon,
        region: guild.preferredLocale, // || guild.region,
        memberCount: guild.memberCount,
        large: guild.large,
        features: guild.features,
        afkTimeout: guild.afkTimeout,
        afkChannelID: guild.afkChannelId,
        systemChannelID: guild.systemChannelId,
        // embedEnabled: guild.embedEnabled,
        premiumTier: guild.premiumTier,
        premiumSubscriptionCount: guild.premiumSubscriptionCount,
        verificationLevel: guild.verificationLevel,
        explicitContentFilter: guild.explicitContentFilter,
        mfaLevel: guild.mfaLevel,
        joinedTimestamp: guild.joinedTimestamp,
        defaultMessageNotifications: guild.defaultMessageNotifications,
        maximumMembers: guild.maximumMembers,
        maximumPresences: guild.maximumPresences,
        description: guild.description,
        banner: guild.banner,
        rulesChannelID: guild.rulesChannelId,
        publicUpdatesChannelID: guild.publicUpdatesChannelId,
        preferredLocale: guild.preferredLocale,
        ownerID: guild.ownerId,
        emojis: [],
        users: [
          user
        ]
      })
    }
    
  }
  
  shortDescription = () => {
    return 'Admin provider. Only admins can use this.';
  }

  detailedDescription = () => {
    return `Available commands: \`shutdown\`, \`ban\`, \`drop\`, \`addRole\`, \`removeRole\``;
  }
}


export default Admin;
