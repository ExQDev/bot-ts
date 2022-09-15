import { CallbackProps } from '@/types';
import { ObjectID } from 'mongodb';

const template = {
  greet: false,
  bye: false,
  greetChannel: {
    id: null,
    name: null
  },
  byeChannel: {
    id: null,
    name: null
  }
}

export default async function setPrefix({db, user, guildId}: CallbackProps) {
  if(!guildId) return [ 'error', 'No guild provided' ]

  // console.log('getGreets', guild)
  const updatedCb = await db.collection('guilds').findOne({
    id: guildId
  })

  // console.log(updatedCb)
  
  if(updatedCb) {
    const { greet, bye, greetChannel, byeChannel, ...cGuild } = updatedCb
    const greets = {
      greet: greet ? greet : template.greet,
      bye: bye ? bye : template.bye,
      greetChannel: greetChannel ? greetChannel : template.greetChannel,
      byeChannel: byeChannel ? byeChannel : template.byeChannel
    }
    // console.log(greets)
    return [ 'greets', greets]
  }

  return ['error', 'No greets data for this guild']
}