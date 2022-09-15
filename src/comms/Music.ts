import type { Client, Guild, Message, TextChannel, VoiceChannel } from 'discord.js';
import { Db } from 'mongodb';
import ytdl from 'ytdl-core';
import ytpl from 'ytpl';
import ytsr, { Video, Image } from 'ytsr'
import spdl from 'spdl-core';
import { joinVoiceChannel, createAudioPlayer, createAudioResource, getVoiceConnection } from '@discordjs/voice';
import { Duration } from 'luxon';
import { ICommand, Song, Queue, VideoItem } from '../types';
import { Player } from 'discord-music-player';

class Music implements ICommand { 
  queue: Map<String, Queue> = new Map<String, Queue>();
  bot : Client | null = null;
  db: Db | null = null;
  player: Player | null = null;

  init = (bot: Client, db: Db): void => {
    if(!this.bot) this.bot = bot;
    if(!this.db) this.db = db;
    const player = new Player(bot, {
      leaveOnEmpty: true, // This options are optional.
    });
    this.player = player;
  }

  execute = (msg: Message) => {
    return async (args: string[]) => {
      const error = (...msg: string[]) => console.error('[Music].[execute]', ...msg)
      const log = (...msg: string[]) => console.log('[Music].[execute]', ...msg)

      if (!msg.guild || !msg.guildId || !msg.member) {
        log('Not a guild message')
        return null
      }

      let serverQueue : Queue | undefined = this.queue.get(msg.guild?.id);
      const voiceChannel = msg.member.voice.channel;

      if (!serverQueue) {
        const queueContruct: Queue = {
          textChannel: msg.channel,
          voiceChannel: voiceChannel,
          connection: null,
          songs: [],
          volume: 5,
          playing: true,
          currentSong: {
            source: 'youtube',
            videoId: '',
            title: '',
            url: '',
            preview: {
              url: '',
              width: 0,
              heigth: 0
            }
          },
          player: null
        };
        
        this.queue.set(msg.guild.id, queueContruct);
        serverQueue = queueContruct;
      }
      serverQueue.textChannel = msg.channel;
      const me = msg.guild.members.me
      if (!me) {
        error('Me not found')
        return
      }
      if (!this.player) {
        error('Player not found')
        return
      }
      let musiccmd = args.shift();
      if(!musiccmd)
      {
        msg.channel.send({ content: 'No command to execute. Use `>help music` to get detaled info.' })
        return
      }
      else {
        musiccmd = musiccmd.toLowerCase();
      }
      switch(musiccmd){
        case 'add':
          {
            if (!voiceChannel) return msg.channel.send({ content: 'You need to be in a voice channel to play music!' });
            const permissions = voiceChannel.permissionsFor(me);
            if (!permissions.has('Connect') || !permissions.has('Speak')) {
              return msg.channel.send({ content: 'I need the permissions to join and speak in your voice channel!' });
            }
            if(serverQueue && serverQueue.playing) {
              if(args.length > 0) {
                const url = args.shift();
                let videos: VideoItem[] = [];
    
                if (!url) {
                  error ('Smth strange with url (args)')
                  return
                }
                console.log(url)
                if(url.startsWith('https://www.youtube.com/playlist?') || (url.startsWith('https://www.youtube.com/watch?') && (url.includes('&list=') || url.includes('?list=')))) {
                  const playlist = (await ytpl(url)).items; //await (await ytlist(url, 'url')).data.playlist
                  videos = playlist.map(vi => ({ ...vi, source: 'youtube' } as VideoItem));
                  msg.channel.send(`Added ${videos.length} songs from playist. ${(serverQueue ? serverQueue.songs.length : 0) + videos.length} songs left.`);
                }
                else if(url.startsWith('https://www.youtube.com/watch?') || url.startsWith('https://youtu.be/')) {
                  videos.push({ shortUrl: url, source: 'youtube' });
                  msg.channel.send(`Video has been added to playist. ${(serverQueue ? serverQueue.songs.length : 0) + videos.length} songs left.`);
                }
                else if (url.startsWith('https://open.spotify.com/track/')) {
                  videos.push({ shortUrl: url, source: 'spotify' });
                }
                else if (url.startsWith('https://open.spotify.com/playlist/')) {  
                let queue = this.player.createQueue(msg.guild.id);
                  await queue.join(msg.member.voice.channel);
                  let song = await queue.playlist(args.join(' ')).catch(_ => {
                      if(!guildQueue)
                          queue.stop();
                  });
                } else if (url.startsWith('"')) {
                  const sreq = [ url, ...args ].join(" ").replace('"', '')
                  const sr = (await ytsr(sreq, {
                    limit: 10,
                    safeSearch: true
                  }))
                    .items
                    .filter(i => 
                      i.type === 'video' && 
                      (sreq.toLowerCase().includes('live') 
                        ? i.title.toLowerCase().includes('live') 
                        : !i.title.toLowerCase().includes('live')))
                    .map(i => i as Video)
                  // console.log(sr)
                  if (sr.length > 0)
                  {
                    videos.push({ shortUrl: sr[0].url, id: sr[0].id, title: sr[0].title, source: 'youtube' })
                  } else {
                    return msg.channel.send({ content: 'Not found any matching videos' })
                  }
                } else {
                  return msg.channel.send({ content: 'This source is not supported yet' })
                }
                
                for(const video of videos) {
                  const song: Song = {
                    title: video.title || null,
                    url: video.shortUrl,
                    preview: video.bestThumbnail || {
                      url: null,
                      width: 0,
                      height: 0,
                    },
                    fpreview: undefined,
                    author: video.author ? {
                      url: video.author.url,
                      name: video.author.name,
                      channelID: video.author.channelID
                    } : undefined,
                    videoId: video.id || null,
                    duration: video.duration,
                    source: video.source
                  };
                  serverQueue.songs.push(song);
                }
              }
            }
          }
          break;
        case 'play':
          if (!voiceChannel) return msg.channel.send({ content: 'You need to be in a voice channel to play music!' });
          const permissions = voiceChannel.permissionsFor(me);
          if (!permissions.has('Connect') || !permissions.has('Speak')) {
            return msg.channel.send({ content: 'I need the permissions to join and speak in your voice channel!' });
          }

          if(args.length > 0) {
            const url = args.shift();
            if (!url) {
              error ('Smth strange with url (args)')
              return
            }
            let videos: VideoItem[] = [];

            if(url.startsWith('https://www.youtube.com/playlist?') || (url.startsWith('https://www.youtube.com/watch?') && (url.includes('&list=') || url.includes('?list=')))) {
              const playlist = (await ytpl(url)).items; //await (await ytlist(url, 'url')).data.playlist
              videos = playlist.map(vi => ({ ...vi, source: 'youtube' } as VideoItem));
              msg.channel.send(`Added ${videos.length} songs from playist. ${(serverQueue ? serverQueue.songs.length : 0) + videos.length} songs left.`);
            }
            else if(url.startsWith('https://www.youtube.com/watch?') || url.startsWith('https://youtu.be/')) {
              videos.push({ shortUrl: url, source: 'youtube' });
              msg.channel.send(`Video has been added to playist. ${(serverQueue ? serverQueue.songs.length : 0) + videos.length} songs left.`);
            }
            else if (url.startsWith('https://open.spotify.com/track/')) {
              const nurl = await (await spdl.getInfo(url)).url
              console.log(nurl)
              videos.push({ shortUrl: nurl, source: 'spotify' });
            }
            else if (url.startsWith('https://open.spotify.com/playlist/')) {
              let queue = this.player.createQueue(msg.guild.id);
              await queue.join(msg.member.voice.channel);
              let guildQueue = this.player.getQueue(msg.guild.id);
              let song = await queue.playlist(url).catch(_ => {
                  if(!guildQueue)
                      queue.stop();
              });
              return
            }
            else if (url.startsWith('"')) {
              const sreq = [ url, ...args ].join(" ").replace('"', '')
              const sr = (await ytsr(sreq, {
                limit: 10,
                safeSearch: true
              }))
                .items
                .filter(i => 
                    i.type === 'video' && 
                    (sreq.toLowerCase().includes('live') 
                      ? i.title.toLowerCase().includes('live') 
                      : !i.title.toLowerCase().includes('live')))
                .map(i => i as Video);
              // console.log(sr)
              if (sr.length > 0)
              {
                videos.push({ shortUrl: sr[0].url, id: sr[0].id, title: sr[0].title, source: 'youtube'})
              } else {
                return msg.channel.send({ content: 'Not found any matching videos' })
              }
            } else {
              return msg.channel.send({ content: 'This source is not supported yet' });
            }
            
            for(const video of videos) {
              const song: Song = {
                title: video.title || null,
                url: video.shortUrl,
                preview: video.bestThumbnail || {
                  url: null,
                  width: 0,
                  height: 0,
                },
                fpreview: undefined,
                author: video.author ? {
                  name: video.author.name,
                  channelID: video.author.channelID,
                  url: video.author.url
                } : undefined,
                videoId: video.id || null,
                duration: video.duration,
                source: video.source
              };
              serverQueue.songs.push(song);
            }
          }else if(!serverQueue || serverQueue.songs.length == 0) {
            serverQueue.textChannel.send({ content: 'Sorry, nothing to play :(' });
            return;
          }
      
          try {
            // v13
            var connection = joinVoiceChannel({
              channelId: voiceChannel.id,
              guildId: msg.guild.id,
              adapterCreator: msg.guild.voiceAdapterCreator
            })
            serverQueue.player = createAudioPlayer();

            if (!serverQueue.player) {
              error('Could not create audio player')
            }
            // v12
            // var connection = await voiceChannel.join();
            
            serverQueue.connection = connection;
            this.play(msg.guildId);
            if(!serverQueue.currentSong)
              serverQueue.textChannel.send({ content: `Player will now play!` });
            return;
          } catch (err) {
            console.error(err);
            this.queue.delete(msg.guild.id);
            serverQueue.textChannel.send({ content: err });
            return;
          }
          break;
        case 'skip':
          this.skip(msg, serverQueue, args);
          break;
        case 'stop':
          this.stop(msg, serverQueue);
          let guildQueue = this.player.getQueue(msg.guild.id);
          guildQueue?.stop();
          break;
        case 'pause':
          this.pause(msg.guild);
          break;
        case 'status':
          this.status(msg.guild, false);
          break;
        default: 
          serverQueue.textChannel.send({ content: 'No such command in command list' })
          break;
      }
    }
  }

