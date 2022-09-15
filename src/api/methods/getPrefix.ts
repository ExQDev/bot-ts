import { CallbackProps } from '@/types';
// import { ObjectId } from 'mongodb';

export default async function setPrefix({db, user, guildId}: CallbackProps) {
  if(!guildId) return [ 'error', 'No guild provided' ]
  let pref = '>'

  const updatedCb = await db.collection('guilds').findOne({
    id: guildId
  })
  
  if(updatedCb) 
    console.log(updatedCb.prefix)
  return [ 'prefix', updatedCb ? updatedCb.prefix : pref]
}