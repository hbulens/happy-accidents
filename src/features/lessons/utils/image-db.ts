// Lesson pictures are large data URLs, too big for localStorage. They live in
// IndexedDB keyed by lesson id + image key ("final" or "step-3").

const DB_NAME = 'happy-accidents'
const STORE = 'images'

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') return reject(new Error('IndexedDB unavailable'))
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => req.result.createObjectStore(STORE)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

function keyFor(lessonId: string, key: string): string {
  return `${lessonId}/${key}`
}

export async function putImage(lessonId: string, key: string, dataUrl: string): Promise<void> {
  const db = await open()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).put(dataUrl, keyFor(lessonId, key))
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
  db.close()
}

export async function getImages(lessonId: string): Promise<Record<string, string>> {
  const db = await open()
  const out: Record<string, string> = {}
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly')
    const store = tx.objectStore(STORE)
    const range = IDBKeyRange.bound(`${lessonId}/`, `${lessonId}/￿`)
    const req = store.openCursor(range)
    req.onsuccess = () => {
      const cursor = req.result
      if (!cursor) return resolve()
      out[String(cursor.key).slice(lessonId.length + 1)] = cursor.value as string
      cursor.continue()
    }
    req.onerror = () => reject(req.error)
  })
  db.close()
  return out
}

export async function deleteImages(lessonId: string): Promise<void> {
  const db = await open()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    const store = tx.objectStore(STORE)
    const req = store.openCursor(IDBKeyRange.bound(`${lessonId}/`, `${lessonId}/￿`))
    req.onsuccess = () => {
      const cursor = req.result
      if (!cursor) return resolve()
      cursor.delete()
      cursor.continue()
    }
    req.onerror = () => reject(req.error)
  })
  db.close()
}

export function stepKey(index: number): string {
  return `step-${index}`
}
