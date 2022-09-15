import { ICommand } from './types';
import Music from './comms/Music';
import Help from './comms/Help';
import Admin from './comms/Admin';

export interface Commands {
  // [key: string]: ICommand
  music: Music,
  help: Help,
  admin: Admin
}

const commands: Commands = {
  music: new Music(),
  help: new Help(),
  admin: new Admin(),
};


export default commands;
