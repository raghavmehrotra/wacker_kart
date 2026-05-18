import Phaser from "phaser";
import { Car } from "../entities/Car.js";
import { getTrackById, getSelectedTrackId } from "../config/createTrackCatalog.js";
import { customization, getKartColor } from "../config/playerCustomization.js";
import { generateKartTexture, generateBicycleTexture } from "../sprites/kartSpriteFactory.js";
import { getAvatarDataUrls } from "../sprites/avatarFactory.js";
import { HudManager } from "../managers/HudManager.js";
import { ItemManager } from "../managers/ItemManager.js";
import { RaceManager } from "../managers/RaceManager.js";
import { TrackManager } from "../managers/TrackManager.js";
import { NpcTrafficManager } from "../managers/NpcTrafficManager.js";
import { supabase } from "../../lib/supabase.js";
import { saveTrackRecord } from "../../lib/db.js";
import { guest } from "../../lib/guestState.js";

export class PrototypeScene extends Phaser.Scene {
  constructor() {
    super("prototype-scene");
  }

  init() {
    this.trackMeta = getTrackById(getSelectedTrackId());
    this.kartColor = getKartColor();
  }

  preload() {
    this.load.tilemapTiledJSON(this.trackMeta.id, this.trackMeta.mapPath);

    // Load avatar images through the Phaser loader so they're ready in create()
    const avatarUrls = getAvatarDataUrls();
    for (const [key, dataUrl] of Object.entries(avatarUrls)) {
      const textureKey = `avatar-${key}`;
      if (!this.textures.exists(textureKey)) {
        this.load.image(textureKey, dataUrl);
      }
    }
  }

  create() {
    const kartTextureKey = this.trackMeta.id === 'hyde-park'
      ? generateBicycleTexture(this, this.kartColor.key, this.kartColor.hex)
      : generateKartTexture(this, this.kartColor.key, this.kartColor.hex);
    const avatarTextureKey = `avatar-${customization.avatarKey}`;
    this._buildScene(kartTextureKey, avatarTextureKey);
  }

