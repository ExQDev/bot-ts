import { CallbackProps } from '@/types';
// import { ObjectId } from 'mongodb';

export default async function setGreets({db, user, guildId, greets}: CallbackProps) {
  if(!guildId) return [ 'error', 'No guild provided' ]
  
  /* @ts-ignore */
  const updatedCb = (await db.collection('guilds').findOneAndUpdate({
    id: guildId
  }, {
    $set: {
      ...greets
    }
  }, {
    returnOriginal: false,
    returnDocument: true
  }))

  console.log('UPD CB', updatedCb)

  /* @ts-ignore */
  const { greet, bye, greetChannel, byeChannel, ...cGuild } = updatedCb.value
  return [ 'greets', {
    greet, bye, greetChannel, byeChannel
  } ]
}