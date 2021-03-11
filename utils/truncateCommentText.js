export default function truncateCommentText(string) {
  if (string.length > 80) {
    return string.substring(0, 77) + "..."
  } else {
    return string
  }
}
