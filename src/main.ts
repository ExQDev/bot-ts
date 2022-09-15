import 'reflect-metadata';
import { dirname, importx } from '@discordx/importer'
import type { Interaction, Message, MessageReaction, PartialMessageReaction, PartialUser, User } from 'discord.js'

import { Server } from 'http'
import { Server as SockServ } from 'socket.io'
import express from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'
import dotenv from 'dotenv'
import ffmpeg from 'fluent-ffmpeg'
import fs from 'fs'

import bot from './utils/bot'
import commands from './commands'
import methods from './api/index'
import client, { connection } from './utils/db'
import { Db } from 'mongodb'
import ytdl from 'ytdl-core'
import { Callback, CallbackProps, DsUser } from './types'
import { fileURLToPath } from 'url';

// const __filename = fileURLToPath(import.meta.url);

const __dirname = dirname(import.meta.url);


// import { IntentsBitField } from 'discord.js';
// import { Client } from 'discordx';

// export const bot = new Client({
//   botGuilds: [(client) => client.guilds.cache.map((guild) => guild.id)],

//   // Discord intents
//   intents: [
//     IntentsBitField.Flags.Guilds,
//     IntentsBitField.Flags.GuildMembers,
//     IntentsBitField.Flags.GuildMessages,
//     IntentsBitField.Flags.GuildMessageReactions,
//     IntentsBitField.Flags.GuildVoiceStates,
//     IntentsBitField.Flags.GuildMessageTyping,
//     IntentsBitField.Flags.DirectMessageTyping,
//     IntentsBitField.Flags.GuildPresences
//   ],

//   // Debug logs are disabled in silent mode
//   silent: false,

//   // Configuration for @SimpleCommand
//   simpleCommand: {
//     prefix: '>',
//   },
// })

const app = express()
app.use(cors())
app.use(bodyParser.json())
app.use(express.static(__dirname+'/public/'))
const http = new Server(app);
const srv = new SockServ(http, {
  cors: {
    origin: true,
    methods: ["GET", "POST"]
  }
});
dotenv.config()

