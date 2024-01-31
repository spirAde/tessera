import { isTest } from '../config';

export function getRandomString(length = 8) {
  return isTest ? '' : Array.from({ length }, () => (~~(Math.random() * 36)).toString(36)).join('');
}