  skip = (message: Message, serverQueue: Queue, args: string[]) => {
    if (!message.member?.voice.channel) return message.channel.send({ content: 'You have to be in a voice channel to stop the music!' });
    if (!serverQueue) return message.channel.send({ content: 'There is no song that I could skip!' });
    const song = serverQueue.currentSong;
    let toSend = "";
    let minIdx = 0, maxIdx = 1;
    if(args.length > 0)
    {
      const toSkip : number[] = []
      if(args[0].includes('-')){
        const range = args[0].split('-');
        minIdx = Math.min(Number(range[0]), Number(range[1])) || 1;
        maxIdx = Math.max(Number(range[0]), Number(range[1])) || 2;
        for(let i = minIdx - 2; i <= maxIdx - 2;  i++){
          toSkip.push(i || 0);
        }
      }
      else
      {
        toSkip.push(Number(args[0]) - 1 || 0)
        minIdx = Number(args[0]) - 1 || 0;
      }
      serverQueue.songs = serverQueue.songs.filter((song, index) => !toSkip.includes(index));
      toSend = `${toSkip.length} songs skipped!`
    }
    else
      toSend = `${song?.title} skipped!`
    
    message.channel.send(toSend).finally(() => {
      if(minIdx <= 0) serverQueue.connection && serverQueue.connection.dispatcher && serverQueue.connection.dispatcher.end();
    });
    
  }

