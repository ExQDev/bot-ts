import auth from './methods/auth_discord';
import getoauthurl from './methods/getoauthurl';
import incomeUser from './methods/incomeUser';
import getGuilds from './methods/getguilds';
import getOwnGuilds from './methods/getownguilds';
import getRoles from './methods/getroles';
import getusers from './methods/getusers';
import getChannels from './methods/getChannels';
import getTriggers from './methods/gettriggers';
import saveTrigger from './methods/saveTrigger';
import getPrefix from './methods/getPrefix';
import gettrack from './methods/gettrack';
import getQueue from './methods/getQueue';
import getsoundtrack from './methods/getsoundtrack';
import m_pause from './methods/m_pause';
import m_play from './methods/m_play';
import m_stop from './methods/m_stop';
import m_next from './methods/m_next';
import m_seek from './methods/m_seek';
import setPrefix from './methods/setPrefix';
import deleteTrigger from './methods/deleteTrigger';
import signin from './methods/signin';
import generateInvite from './methods/generateInvite';
import getGreets from './methods/getGreets';
import setGreets from './methods/setGreets';

export default { 
  auth,
  getoauthurl,
  incomeUser,
  getGuilds,
  getOwnGuilds,
  getTriggers,
  getRoles,
  getusers,
  getChannels,
  getPrefix,
  setPrefix,
  getGreets,
  setGreets,
  saveTrigger,
  deleteTrigger,
  signin,
  generateInvite,
  gettrack,
  getQueue,
  m_pause,
  m_play,
  m_stop,
  m_next,
  m_seek,
  getsoundtrack
}