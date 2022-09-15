import { CallbackProps } from "@/types";

export default async function getQueue({ db, user, bot, guildId, commands }: CallbackProps) {
  if(!user)
    return [ 'error', 'Not authorized' ]

  if(!guildId)
    return [ 'error', 'No guild provided' ]

  const serverQueue = commands?.music.queue.get(guildId);
  if (serverQueue) {
    return ['queue', [ ...serverQueue.songs ] ]  
  } else {
    return ['error', 'Nothing to play']
  }
}