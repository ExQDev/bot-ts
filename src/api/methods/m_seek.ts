import { CallbackProps } from "@/types";

export default async function m_seek({ db, user, guildId, commands, pos }: CallbackProps) {
  if(!user)
    return [ 'error', 'Not authorized' ]
  if(!guildId)
    return [ 'error', 'No guild provided' ]
  const serverQueue = commands?.music.queue.get(guildId);
  // console.log(serverQueue, guild, pos)
  if (serverQueue && serverQueue.currentSong) {
    /* @ts-ignore */
    commands?.music.apiSeek(guildId, pos)
  } 
  return ['service']
}