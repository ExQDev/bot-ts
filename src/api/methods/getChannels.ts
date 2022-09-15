import { CallbackProps } from "@/types"

export default async function getChannels({ db, user, bot, guildId }: CallbackProps ) {
  // console.log(user, db, guildId, userId)
  if(!user)
    return [ 'error', 'Not authorized' ]
  
  // const guildId = guild?.id

  if(!bot)
    return [ 'error', 'Bot not provided']

  if(!guildId)
    return [ 'error', 'No guild provided']

  // const body = {
  //   method: 'getChannels',
  //   guildId: guild,
  //   // userId
  // };

  // console.log(body)

  // const channels = await (await axios.post(`http://localhost:9099/api`, body )).data;
  const guild = bot.guilds.cache.get(guildId)
  // console.log(guild)
    
  // if(memberId && guildId) {
  //   const member = guild.members.get(memberId)
  //   // console.log(member)
  //   return member.roles
  // }

  if(!guild)
  {
    return ['error', 'Bot is not at this guild']
  }
  
  const channels = await (await guild.channels.fetch()).toJSON()
  // console.log(channels)
  // const owned = guilds.filter(g => g.owner)

  return ['channels', channels ]  
}