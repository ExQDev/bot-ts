// import fetch from 'node-fetch';
// import axios from 'axios';
// import { MongoClient } from 'mongodb'
import { CallbackProps } from '@/types';

export default async function getusers({ db, user, guildId, bot }: CallbackProps) {
  if(!user)
    return [ 'error', 'Not authorized' ]
  
  if(!guildId)
    return [ 'error', 'No criteria provided']

  if(!bot)
    return [ 'error', 'No bot provided']

  const dbguild = await db.collection('guilds').findOne({
    id: guildId
  })
  
  const dsguild = await bot.guilds.fetch(guildId)
  
  if(!dbguild || !dsguild)
    return [ 'error', `I'm not at this guild` ]

  let dbusers = dbguild.users || []
  const users: any[] = [];
  // if (!dbusers) {
  //   dbusers = []
  //   //return [ 'users', [] ]
  // }
  (await dsguild.members.fetch()).forEach(({ guild, ...u }) => {
    // console.log(u, guild)
    users.push({
      ...u,
      avatar: u.user.displayAvatarURL({ extension: 'png' }),
      dbsettings: (dbusers && dbusers.some((dbu: any) => dbu.id === u.user.id)) ? dbusers.find((dbu: any) => dbu.id === u.user.id) : null
    })
  })

  
  const latteusers = (await (await db.collection('users').find({
    id: {
      $in: dbusers.map((dbu: any) => dbu.id)
    }
  })).toArray()).map(user => user.id)

  // console.log('Uses Latte', latteusers)
  users.forEach((user: any) => {
    // console.log(user)
    user.isLatteUser = latteusers.includes(user.user.id)
  })
  // const users = dsusers.map((u) => ({
  //   ...u,
  //   avatar: u.displayAvatarURL({ format: 'png', size: size_you_want }),
  //   dbsettings: dbusers.some(dbu => dbu.id === u.id) ? dbusers.find(dbu => dbu.id === u.id) : {}
  // }))
  // console.log('GET USERS', users)
  return ['users', users ]  
}