  _buildScene(kartTextureKey, avatarTextureKey) {
    const tilemap = this.make.tilemap({ key: this.trackMeta.id });
    this.tilemap = tilemap;

    this.trackManager = new TrackManager(this, tilemap, this.trackMeta.id);
    this.trackManager.drawWorld();

    const spawn = this.trackManager.spawnPoints[0] ?? { x: 1200, y: 760 };

    this.controls = this.input.keyboard.createCursorKeys();
    this.car = new Car(this, spawn.x, spawn.y, Math.PI, { kartTextureKey, avatarTextureKey });
    this.cameraTarget = this.add.zone(this.car.sprite.x, this.car.sprite.y, 1, 1);
    this.restartKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);
    this.startKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.useItemKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.X);

    this.raceManager = new RaceManager({
      totalLaps: this.trackMeta.totalLaps,
      finishLine: this.trackManager.finishLine,
      southTurnaround: this.trackManager.turnaround,
      finishName: this.trackMeta.finishName,
      turnaroundName: this.trackMeta.turnaroundName,
      formatTime: (ms) => this.formatTime(ms),
      onStatusChange: (msg) => this.setStatusMessage(msg),
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session || guest.active) return;
      const userId = session.user.id;
      const trackId = this.trackMeta.id;
      this.raceManager.onRaceFinish = ({ timeMs }) => saveTrackRecord(userId, trackId, timeMs);
    });

    this.itemManager = new ItemManager(this, {
      pickups: this.trackManager.itemPickups,
      onStatusChange: (msg) => this.setStatusMessage(msg),
    });
    this.itemManager.drawPickups();
    this.itemManager.initStaticPizzas(this.trackMeta.pizzaObstacles ?? []);
    this.itemManager.reset(this.car);

    const NPC_TRACKS = ["lower-wacker", "ohare", "hyde-park"];
    this.npcTraffic = NPC_TRACKS.includes(this.trackMeta.id)
      ? new NpcTrafficManager(this, this.trackMeta.id)
      : null;
    this.playerStunMs = 0;

    this.hudManager = new HudManager(this, this.trackMeta.totalLaps);

    this.cameras.main.setBounds(0, 0, tilemap.widthInPixels, tilemap.heightInPixels);
    this.cameras.main.startFollow(this.cameraTarget, true, 0.12, 0.12);
    this.cameras.main.setZoom(1);
    this.cameras.main.setRoundPixels(false);
    this.cameras.main.rotation = -this.car.rotation;
    this.hudManager.configureCamera();
    this.setStatusMessage(`Press Space to begin the ${this.trackMeta.name} run.`);
  }

  update(_, delta) {
    const dt = Math.min(delta / 1000, 0.033);

    if (Phaser.Input.Keyboard.JustDown(this.restartKey)) {
      this.scene.restart();
      return;
    }

    if (!this.raceManager.raceStarted && Phaser.Input.Keyboard.JustDown(this.startKey)) {
      this.raceManager.startRace();
    }

    if (this.raceManager.raceStarted && !this.raceManager.raceFinished) {
      this.raceManager.tick(delta);
      this.playerStunMs = Math.max(0, this.playerStunMs - delta);
      const activeControls = this.playerStunMs > 0
        ? { up: { isDown: false }, down: { isDown: false }, left: { isDown: false }, right: { isDown: false } }
        : this.controls;
      this.car.update(dt, activeControls);
      this.car.keepInBounds(this.tilemap.widthInPixels, this.tilemap.heightInPixels);
      this.trackManager.applyTrackSurface(this.car, dt);

      if (Phaser.Input.Keyboard.JustDown(this.useItemKey)) {
        this.itemManager.tryUseHeldItem(this.car);
      }

      if (this.trackManager.hitTreeObstacle(this.car.getBounds())) {
        this.car.bounceToPreviousPosition();
        this.car.speed = 0;
        this.setStatusMessage("Tree collision. You stopped on impact.");
      }

      this.itemManager.update(delta, this.car);

      if (this.npcTraffic) {
        const hit = this.npcTraffic.update(delta, this.car);
        if (hit && this.playerStunMs <= 0) {
          this.car.speed = 0;
          this.playerStunMs = 1500;
          this.setStatusMessage("Crash! Watch the traffic.");
        }
      }

      this.raceManager.updateProgress(this.car.getBounds());
    } else {
      this.car.applySurfaceDrag(320 * dt);
    }

    const speedRatio = Math.min(Math.abs(this.car.speed) / this.car.getMaxForwardSpeed(), 1);
    const lookAheadDistance = Phaser.Math.Linear(110, 220, speedRatio);
    this.cameraTarget.x = this.car.sprite.x + Math.sin(this.car.rotation) * lookAheadDistance;
    this.cameraTarget.y = this.car.sprite.y - Math.cos(this.car.rotation) * lookAheadDistance;

    const targetRotation = -this.car.rotation;
    const angleDiff = Phaser.Math.Angle.Wrap(targetRotation - this.cameras.main.rotation);
    this.cameras.main.rotation += angleDiff * Math.min(1, 2.5 * dt);

    this.hudManager.render({
      displayedLap: this.raceManager.getDisplayedLap(),
      elapsedMs: this.raceManager.elapsedMs,
      speed: this.car.speed,
      heldItemLabel: this.itemManager.getHeldItemLabel(),
      effectTimerLabel: this.itemManager.getEffectTimerLabel(),
      formatTime: (ms) => this.formatTime(ms),
    });
  }

  setStatusMessage(message) {
    const statusNode = document.getElementById("race-status");
    if (statusNode) statusNode.textContent = message;
  }

  formatTime(elapsedMs) {
    const totalCs = Math.floor(elapsedMs / 10);
    const minutes = Math.floor(totalCs / 6000);
    const seconds = Math.floor((totalCs % 6000) / 100);
    const centiseconds = totalCs % 100;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${String(centiseconds).padStart(2, "0")}`;
  }
}
