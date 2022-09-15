// import { ObjectId } from 'mongodb';
// import axios from 'axios';
import { CallbackProps } from '@/types';
import { OAuth2Scopes } from 'discord.js';

export default async function generateInvite({db, user, guild, bot}: CallbackProps) {
  if(!guild) return [ 'error', 'No guild provided' ]

  if (!bot) return [ 'error', 'bot is undefined' ]

  const link = bot.generateInvite({
    scopes: [
      OAuth2Scopes.Bot
    ],
    permissions: 'Administrator',
    guild: guild.id
  });//.then(link => { console.log('link', link ) })
  // https://discord.com/oauth2/authorize?client_id=310848622642069504&guild_id=677506930562039840&scope=bot&permissions=980937982
  console.log('Generated link:', link)

  // const body = {
  //   method: 'generateInvite',
  //   guildId: guild,
  // };
  // const link = await (await axios.post(`http://localhost:9099/api`, body )).data;
  // console.log(link)
  return [ 'invite', link]
}