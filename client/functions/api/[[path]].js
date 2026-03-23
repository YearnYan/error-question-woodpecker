export async function onRequest(context) {
  const url = new URL(context.request.url)
  const targetUrl = `https://error-question-woodpecker-api.vercel.app${url.pathname}${url.search}`

  const headers = new Headers(context.request.headers)
  headers.set('Host', 'error-question-woodpecker-api.vercel.app')

  const response = await fetch(targetUrl, {
    method: context.request.method,
    headers: headers,
    body: context.request.method !== 'GET' && context.request.method !== 'HEAD'
      ? context.request.body
      : undefined,
    redirect: 'follow',
  })

  const newHeaders = new Headers(response.headers)
  newHeaders.set('Access-Control-Allow-Origin', '*')
  newHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  newHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  })
}
