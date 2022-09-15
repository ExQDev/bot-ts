import db, { connection } from "../utils/db";
import type { ArgsOf, Client } from "discordx";
import { Discord, On } from "discordx";
import { Guild } from "@/types";
import cmds from '../commands'

@Discord()
export class Guilds {
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
