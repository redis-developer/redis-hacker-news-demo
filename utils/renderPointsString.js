export default function renderPointsString(points) {
  if (points > 1 || points < -1 || !points) {
    return "points"
  } else {
    return "point"
  }
}
