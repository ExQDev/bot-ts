import { CallbackProps } from "@/types"

export default async function incomeUser({db, user, incomeUser, token}: CallbackProps) {
  console.log(user, incomeUser)
  if (!token) {
    return [ 'error', 'Token not provided' ]
  }

  /* @ts-ignore */
  const updatedUser = await db.collection('users').findOneAndUpdate({
    id: incomeUser.id
  }, {
    '$set': {
      ...incomeUser,
      token
    }
  }, {
    upsert: true,
    returnDocument: true
  })

  console.log(updatedUser)
  return [ 'user', updatedUser ]
}