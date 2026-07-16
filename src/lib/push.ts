import { supabase } from './supabase'
import { VAPID_PUBLIC_KEY } from './config'

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const base64Safe = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64Safe)
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)))
}

export async function pushSupported(): Promise<boolean> {
  return 'serviceWorker' in navigator && 'PushManager' in window
}

export async function enablePush(): Promise<boolean> {
  if (!(await pushSupported())) return false

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') return false

  const registration = await navigator.serviceWorker.ready
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
  })

  const { data } = await supabase.auth.getSession()
  const userId = data.session?.user.id
  if (!userId) return false

  const json = subscription.toJSON()
  await supabase.from('push_subscriptions').upsert(
    { user_id: userId, endpoint: json.endpoint, keys: json.keys },
    { onConflict: 'endpoint' },
  )
  return true
}

export async function pushEnabled(): Promise<boolean> {
  if (!(await pushSupported())) return false
  const registration = await navigator.serviceWorker.ready
  const subscription = await registration.pushManager.getSubscription()
  return !!subscription
}
