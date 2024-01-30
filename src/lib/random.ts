export function getRandomString(length = 8) {
  return Array.from({ length }, () => (~~(Math.random() * 36)).toString(36)).join('');
}