  apiNext = (guildId: string) => {
    const serverQueue = this.queue.get(guildId);
    if(serverQueue) {
      const song = serverQueue.currentSong;
      serverQueue.textChannel.send({ content: `${song?.title} skipped!` }).finally(() => {
        serverQueue.connection && serverQueue.connection.dispatcher && serverQueue.connection.dispatcher.end();
      });
      return;
    }
  }
  
  apiSeek = (guildId: string, pos: number) => {
    const error = (...msg: string[]) => console.error('[Music].[apiSeek]', ...msg)
    const log = (...msg: string[]) => console.log('[Music].[apiSeek]', ...msg)

    const serverQueue = this.queue.get(guildId);
    if(serverQueue) {
      const song = serverQueue.currentSong;
      if (!song) {
        error('No song')
        return
      }
      const dispatcher = serverQueue.connection.play(song.stream, {seek: pos })
        .on('finish', () => {
          this.play(guildId);
        })
        .on('error', (error: any) => {
          console.error(error);
          serverQueue.playing = false;
        });

      console.log(dispatcher)
      serverQueue.textChannel.send({ content: `${song.title} seeked to ${pos}!` }).finally(() => {
        serverQueue.connection && serverQueue.connection.dispatcher && serverQueue.connection.dispatcher.end();
      });
      return;
    }
  }
  
