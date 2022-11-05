import { CallbackProps } from '@/types';
// import { ObjectId } from 'mongodb';

export default async function setAutochannel({db, user, guildId, autochannel}: CallbackProps) {
  if(!guildId) return [ 'error', 'No guild provided' ]
  
  /* @ts-ignore */
  const updatedCb = (await db.collection('guilds').findOneAndUpdate({
    id: guildId
  }, {
    $set: {
      autochannel
    }
  }, {
    returnOriginal: false,
    returnDocument: true
  }))

  // console.log('UPD CB', updatedCb)

  /* @ts-ignore */
  const isOK = updatedCb.ok === 1
  if (isOK) {
    return [ 'autochannel', autochannel ]
  } else {
    return [ 'error', 'Could not write updated data' ]
  }
}