
import * as THREE from 'https://didisoftwares.ddns.net/codepen/module.min.js';  
import { POSTPROCESS } from 'https://didisoftwares.ddns.net/codepen/postprocess.js';
import { EVENTS } from 'https://didisoftwares.ddns.net/codepen/events.js'
import { Terrain } from 'https://didisoftwares.ddns.net/codepen/terrain.js'
  
let game=new gameEngine(THREE, POSTPROCESS, EVENTS, Terrain);
game.init();