  stop = (message: Message, serverQueue: Queue) => {
    const error = (...msg: string[]) => console.error('[Music].[stop]', ...msg)
    const log = (...msg: string[]) => console.log('[Music].[stop]', ...msg)

    if (!message.guildId) {
      log('DM')
      return
    }

    if (!message.member?.voice.channel) return message.channel.send({ content: 'You have to be in a voice channel to stop the music!' });
    serverQueue.songs = [];
    serverQueue.connection && serverQueue.connection.dispatcher &&
    serverQueue.connection.dispatcher.end();
    serverQueue.playing = false;
    serverQueue.currentSong = null;
    
    // message.guild?.members.me
    getVoiceConnection(message.guildId)?.disconnect()
    // serverQueue.voiceChannel.leave();
    message.channel.send({ content: 'Queue is emptied!' })
  }
  
  play = async (guildId: string) => {
    const error = (...msg: string[]) => console.error('[Music].[play]', ...msg)
    const log = (...msg: string[]) => console.log('[Music].[play]', ...msg)

    
    const serverQueue = this.queue.get(guildId);
    if(!serverQueue) return
    if(!serverQueue.playing && serverQueue.currentSong) {
      if (serverQueue.connection.dispatcher) {
        serverQueue.connection.dispatcher.resume();
        serverQueue.playing = true;
        serverQueue.textChannel.send({ content: 'Player resumed!' })
        serverQueue.connection.dispatcher.resume()  
        return;
      }
    }

    const song : Song | undefined = serverQueue.songs.shift()
    if (!song) {
      error('no song found')
      return
    }
    serverQueue.currentSong = song;

    if (!song) {
      try {
        // serverQueue.voiceChannel.leave();
        // this.player.
        // leaveVoiceChannel(serverQueue.voiceChannel.channelID)
        getVoiceConnection(guildId)?.disconnect()
      } catch (er) {
        console.error(er)
      }
      this.queue.delete(guildId);
      serverQueue.currentSong = null;
      return;
    }

    // const inf = await ytdl.getInfo(song.url).catch(err => {
    //   console.error(err);
    //   serverQueue.textChannel.send(`Error caused while accessing video at ${song.url}, ${songInfo ? songInfo.videoDetails.title : 'Unavailable'}. Skipped.`)
    //   const nextsong = serverQueue.songs.shift();
    //   this.play(guild, nextsong);
    // });
    // if(!inf) {
    //   serverQueue.textChannel.send(`Error caused while accessing video at ${song.url}, ${songInfo ? songInfo.videoDetails.title : 'Unavailable'}. Skipped.`)
    //   const nextsong = serverQueue.songs.shift();
    //   this.play(guild, nextsong);
    //   return
    // }
    // const { related_videos = null, formats, ...songInfo } = inf
    // song.title = songInfo.videoDetails.title;
    // song.url = songInfo.videoDetails.video_url;
    // song.videoId = songInfo.videoDetails.videoId
    // // console.log(songInfo.videoDetails)
    // song.author = songInfo.videoDetails.author
    // song.preview = songInfo.videoDetails.thumbnails[3];
    // song.fpreview = songInfo.videoDetails.thumbnails[4];
    // console.log(song)
    
    
    serverQueue.playing = true;
    try {
      console.log(song.source)
      let dl;
      if (song.source === 'spotify') {
        dl = await spdl(await (async () => {
         const newURL = (await spdl.getInfo(song.url)).url
         console.log('________________________>', newURL)
         return newURL
        })(), { quality: 'highestaudio', highWaterMark: 1 << 25});
      } else {
        dl = ytdl(song.url+'&bpctr=9999999999', { 
          quality: 'highestaudio',
          highWaterMark: 1 << 25,
          // requestOptions: {
          //   headers: {
          //     cookie: '__Secure-3PSID',
          //     'x-youtube-identity-token': 
          //   }
          // }
        })
      }
      
      serverQueue.currentSong.stream = dl.on('info', ({ videoDetails }) => {
        song.title = videoDetails.title;
        // song.url = videoDetails.video_url;
        song.videoId = videoDetails.videoId
        // console.log(songInfo.videoDetails)
        song.author = videoDetails.author
        song.preview = videoDetails.thumbnails[3];
        song.fpreview = videoDetails.thumbnails[4];
        serverQueue.textChannel.send({ content: `${song.title} will now play` });
        // console.log(song)
      })
      serverQueue.resource = createAudioResource(dl);
      serverQueue.connection.subscribe(serverQueue.player)
      const dispatcher = serverQueue.player?.play(serverQueue.resource)

      dl.on('finish', () => {
          this.play(guildId);
        })
        .on('error', error => {
          console.error(error);
          serverQueue.playing = false;
        });

        // console.log(song.stream)
        // dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);
    } catch (ex) {
      console.error(ex)
      this.play(guildId)
    }
  }

