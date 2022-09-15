import ytdl from 'ytdl-core'
import ffmpeg from 'fluent-ffmpeg'
import fs from 'fs'
import { CallbackProps } from '@/types';


const convertVideo = (xs: any, format: string) => {
  const convertedFilePath = `${xs}.${format}`;
  return new Promise<string>((resolve, reject) => {
    if (!process.env.FFMPEG_PATH) {
      console.error('No process.env.FFMPEG_PATH')
      return null
    }
    if (!process.env.FFPROBE_PATH) {
      console.error('No process.env.FFPROBE_PATH')
      return null
    }
    ffmpeg(__dirname+'/public/'+xs+'.webm')
      .setFfmpegPath(process.env.FFMPEG_PATH)
      .setFfprobePath(process.env.FFPROBE_PATH)
      .toFormat(format)
      .on("start", commandLine => {
        console.log(`Spawned Ffmpeg with command: ${commandLine}`);
      })
      .on("error", (err, stdout, stderr) => {
        console.log(err, stdout, stderr);
        reject(err);
      })
      .on("end", (stdout, stderr) => {
        console.log(stdout, stderr);
        resolve(convertedFilePath);
      })
      .saveToFile(__dirname+'/public/'+`${convertedFilePath}`);
  });
};

export default async function getsoundtrack({ db, user, bot, guildId, commands }: CallbackProps) {
  if(!user)
    return [ 'error', 'Not authorized' ]

  if(!guildId)
    return [ 'error', 'No guild specified' ]

  console.log(process.cwd())
  const servQ = commands?.music.queue.get(guildId)
  console.log('GETTRACK')
  let ret = '', erro = false
  if (servQ && servQ.currentSong) {
    if(fs.existsSync(process.cwd()+'/src'+'/public/'+servQ.currentSong.videoId+'.mp3')) {
      ret = servQ.currentSong.videoId+'.mp3';
      return ['soundtrack', ret ] 
    }
  
    const writeStream = fs.createWriteStream(process.cwd()+'/src'+'/public/'+servQ.currentSong.videoId+'.webm');
    const stream = await (ytdl(servQ.currentSong.url, {
      quality: 'lowestaudio',
      highWaterMark: 1 << 25
    })
    .on('progress', (ln, dd, dl) => {
      console.log(ln, dd, dl)
    })
    .on('end', async function() {
      console.log(servQ.currentSong?.videoId+'.webm')
      const vid = await convertVideo(servQ.currentSong?.videoId, 'mp3')
      console.log(vid)
      ret = vid
    })
    .on('error', (err) => {
      erro = true
      ret = err.message
    })
    .pipe(writeStream))
  }

  if (!erro) {
    return ['soundtrack', ret ]  
  } else {
    return ['error', ret]
  }
}