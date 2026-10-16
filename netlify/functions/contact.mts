// Принимает сообщение из формы на сайте и пересылает его в Telegram.
// Нужны переменные окружения: TELEGRAM_BOT_TOKEN и TELEGRAM_CHAT_ID.
export default async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 })
  }

  const token = Netlify.env.get('TELEGRAM_BOT_TOKEN')
  const chatId = Netlify.env.get('TELEGRAM_CHAT_ID')
  if (!token || !chatId) {
    console.error('TELEGRAM_BOT_TOKEN или TELEGRAM_CHAT_ID не заданы')
    return Response.json({ ok: false, error: 'not_configured' }, { status: 500 })
  }

  let data: FormData
  try {
    data = await req.formData()
  } catch {
    return Response.json({ ok: false, error: 'bad_request' }, { status: 400 })
  }

  const field = (key: string, max: number) => String(data.get(key) ?? '').trim().slice(0, max)

  // Поле-ловушка: люди его не видят, боты заполняют. Делаем вид, что всё ок.
  if (field('bot-field', 100)) {
    return Response.json({ ok: true })
  }

  const name = field('name', 100)
  const email = field('email', 200)
  const message = field('message', 3500)

  if (!name || !email || !message || !/^\S+@\S+\.\S+$/.test(email)) {
    return Response.json({ ok: false, error: 'invalid' }, { status: 400 })
  }

  const text = `📬 Новое сообщение с портфолио\n\n👤 ${name}\n✉️ ${email}\n\n${message}`

  const tg = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, disable_web_page_preview: true }),
  })

  if (!tg.ok) {
    console.error('Ошибка Telegram API:', tg.status, await tg.text())
    return Response.json({ ok: false, error: 'telegram' }, { status: 502 })
  }

  return Response.json({ ok: true })
}

export const config = {
  path: '/api/contact',
}