  pause = (guild: Guild) => {
    const serverQueue = this.queue.get(guild.id);
    if(!serverQueue || !serverQueue.currentSong) return

    if(!serverQueue.playing) {
      serverQueue.connection.dispatcher.resume();
      serverQueue.playing = true;
      serverQueue.textChannel.send({ content: 'Player resumed!' });
      return;
    } else
    // if(serverQueue.connection && serverQueue.connection.dispatcher)
    {
      serverQueue.connection.dispatcher.pause();
      serverQueue.playing = false;
      serverQueue.textChannel.send({ content: 'Player paused'});
    }  
  }

  status = (guild: Guild, api: boolean) => {
    // console.log('STATUS', api)
    const serverQueue = this.queue.get(guild.id);
    const getPlayingStatus = () => {
      let status = 'Not started.';
      if(!serverQueue || (serverQueue && !serverQueue.currentSong))
        status = 'Not started.';
      if(serverQueue && !serverQueue.currentSong && serverQueue.songs.length > 0)
        status = 'Started. Nothing to play.';
      if(serverQueue && serverQueue.currentSong && !serverQueue.playing)
        status = 'Paused.'
      if(serverQueue && serverQueue.currentSong && serverQueue.playing)
        status = 'Playing.'
      return status; 
    };

    const getCurrentSong = () => {
      let song: string = 'None';
      if(serverQueue && serverQueue.currentSong)
        song = serverQueue.currentSong.title || 'None'
      return song;
    }

    const getAuthor = () => {
      let song = {
        name: 'None'
      }
      if(serverQueue && serverQueue.currentSong)
        song = serverQueue.currentSong.author || { name: 'None' }
      return song;
    }

    const getSongPosition = (api: boolean) => {
      let postition = api ? 0 : '0:00';
      if(serverQueue && serverQueue.currentSong && serverQueue.connection && serverQueue.connection.dispatcher){
        if (api) {
          return serverQueue.connection.dispatcher.streamTime
        }
        postition = Duration.fromMillis(serverQueue.connection.dispatcher.streamTime).toFormat('m:ss');
      }
      return postition;
    }

    const getSongsLeft = () => {
      let left = 0;
      if(serverQueue)
        left = serverQueue.songs.length;
      return left;
    }

    const getThumbnail = (api: boolean) => {
      const placeholder = "https://pngimage.net/wp-content/uploads/2018/05/apagar-png-5.png";
      let thumbnail = placeholder
      if(serverQueue && serverQueue.currentSong)
      {
        if (api) {
          thumbnail = (serverQueue.currentSong.fpreview ? serverQueue.currentSong.fpreview.url : serverQueue.currentSong.preview?.url) || placeholder
        } else {
          thumbnail = serverQueue.currentSong.preview?.url || placeholder;
        }
      }
      return thumbnail;
    }

    if (api) {
      return {
        status: getPlayingStatus(),
        title:  getCurrentSong() ? getCurrentSong().split('|')[0] : 'Title',
        author: getAuthor() ? getAuthor() : 'Author',
        time: getSongPosition(api),
        thumb: getThumbnail(api),
        url: (serverQueue && serverQueue.currentSong) ? serverQueue.currentSong.url : null,
        driver: 'ytdl'
      }
    }

    const embed = {
      color: 0x0099ff,
      title: 'Current player state:',
      url: 'https://discord.js.org',
      author: {
        name: 'Some name',
        icon_url: 'https://i.imgur.com/AfFp7pu.png',
        url: 'https://discord.js.org',
      },
      description: 'Some description here',
      thumbnail: {
        url: 'https://i.imgur.com/AfFp7pu.png',
      },
      fields: [
        {
          name: 'Status',
          value: getPlayingStatus(),
        },
        {
          name: 'Current song',
          value: getCurrentSong(),
        },
        {
          name: 'Position',
          value: getSongPosition(false),
        },
        {
          name: 'Songs left',
          value: getSongsLeft(),
        }
      ],
      image: {
        url: 'https://i.imgur.com/AfFp7pu.png',
      },
      timestamp: new Date(),
      footer: {
        text: 'Some footer text here',
        icon_url: 'https://i.imgur.com/AfFp7pu.png',
      },
    };

    // const embed = new MessageEmbed()
    //   .setColor('#0099ff')
    //   .setTitle('Current player state:')
    //   .addFields(
    //     {
    //       name: 'Status',
    //       value: getPlayingStatus(),
    //     },
    //     {
    //       name: 'Current song',
    //       value: getCurrentSong(),
    //     },
    //     {
    //       name: 'Position',
    //       value: getSongPosition(),
    //     },
    //     {
    //       name: 'Songs left',
    //       value: getSongsLeft(),
    //     }
    //   )
    //   .setTimestamp();
    
      
    if(getPlayingStatus() == 'Not started.') {
      embed.thumbnail = { url: getThumbnail(false) }
    }else{
      embed.image = { url: getThumbnail(false) };
      if(getCurrentSong() !== 'None' && serverQueue?.currentSong) {
        embed.url = serverQueue.currentSong.url;
      }
    }
    
    console.log(embed)
    serverQueue?.textChannel.send({ content: 'Status', embeds: [embed] });
  }
  
  shortDescription = (): string => {
    return 'Music provider';
  }

  detailedDescription = (): string => {
    return `Use this provider to listen to music.
    Available commands: \`play\`, \`skip\`, \`pause\`, \`stop\`, \`status\`.
    
    Usage: \`\`\`
  >music play {youtube video or playlist link}

  >music status

  >music skip

  >music skip 1-5\`\`\``;
  }

}


export default Music;
