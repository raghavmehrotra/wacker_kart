const TRACKS = [
  {
    id: "lake-shore-drive",
    name: "Lake Shore Drive",
    routeDescription: "Race from Navy Pier south to 50th Street and back up the lakefront.",
    mapPath: "maps/lake-shore-drive.tmj",
    totalLaps: 3,
    finishName: "Navy Pier",
    turnaroundName: "50th Street",
  },
  {
    id: "hyde-park",
    name: "Hyde Park",
    routeDescription: "Run a tighter south side circuit around the Midway and campus edge.",
    mapPath: "maps/hyde-park.tmj",
    totalLaps: 3,
    finishName: "Midway Gate",
    turnaroundName: "Promontory Point",
  },
  {
    id: "ohare",
    name: "O'Hare",
    routeDescription: "Blast around wide airport service roads and runway-side straights.",
    mapPath: "maps/ohare.tmj",
    totalLaps: 3,
    finishName: "Terminal 1",
    turnaroundName: "Cargo South",
  },
  {
    id: "lower-wacker",
    name: "Lower Wacker",
    routeDescription: "Thread under downtown through tighter ramps, walls, and tunnel turns.",
    mapPath: "maps/lower-wacker.tmj",
    totalLaps: 3,
    finishName: "Wabash Ramp",
    turnaroundName: "Canal Slip",
  },
];

let selectedTrackId = "lake-shore-drive";

export function getTrackOptions() {
  return TRACKS.map(({ id, name, routeDescription }) => ({ id, name, routeDescription }));
}

export function getTrackById(id) {
  return TRACKS.find((t) => t.id === id) ?? TRACKS[0];
}

export function setSelectedTrackId(id) {
  selectedTrackId = id;
}

export function getSelectedTrackId() {
  return selectedTrackId;
}
