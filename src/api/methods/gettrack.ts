import { CallbackProps } from "@/types"

export default async function gettrack({ db, user, bot, guildId, commands }: CallbackProps) {
  if(!user)
    return [ 'error', 'Not authorized' ]

  /* @ts-ignore */
  return ['track', commands?.music.status({ id: guildId }, true) ]  
}