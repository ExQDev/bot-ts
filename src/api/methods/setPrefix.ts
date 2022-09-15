import { CallbackProps } from '@/types';
// import { ObjectId } from 'mongodb';

export default async function setPrefix({db, user, guild, prefix}: CallbackProps) {
  if(!guild) return [ 'error', 'No guild provided' ]
  let pref = prefix
  if(!prefix) pref = '>'

  /* @ts-ignore */
  const updatedCb = await db.collection('guilds').findOneAndUpdate({
    id: guild
  }, {
    '$set': {
      prefix: pref
    }
  }, {
    returnOriginal: false,
    returnDocument: true
  })
  
  // console.log(updatedCb)
  /* @ts-ignore */
  return [ 'prefix', updatedCb.value.prefix ]
}