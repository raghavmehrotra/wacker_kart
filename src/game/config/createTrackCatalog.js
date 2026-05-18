const TRACKS = [
  {
    id: "lake-shore-drive",
    name: "Lake Shore Drive",
    routeDescription: "Race from Navy Pier south to 50th Street and back up the lakefront.",
    mapPath: "maps/lake-shore-drive.tmj",
    totalLaps: 3,
    finishName: "Navy Pier",
    turnaroundName: "50th Street",
    pizzaObstacles: [
      { x: 1450, y: 1100, radius: 24 },
      { x: 1510, y: 1960, radius: 24 },
      { x: 1580, y: 2720, radius: 24 },
      { x: 880,  y: 1520, radius: 24 },
      { x: 810,  y: 2450, radius: 24 },
    ],
  },
  {
    id: "hyde-park",
    name: "UChicago Quad",
    routeDescription: "Circuit the gothic campus — straight east and west legs around the central green, with the Midway at the south turn.",
    mapPath: "maps/hyde-park.tmj",
    totalLaps: 3,
    finishName: "Reynolds Club",
    turnaroundName: "Midway Plaisance",
    pizzaObstacles: [
      { x: 1750, y: 900,  radius: 24 },
      { x: 1750, y: 1800, radius: 24 },
      { x: 1750, y: 2700, radius: 24 },
      { x: 750,  y: 1200, radius: 24 },
      { x: 750,  y: 2500, radius: 24 },
    ],
  },
  {
    id: "ohare",
    name: "O'Hare",
    routeDescription: "Full-throttle on two parallel runways — straight-line speed with a short terminal loop at the top and cargo curve at the bottom.",
    mapPath: "maps/ohare.tmj",
    totalLaps: 3,
    finishName: "Terminal 1",
    turnaroundName: "Cargo South",
    pizzaObstacles: [
      { x: 1700, y: 900,  radius: 24 },
      { x: 1700, y: 2200, radius: 24 },
      { x: 1700, y: 3300, radius: 24 },
      { x: 700,  y: 1400, radius: 24 },
      { x: 700,  y: 2800, radius: 24 },
    ],
  },
  {
    id: "lower-wacker",
    name: "Wacker Drive",
    routeDescription: "Start underground on Lower Wacker, burst up onto Upper Wacker's open-air streets, then dive back into the tunnel.",
    mapPath: "maps/lower-wacker.tmj",
    totalLaps: 3,
    finishName: "Tribune Building",
    turnaroundName: "Canal St",
    pizzaObstacles: [
      { x: 1520, y: 860,  radius: 24 },
      { x: 1480, y: 1910, radius: 24 },
      { x: 1510, y: 2620, radius: 24 },
      { x: 800,  y: 1560, radius: 24 },
      { x: 820,  y: 2560, radius: 24 },
      { x: 800,  y: 3210, radius: 24 },
    ],
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
