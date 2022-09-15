import { CallbackProps } from "@/types"

export default async function m_pause({ db, user, guildId, commands }: CallbackProps) {
  if(!user)
    return [ 'error', 'Not authorized' ]
    
  /* @ts-ignore */
  commands?.music.pause({ id: guildId })  
}