import { CallbackProps } from '@/types';
import { ObjectId } from 'mongodb';

export default async function deleteTrigger({db, user, callback}: CallbackProps) {
  console.log(user, callback)
  let updatedCb = null
  if(callback._id) {
    updatedCb = await db.collection('callbacks').deleteOne({
      _id: new ObjectId(callback._id)
    })
  } else {
    updatedCb = await db.collection('callbacks').deleteMany({
      guild: callback.guild
    })
  }
  return [ 'deleted-callback', callback._id ]
}