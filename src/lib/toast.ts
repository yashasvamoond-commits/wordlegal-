export interface ToastMsg {
  id: number
  text: string
  kind: 'ok' | 'err' | 'info'
}

type Sub = (msgs: ToastMsg[]) => void

const subs = new Set<Sub>()
let msgs: ToastMsg[] = []
let seq = 1

function emit() {
  subs.forEach((s) => s(msgs))
}

export function toast(text: string, kind: ToastMsg['kind'] = 'info', ms = 2600) {
  const id = seq++
  msgs = [...msgs, { id, text, kind }]
  emit()
  setTimeout(() => {
    msgs = msgs.filter((m) => m.id !== id)
    emit()
  }, ms)
}

export function subscribeToasts(fn: Sub): () => void {
  subs.add(fn)
  fn(msgs)
  return () => subs.delete(fn)
}
