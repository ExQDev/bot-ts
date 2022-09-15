import { CallbackProps } from "@/types"

export default async function singin ({ db, user, setuser }: CallbackProps) {
  if (setuser && !user)
  {
    const user = await db.collection('users').findOne({ id: setuser.id })
    // console.log(user)
    return [ 'user', user ]
  }
  if(user)
    return ['user', user]
  
  if(!user && !setuser)
    return ['signin-fail', 'not authorized']

  return ['error', 'Something went wrong']
}