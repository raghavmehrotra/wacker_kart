import Phaser from "phaser";

export class TrackManager {
  constructor(scene, track) {
    this.scene = scene;
    this.track = track;
  }

  drawWorld() {
    const {
      worldWidth,
      worldHeight,
      trackPolylines,
      shoulderHalfWidth,
      roadHalfWidth,
      finishLine,
      southTurnaround,
      laneMarkPoints,
      mapLabels,
      sceneryTrees,
    } = this.track;

    const land = this.scene.add.graphics();
    land.fillStyle(0x5f9151, 1);
    land.fillRect(0, 0, worldWidth, worldHeight);

    const skyWater = this.scene.add.graphics();
    skyWater.fillStyle(0x7ed1f5, 1);
    skyWater.fillRect(1560, 0, worldWidth - 1560, worldHeight);

    const shoreline = this.scene.add.graphics();
    shoreline.fillStyle(0xa4dcb0, 1);
    shoreline.fillPoints(
      [
        new Phaser.Math.Vector2(1560, 0),
        new Phaser.Math.Vector2(1700, 0),
        new Phaser.Math.Vector2(1710, 550),
        new Phaser.Math.Vector2(1800, 1200),
        new Phaser.Math.Vector2(1700, 1950),
        new Phaser.Math.Vector2(1810, 2720),
        new Phaser.Math.Vector2(1630, 3380),
        new Phaser.Math.Vector2(1700, worldHeight),
        new Phaser.Math.Vector2(1560, worldHeight),
      ],
      true,
      true,
    );

    const parks = this.scene.add.graphics();
    parks.fillStyle(0x7dbb63, 1);
    parks.fillRoundedRect(1110, 480, 280, 380, 70);
    parks.fillRoundedRect(720, 980, 460, 620, 100);
    parks.fillRoundedRect(1310, 1180, 250, 460, 80);
    parks.fillRoundedRect(760, 1940, 430, 650, 140);
    parks.fillRoundedRect(1260, 2540, 250, 340, 80);
    parks.fillRoundedRect(700, 3020, 720, 480, 140);

    const grid = this.scene.add.graphics();
    grid.lineStyle(1, 0xffffff, 0.05);
    for (let x = 0; x <= worldWidth; x += 96) {
      grid.lineBetween(x, 0, x, worldHeight);
    }
    for (let y = 0; y <= worldHeight; y += 96) {
      grid.lineBetween(0, y, worldWidth, y);
    }

    const road = this.scene.add.graphics();
    for (const polyline of trackPolylines) {
      this.drawPolylineStroke(road, polyline, shoulderHalfWidth * 2, 0x6f685d);
    }
    for (const polyline of trackPolylines) {
      this.drawPolylineStroke(road, polyline, roadHalfWidth * 2, 0xd5ccbe);
    }
    for (const polyline of trackPolylines) {
      this.drawPolylineStroke(road, polyline, 4, 0xf4e3a2, 0.65);
    }

    const laneMarks = this.scene.add.graphics();
    laneMarks.lineStyle(3, 0xffffff, 0.7);
    laneMarks.strokePoints(laneMarkPoints, false, false);

    this.drawCheckerboardLine(finishLine.x, finishLine.y, 15, 4, 8);

    const labelStyle = {
      color: "#f5f1e8",
      fontFamily: "Trebuchet MS, sans-serif",
      fontSize: "18px",
    };

    for (const label of mapLabels) {
      this.scene.add.text(label.x, label.y, label.text, labelStyle);
    }

    const skyline = this.scene.add.graphics();
    skyline.fillStyle(0x4a5a6d, 0.95);
    skyline.fillRect(170, 210, 110, 170);
    skyline.fillRect(320, 170, 80, 210);
    skyline.fillRect(430, 130, 95, 250);
    skyline.fillRect(555, 90, 120, 290);
    skyline.fillRect(708, 150, 85, 230);
    skyline.fillRect(825, 190, 100, 190);
    skyline.fillRect(960, 130, 75, 250);

    for (const [x, y, r] of sceneryTrees) {
      this.drawTreeCluster(x, y, r);
    }

    const beach = this.scene.add.graphics();
    beach.fillStyle(0xe6d1a0, 0.85);
    beach.fillPoints(
      [
        new Phaser.Math.Vector2(1610, 740),
        new Phaser.Math.Vector2(1730, 740),
        new Phaser.Math.Vector2(1755, 1240),
        new Phaser.Math.Vector2(1650, 1220),
      ],
      true,
      true,
    );

    const startTurnMarker = this.scene.add.graphics();
    startTurnMarker.lineStyle(4, 0x9fe8ff, 0.9);
    startTurnMarker.strokeRectShape(southTurnaround);

    return malortPickups;
  }

