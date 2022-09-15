import { CallbackProps } from "@/types"

export default async function m_stop({ db, user }: CallbackProps) {
  if(!user)
    return [ 'error', 'Not authorized' ]
  
  return ['track', null ]  
}