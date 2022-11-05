import db, { connection } from "../utils/db";
import type { ArgsOf, Client } from "discordx";
import { Discord, On } from "discordx";
import { Guild } from "@/types";
import cmds from '../commands'
import wire from '../utils/wire'
import { ChannelType } from "discord.js";

// console = wire
@Discord()
export class Guilds {

  @On('voiceStateUpdate')
  async onVoiceStateUpdate([oldState, newState]: ArgsOf<'voiceStateUpdate'>, client: Client): Promise<void> {
    // wire.log('voice state changed', oldState, newState)
    if (oldState.member?.user.bot) return;

    const guild = await connection.collection('guilds').findOne({
      id: newState.guild.id
    })

    if (!guild) return;

    const { autochannel } = guild

    if (newState.channel?.name === autochannel.name) {
      // Join
      if (newState.member && newState.channel?.members.some(member => member.id === newState.member?.id)) {
        const newChannelName = newState.member?.nickname + '\'s channel'
        const newVoiceChannel = await newState.guild.channels.create({
          name: newChannelName,
          type: ChannelType.GuildVoice,
          parent: newState.channel?.parent
        })
        const list = autochannel.list || []
        const newAutochannel = {
          ...autochannel,
          list: [
            ...list,
            newChannelName
          ]
        }
          /* @ts-ignore */
        const updatedCb = (await connection.collection('guilds').findOneAndUpdate({
          id: newState.guild.id
        }, {
          $set: {
            autochannel: newAutochannel
          }
        }, {
          returnOriginal: false,
          returnDocument: true
        }))
  
        /* @ts-ignore */
        if (updatedCb && updatedCb.ok === 1) {
          newState.member?.voice.setChannel(newVoiceChannel, 'Created personal channel')
        }
      }
    } else if (autochannel.list && autochannel.list.includes(oldState.channel?.name)) {
      wire.log('Not the autochannel')
      // Left last

      if (!newState.channel && oldState.channel && oldState.channel.members.size === 0) {
        const oldChannelName = oldState.channel?.name
        await oldState.channel.delete();
        const newAutochannel = {
          ...autochannel,
          list: autochannel.list.filter((c:string) => c !== oldChannelName)
        }

        // wire.log('newAutochannel', newAutochannel)
        
        /* @ts-ignore */
        const updatedCb = (await connection.collection('guilds').findOneAndUpdate({
          id: newState.guild.id
        }, {
          $set: {
            autochannel: newAutochannel
          }
        }, {
          returnOriginal: false,
          returnDocument: true
        }))

        /* @ts-ignore */
        // wire.log(updatedCb.ok)
      }
    }
    // let guildDb = connection.collection('guilds').findOne({ id: guild.id })
    // if ()
  
    // console.log(guildDB)
    // console.log("Message Deleted", client.user?.username, message.content);
  }

  @On('guildCreate')
  async onGuildCreate([guild]: ArgsOf<'guildCreate'>, client: Client): Promise<void> {
    console.log('create', guild)
    // let guildDb = connection.collection('guilds').findOne({ id: guild.id })
    // if ()
    const guildDB = await connection.collection('guilds').updateOne({
      id: guild.id,
    }, {
      $set: {
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
        emojis: []
      }
    }, {
      upsert: true,
    })
    // console.log(guildDB)
    // console.log("Message Deleted", client.user?.username, message.content);
  }

  @On('guildDelete')
    async onGuildDelete([guild]: ArgsOf<'guildDelete'>, client: Client): Promise<void> {
      console.log('delete', guild)
      // let guildDb = connection.collection('guilds').findOne({ id: guild.id })
      // if ()
      const archivedGuild = await connection.collection('guilds').findOne<Guild>({
        id: guild.id,
      })

      const archived = await connection.collection('archive').insertOne({
        ...archivedGuild
      })

      const event = await connection.collection('globalEvents').insertOne({
        name: 'remove',
        type: 'guild',
        gId: guild.id,
        gName: guild.name
      })

      const guildDB = await connection.collection('guilds').deleteOne({
        id: guild.id,
      })
      // console.log(guildDB)
      console.log('Done', archived, event, guildDB);
    }

    @On('messageReactionAdd')
    async onMessageReactionAdd([reaction, user]: ArgsOf<'messageReactionAdd'>, client: Client): Promise<void> {
      console.log('react', user.toString())
      cmds.admin.init(client, connection)
      // let guildDb = connection.collection('guilds').findOne({ id: guild.id })
      // if ()
      cmds.admin.onReact(user, reaction)
      // console.log(guildDB)
      // console.log("Message Deleted", client.user?.username, message.content);
    }

    @On('messageReactionRemove')
    async onMessageReactionRemove([reaction, user]: ArgsOf<'messageReactionAdd'>, client: Client): Promise<void> {
      console.log('unreact', user.toString())
      cmds.admin.init(client, connection)
      // let guildDb = connection.collection('guilds').findOne({ id: guild.id })
      // if ()
      cmds.admin.onUndoReact(user, reaction)
      // console.log(guildDB)
      // console.log("Message Deleted", client.user?.username, message.content);
    }
}
