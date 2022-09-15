import { CallbackProps } from "@/types"

export default async function m_next({ db, user, guildId, commands }: CallbackProps) {
  if(!user)
    return [ 'error', 'Not authorized' ]
  
  /* @ts-ignore */
  commands?.music.apiNext(guildId)
  return ['service']
}