const convertVideo = (xs: any, format: string) => {
  const convertedFilePath = `${xs}.${format}`;
  return new Promise((resolve, reject) => {
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

bot.once('ready', async () => {
  await bot.guilds.fetch();
  await bot.initApplicationCommands();
  console.log("Bot started");
})

bot.on("interactionCreate", (interaction: Interaction) => {
  bot.executeInteraction(interaction);
});

bot.on("messageCreate", (message: Message) => {
  bot.executeCommand(message);
});

// bot.on("messageReactionAdd", (reaction: PartialMessageReaction | MessageReaction, user: PartialUser | User) => {
//   console.log('reaction', user.toString())
//   commands.admin.onReact(user, reaction)
// })

// bot.on("messageReactionRemove", (reaction: PartialMessageReaction | MessageReaction, user: PartialUser | User) => {
//   console.log('unreaction', user.toString())
//   commands.admin.onUndoReact(user, reaction)
// })

async function run() {
  if(!process.env.TOKEN) {
    console.error('No bot token provided')
    process.exit(1)
  }
  const db: Db = connection //(await client.connect()).db('latte')
  for(const cmd in commands) {
    /* @ts-ignore */
    commands[cmd].init(bot, db)
  }
  const token: string = process.env.TOKEN || ''

  app.get('/', function(req, res){
    console.log('Its trying get me!')
    res.sendFile(__dirname+'/templates/successful_login.html')
  });

  app.get('/auth/discord', async (req, res) => { 
   const token = await methods.auth({db, code: req.query.code?.toString() })
  //  console.log(token) 
   return token
  }, function(req, res){
    res.sendFile(__dirname+'/templates/successful_login.html')
  });

  app.get('/api/gettrack/:gid', async (req, res) => {
    const guildId = req.params.gid
    const servQ = commands.music.queue.get(guildId)
    console.log('GETTRACK')
    if (servQ && servQ.currentSong) {
      if(fs.existsSync(__dirname+'/public/'+servQ.currentSong.videoId+'.mp3')) {
        res.send(servQ.currentSong.videoId+'.mp3');
        return
      }
    
      const writeStream = fs.createWriteStream(__dirname+'/public/'+servQ.currentSong.videoId+'.webm');
      const stream = ytdl(servQ.currentSong.url, {
        quality: 'lowestaudio',
        highWaterMark: 1 << 25
      })
      .on('progress', (ln, dd, dl) => {
        console.log(ln, dd, dl)
      })
      .on('end', async function() {
        console.log(servQ.currentSong?.videoId+'.webm')
        new Promise<void>((resolve, reject) => {
          setTimeout( async () => {
            try {
              const vid = await convertVideo(servQ.currentSong?.videoId, 'mp3')
              console.log(vid)
              res.send(vid);
              resolve()
            } catch (e) {
              reject(e)
            }
          }, 500)
        })
      })
      .on('error', () => {
        res.send('error')
        return
      })
      .pipe(writeStream)
    }
  })

  srv.on('error', (reason) => {
    console.error('SRV Error', reason);
  })
  srv.on('connect_error', function(err) {
    console.error('SRV Error', err);
  });
  srv.on('connection', (socket) => {
    console.log('..new connection')
    let user: DsUser;

    socket.on('error', (reason) => {
      console.error('Socket Error', reason);
    })
    socket.on('connect_error', function(err) {
      console.error('Socket Error', err);
    });

    socket.on('disconnect', async (reason) => {
      console.error('Socket Disconnect', reason);
      if(user)
        await db.collection('users').updateOne( { _id: user._id }, { $set: user } );
    })

    socket.on('gettrack', async ({ guildId }) => {
      const servQ = commands.music.queue.get(guildId)
      console.log('GETTRACK')
      if (servQ && servQ.currentSong) {
        if(fs.existsSync(__dirname+'/public/'+servQ.currentSong.videoId+'.mp3')) {
          socket.emit('soundtrack', servQ.currentSong.videoId+'.mp3');
          return
        }
      
        const writeStream = fs.createWriteStream(__dirname+'/public/'+servQ.currentSong.videoId+'.webm');
        const stream = ytdl(servQ.currentSong.url, {
          quality: 'lowestaudio',
          highWaterMark: 1 << 25
        })
        .on('progress', (ln, dd, dl) => {
          console.log(ln, dd, dl)
          socket.emit('audioprogress', { dd, dl })
        })
        .on('end', async function() {
          console.log(servQ.currentSong?.videoId+'.webm')
          const vid = await convertVideo(servQ.currentSong?.videoId, 'mp3')
          console.log(vid)
          socket.emit('soundtrack', vid)
          // res.send(vid);
        })
        .on('error', (err) => {
          socket.emit('error', err)
          return
        })
        .pipe(writeStream)
      }
    })

    socket.on('action', async (originalPayload, cb) => {
      const payload: CallbackProps = {
        ...originalPayload,
        db,
        id: user ? user._id : undefined,
        user: originalPayload.user || user,
        bot,
        commands
      };
      if (payload.method !== 'gettrack')
        console.log('method: ', payload.method)
      
        /* @ts-ignore */
      if (!methods[payload.method]) {
        socket.emit('error', 'Unknown method')
        return
      }
      // console.log('__>USER:', payload.user)
      const requireAuth = [
        'getGuilds',
        'getTriggers',
        'getChannels',
        'gettrack',
        'getsoundtrack',
        'getusers',
        'getRoles',
        'getPrefix'
      ]

      if(requireAuth.includes(originalPayload.method) && !user)
      {
        console.log('original:', originalPayload)
        socket.emit('getuser', originalPayload)
        if(cb)
          cb(originalPayload)
        return
      }

      /* @ts-ignore */
      let result: any[] = await methods[payload.method](payload);
      
      if (result[0] == 'error') {
        console.log(payload.method, result)
      }
      if(result[0] == 'signin-ok' || result[0] == 'user')
        user = result[1];

      // console.log('user:: ', user)
      if(cb)
        cb(result);
      else
        /* @ts-ignore */
        socket.emit(...result);
    })
  });
  // The following syntax should be used in the commonjs environment
  //
  await importx(__dirname + "/{events,tscmds}/**/*.{ts,js}");

  // The following syntax should be used in the ECMAScript environment
  // await importx(dirname(import.meta.url) + "/{events,tscmds}/**/*.{ts,js}");

  // Let's start the bot
  // if (!process.env.BOT_TOKEN) {
  //   throw Error("Could not find BOT_TOKEN in your environment");
  // }

  
  app.listen(process.env.PORT || 80, function(){
    console.log(`listening on 82.193.104.224:${process.env.PORT}`);
  });

  srv.listen(Number.parseInt(process.env.PORT_SOCK||'800'))
  
  bot.on('messageCreate', async (msg: Message) => {
    // TODO: conditional
    if (msg.author.bot) return;

    // console.log('message')
    if (msg.guildId) {
      // console.log('guildId')
      // Guild message
      const triggersOnMessage = await (await db.collection('callbacks').find({
        guild: msg.guildId,
        trigger: 'OnMessage'
      })).toArray()
      let prefix = '>'
      const dbguild = await db.collection('guilds').findOne({
        id: msg.guildId
      })
      const guildPrefix = dbguild?.prefix
      if(guildPrefix)
        prefix = guildPrefix
      // console.log('guild prefix', prefix)
      // console.log('got prefix', msg)
      if (!msg.content.startsWith(prefix) && triggersOnMessage.length === 0) return;
      // console.log('ok')
      if(triggersOnMessage.length > 0) {
        commands.admin.onMessage(msg, triggersOnMessage as Callback[])
      }
      // console.log(msg.guild.id);
      const commandBody = msg.content.slice(prefix.length);
      // console.log(commandBody)
      const args = commandBody.split(' ');
      const command = args.shift()?.toLowerCase();
      // console.log(command)
      if(command) {
        if(command && Object.keys(commands).includes(command)) {
          /* @ts-ignore */
          commands[command].execute(msg)(args);
        }
      }
    }
  })
  // Log in with your bot token
  await bot.login(token);
}

run();