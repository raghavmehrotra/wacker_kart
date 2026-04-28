import Phaser from "phaser";
import { PrototypeScene } from "./scenes/PrototypeScene.js";

export function createGame(parentId) {
  return new Phaser.Game({
    type: Phaser.AUTO,
    parent: parentId,
    width: 960,
    height: 540,
    backgroundColor: "#0b0f14",
    physics: {
      default: "arcade",
      arcade: {
        debug: false,
      },
    },
    scene: [PrototypeScene],
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
  });
}
