import seedrandom from "seedrandom";

export function getColour(seed?: string | null) {
  let rng = seedrandom(`${seed?.split("").reverse().join("")}`);
  return (
    "hsl(" +
    360 * rng() +
    "," +
    (25 + 70 * rng()) +
    "%," +
    (85 + 10 * rng()) +
    "%)"
  );
}
