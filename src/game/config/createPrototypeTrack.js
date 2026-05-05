import Phaser from "phaser";

export function createPrototypeTrack() {
  const southboundLine = [
    new Phaser.Math.Vector2(1450, 620),
    new Phaser.Math.Vector2(1510, 1120),
    new Phaser.Math.Vector2(1820, 1650),
    new Phaser.Math.Vector2(1710, 1960),
    new Phaser.Math.Vector2(1460, 2280),
    new Phaser.Math.Vector2(1590, 2860),
    new Phaser.Math.Vector2(1410, 3220),
  ];

  const bottomTurnLine = [
    new Phaser.Math.Vector2(1410, 3220),
    new Phaser.Math.Vector2(1400, 3420),
    new Phaser.Math.Vector2(1290, 3550),
    new Phaser.Math.Vector2(1110, 3560),
    new Phaser.Math.Vector2(980, 3450),
    new Phaser.Math.Vector2(960, 3220),
  ];

  const northboundLine = [
    new Phaser.Math.Vector2(960, 3220),
    new Phaser.Math.Vector2(900, 2830),
    new Phaser.Math.Vector2(760, 2440),
    new Phaser.Math.Vector2(640, 2100),
    new Phaser.Math.Vector2(860, 1640),
    new Phaser.Math.Vector2(840, 1120),
    new Phaser.Math.Vector2(930, 620),
  ];

  const topTurnLine = [
    new Phaser.Math.Vector2(930, 620),
    new Phaser.Math.Vector2(950, 430),
    new Phaser.Math.Vector2(1050, 320),
    new Phaser.Math.Vector2(1210, 275),
    new Phaser.Math.Vector2(1380, 320),
    new Phaser.Math.Vector2(1440, 460),
    new Phaser.Math.Vector2(1450, 620),
  ];

  return {
    worldWidth: 2600,
    worldHeight: 4000,
    totalLaps: 3,
    roadHalfWidth: 42,
    shoulderHalfWidth: 62,
    trackPolylines: [
      southboundLine,
      bottomTurnLine,
      northboundLine,
      topTurnLine,
    ],
    finishLine: new Phaser.Geom.Rectangle(872, 690, 120, 28),
    southTurnaround: new Phaser.Geom.Rectangle(1010, 3390, 390, 170),
    spawnPoint: new Phaser.Math.Vector2(1450, 760),
    treeObstacles: [
      { x: 1490, y: 2860, radius: 34 },
    ],
    malortPickupDurationMs: 5000,
    malortPickups: [
      { x: 1715, y: 1885, radius: 24 },
      { x: 700, y: 2270, radius: 24 },
    ],
  };
}
