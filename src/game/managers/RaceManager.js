import Phaser from "phaser";

export class RaceManager {
  constructor({
    totalLaps,
    finishLine,
    southTurnaround,
    finishName,
    turnaroundName,
    formatTime,
    onStatusChange,
  }) {
    this.totalLaps = totalLaps;
    this.finishLine = finishLine;
    this.southTurnaround = southTurnaround;
    this.finishName = finishName;
    this.turnaroundName = turnaroundName;
    this.formatTime = formatTime;
    this.onStatusChange = onStatusChange;
    this.reset();
  }

  reset() {
    this.completedLaps = 0;
    this.elapsedMs = 0;
    this.raceStarted = false;
    this.raceFinished = false;
    this.reachedSouthTurnaround = false;
    this.wasInsideSouthTurnaround = false;
    this.wasInsideFinishLine = false;
  }

  startRace() {
    if (this.raceStarted) {
      return;
    }

    this.raceStarted = true;
    this.onStatusChange(
      `Race started. Reach ${this.turnaroundName}, then return to ${this.finishName}.`,
    );
  }

  tick(delta) {
    if (!this.raceStarted || this.raceFinished) {
      return;
    }

    this.elapsedMs += delta;
  }

  updateProgress(carBounds) {
    const insideSouthTurnaround = Phaser.Geom.Intersects.RectangleToRectangle(
      carBounds,
      this.southTurnaround,
    );
    const insideFinishLine = Phaser.Geom.Intersects.RectangleToRectangle(carBounds, this.finishLine);

    if (insideSouthTurnaround && !this.wasInsideSouthTurnaround) {
      this.reachedSouthTurnaround = true;
      this.onStatusChange(
        `${this.turnaroundName} reached. Now return to ${this.finishName} and cross the line.`,
      );
    }

    if (insideFinishLine && !this.wasInsideFinishLine && this.reachedSouthTurnaround) {
      this.completeLap();
    } else if (insideFinishLine && !this.wasInsideFinishLine && !this.reachedSouthTurnaround) {
      this.onStatusChange(
        `Reach ${this.turnaroundName} before the ${this.finishName} line can count.`,
      );
    }

    this.wasInsideSouthTurnaround = insideSouthTurnaround;
    this.wasInsideFinishLine = insideFinishLine;
  }

  completeLap() {
    this.completedLaps += 1;

    if (this.completedLaps >= this.totalLaps) {
      this.raceFinished = true;
      this.reachedSouthTurnaround = false;
      this.onStatusChange(`Finished in ${this.formatTime(this.elapsedMs)}. Press R to restart.`);
      return;
    }

    this.reachedSouthTurnaround = false;
    this.onStatusChange(`Lap ${this.completedLaps + 1}. Head south again and loop back north.`);
  }

  getDisplayedLap() {
    if (this.raceFinished) {
      return this.totalLaps;
    }

    return Math.min(this.completedLaps + 1, this.totalLaps);
  }
}
