import type { Document } from './documents'

export function fixedGetDocument(documents: Document[], userId: string, documentId: string) {
  // ИСПРАВЛЕНО: владелец из серверной сессии входит в условие поиска.
  return documents.find((document) => document.id === documentId && document.ownerId === userId) ?? null
}
