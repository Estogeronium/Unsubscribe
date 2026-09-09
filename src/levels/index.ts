import type { Level } from "../engine/types";
import { level01 } from "./level-01-settings";
import { level02 } from "./level-02-cookies";
import { level03 } from "./level-03-sure";
import { level04 } from "./level-04-discount";
import { level05 } from "./level-05-survey";
import { level06 } from "./level-06-chatbot";
import { level07 } from "./level-07-captcha";
import { level08 } from "./level-08-operator";
import { level09 } from "./level-09-smscode";
import { level10 } from "./level-10-puzzle";
import { level11 } from "./level-11-slider";
import { level12 } from "./level-12-terms";
import { level13 } from "./level-13-maze";
import { level14 } from "./level-14-unbundle";
import { level15 } from "./level-15-founder";
import { level16 } from "./level-16-downgrade";
import { level17 } from "./level-17-handwriting";
import { level18 } from "./level-18-hold";
import { level19 } from "./level-19-timing";
import { level20 } from "./level-20-almost";
import { ending } from "./level-99-fortune";

// Order = the run. The ending must stay last (Game treats levels.at(-1) as the finale).
export const levels: Level[] = [
  level01,
  level02,
  level03,
  level04,
  level05,
  level06,
  level07,
  level08,
  level09,
  level10,
  level11,
  level12,
  level13,
  level14,
  level15,
  level16,
  level17,
  level18,
  level19,
  level20,
  ending,
];
