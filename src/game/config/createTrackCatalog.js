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
    name: "UChicago Quad",
    routeDescription: "Circuit the gothic campus — straight east and west legs around the central green, with the Midway at the south turn.",
    mapPath: "maps/hyde-park.tmj",
    totalLaps: 3,
    finishName: "Reynolds Club",
    turnaroundName: "Midway Plaisance",
  },
  {
    id: "ohare",
    name: "O'Hare",
    routeDescription: "Full-throttle on two parallel runways — straight-line speed with a short terminal loop at the top and cargo curve at the bottom.",
    mapPath: "maps/ohare.tmj",
    totalLaps: 3,
    finishName: "Terminal 1",
    turnaroundName: "Cargo South",
  },
  {
    id: "lower-wacker",
    name: "Wacker Drive",
    routeDescription: "Start underground on Lower Wacker, burst up onto Upper Wacker's open-air streets, then dive back into the tunnel.",
    mapPath: "maps/lower-wacker.tmj",
    totalLaps: 3,
    finishName: "Tribune Building",
    turnaroundName: "Canal St",
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
