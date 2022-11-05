import btoa from 'btoa';
import fetch from 'node-fetch';
import { CallbackProps } from '../../types';

type AuthUser = {
  id: string,
  username: string,
  avatar: string,
  avatar_decoration: string | null,
  discriminator: string | number,
  public_flags: number,
  flags: number,
  banner: string,
  banner_color: string,
  accent_color: number,
  locale: string,
  mfa_enabled: boolean,
  premium_type: number,
  email: string,
  verified: boolean,
}

const getUser = async (accessToken: string, tokenType: string): Promise<AuthUser> => {
  const us = (await (await fetch('https://discord.com/api/users/@me', {
    headers: {
      Authorization: `${tokenType} ${accessToken}`
    }
  })).json().catch(console.error))
  console.log(us)
  return us as AuthUser
}

export default async function auth_discord({ db, user, accessToken, tokenType }: CallbackProps) {
  if (!accessToken || !tokenType) {
    console.error('Please provide accessToken and its type')
    return
  }
  console.log('Oauth callback', accessToken)
  const incomeUser: AuthUser = await getUser(accessToken, tokenType);
  // console.log(incomeUser)
  const updatedUser = (await db.collection('users').updateOne({
    id: incomeUser.id
  }, {
    '$set': {
      ...incomeUser,
      avatar: incomeUser.avatar,
      accessToken,
      tokenType
    }
  }, {
    upsert: true
  }))
  console.log(updatedUser)
  if (updatedUser && (updatedUser.matchedCount === 1)) {
    const uret = await db.collection('users').findOne({
      id: incomeUser.id
    })
    console.log('URET', uret)
    return [ 'user', uret ]
  }
  return [ 'err', 'Something went wrong' ]
  // return [ 'user', updatedUser ]
        // .then(response => {
        //   const { username, discriminator } = response
        //   console.log(`${username}#${discriminator}`, response)
        //   this.$socket.client.emit('action', { method: 'incomeUser', incomeUser: response })
        // })
        // .catch(console.error)
  // const redirect_uri = 'http://localhost:8080/'
  // const creds = btoa(`${process.env.CLIENT_ID}:${process.env.CLIENT_SECRET}`);
  // console.log(creds)
  // const link = `https://discordapp.com/api/oauth2/token?grant_type=authorization_code&code=${code}&redirect_uri=${redirect_uri}`
  // console.log(link)
  // const response = await fetch(link,
  //   {
  //     method: 'POST',
  //     headers: {
  //       Authorization: `Basic ${creds}`,
  //     },
  //   });
  // const json = await response.json();

  // console.log(json)

  // // const user = db.collection('users').find()
  // return ['token', json.access_token ]  
}