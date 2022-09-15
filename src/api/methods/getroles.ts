// import fetch from 'node-fetch';
// import axios from 'axios';

import { CallbackProps } from "@/types"

export default async function getroles({ db, user, guildId, userId: memberId, bot }: CallbackProps) {
  if(!user)
    return [ 'error', 'Not authorized' ]
  
  if(!guildId)
    return [ 'error', 'No guild provided']

  if(!bot)
    return [ 'error', 'No bot provided']
  
  // console.log(bot.guilds)
  const guild = bot.guilds.cache.get(guildId)
  // console.log(guild)
  
  if(!guild)
  {
    return [ 'error', `I'm not at this guild`]
  }

  if(memberId && guildId) {
    const member = await guild.members.fetch(memberId)
    // console.log(member)
    return member.roles
  }
  
  if (!guild) return [ 'roles', null ]

  const roles = guild.roles.cache.toJSON()

  return ['roles', roles ]  
}