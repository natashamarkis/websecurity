import type { Document } from './documents'

export function getDocument(documents: Document[], userId: string, documentId: string) {
  // УЯЗВИМО: факт входа не означает, что пользователю принадлежит любой документ.
  if (!userId) return null
  return documents.find((document) => document.id === documentId) ?? null
}
