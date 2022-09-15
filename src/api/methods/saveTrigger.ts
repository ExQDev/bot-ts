import { CallbackProps } from '@/types';
import { ObjectId } from 'mongodb';

export default async function saveTrigger({db, user, callback}: CallbackProps) {
  console.log(user, callback)
  let updatedCb = null
  if(callback._id) {
    const { _id, ...changes } = callback
    /* @ts-ignore */
    updatedCb = await db.collection('callbacks').findOneAndUpdate({
      _id: new ObjectId(_id)
    }, {
      '$set': {
        ...changes
      }
    },
    {
      upsert: true,
      returnNewDocument: true,
      returnOriginal: false
    })
    console.log(updatedCb)
  } else {
    updatedCb = await db.collection('callbacks').insertOne(callback)
  }

  /* @ts-ignore */
  return [ 'callback', updatedCb.value ]
}