  applyTrackSurface(car, dt) {
    const trackDistance = this.getTrackDistance(car.sprite.x, car.sprite.y);

    if (trackDistance > this.track.shoulderHalfWidth) {
      car.bounceToPreviousPosition();
    } else if (trackDistance > this.track.roadHalfWidth) {
      car.applySurfaceDrag(85 * dt);
    }
  }

  hitTreeObstacle(carBounds) {
    return this.track.treeObstacles.some((tree) => {
      const obstacleBounds = new Phaser.Geom.Rectangle(
        tree.x - tree.radius,
        tree.y - tree.radius,
        tree.radius * 2,
        tree.radius * 2,
      );

      return Phaser.Geom.Intersects.RectangleToRectangle(carBounds, obstacleBounds);
    });
  }

  drawPolylineStroke(graphics, points, width, color, alpha = 1) {
    graphics.lineStyle(width, color, alpha);
    graphics.strokePoints(points, false, false);
  }

  drawTreeCluster(x, y, radius = 18) {
    const crownA = this.scene.add.circle(x, y, radius, 0x4f9555);
    const crownB = this.scene.add.circle(x + radius * 0.55, y - radius * 0.2, radius * 0.78, 0x5aa35c);
    const crownC = this.scene.add.circle(x - radius * 0.45, y - radius * 0.15, radius * 0.7, 0x3f7f47);
    const trunk = this.scene.add.rectangle(x, y + radius * 1.1, radius * 0.28, radius * 0.9, 0x5c4024);

    crownA.setDepth(1);
    crownB.setDepth(1);
    crownC.setDepth(1);
    trunk.setDepth(0);
  }

  drawCheckerboardLine(x, y, cols, rows, tileSize) {
    const graphics = this.scene.add.graphics();
    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        const isLight = (row + col) % 2 === 0;
        graphics.fillStyle(isLight ? 0xffffff : 0x111111, 1);
        graphics.fillRect(x + col * tileSize, y + row * tileSize, tileSize, tileSize);
      }
    }
  }

  pointToSegmentDistance(point, start, end) {
    const segmentX = end.x - start.x;
    const segmentY = end.y - start.y;
    const segmentLengthSquared = segmentX * segmentX + segmentY * segmentY;

    if (segmentLengthSquared === 0) {
      return Phaser.Math.Distance.Between(point.x, point.y, start.x, start.y);
    }

    const projection = Phaser.Math.Clamp(
      ((point.x - start.x) * segmentX + (point.y - start.y) * segmentY) / segmentLengthSquared,
      0,
      1,
    );

    const closestX = start.x + projection * segmentX;
    const closestY = start.y + projection * segmentY;

    return Phaser.Math.Distance.Between(point.x, point.y, closestX, closestY);
  }

  getTrackDistance(x, y) {
    let minDistance = Number.POSITIVE_INFINITY;
    const point = new Phaser.Math.Vector2(x, y);

    for (const polyline of this.track.trackPolylines) {
      for (let i = 0; i < polyline.length - 1; i += 1) {
        const distance = this.pointToSegmentDistance(point, polyline[i], polyline[i + 1]);
        minDistance = Math.min(minDistance, distance);
      }
    }

    return minDistance;
  }
}
