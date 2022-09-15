import { CallbackProps } from "@/types";

export default async function m_play({ db, user, guildId, commands }: CallbackProps) {
  if(!user)
    return [ 'error', 'Not authorized' ]
  
  if(!guildId)
    return [ 'error', 'Guild not provided' ]

  const serverQueue = commands?.music.queue.get(guildId);

  if(!serverQueue)
    return [ 'error', 'Queue is not found']
  
  if (!serverQueue.playing && serverQueue.currentSong) {
    /* @ts-ignore */
    commands?.music.play({ id: guildId })
  } else {
    /* @ts-ignore */
    commands?.music.pause({ id: guildId })
  }
  return ['service']
}