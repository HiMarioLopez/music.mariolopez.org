import { v7 } from 'uuid';

export function generateUUID(): string {
  return v7();
}
