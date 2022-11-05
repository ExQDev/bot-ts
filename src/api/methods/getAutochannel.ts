import { CallbackProps } from '@/types';
import { ObjectID } from 'mongodb';

const template = {
  enabled: false,
  name: null,
  list: []
}

export default async function getAutochannel({db, user, guildId}: CallbackProps) {
  if(!guildId) return [ 'error', 'No guild provided' ]

  // console.log('getGreets', guild)
  const updatedCb = await db.collection('guilds').findOne({
    id: guildId
  })

  // console.log(updatedCb)
  
  if(updatedCb) {
    const { autochannel, ...cGuild } = updatedCb
    const channel = autochannel || template
    // console.log(greets)
    return [ 'autochannel', channel ]
  }

  return ['error', 'No autochannel data for this guild']
}