addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

const corsHeaders = allowedOrigin => ({
  'Access-Control-Allow-Origin': allowedOrigin,
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers': '*',
})

const handleCors = async request => {
  const origin = getOrigin(request)
  return new Response('ok', {
    headers: { ...corsHeaders(origin) },
  })
}

const allowedOrigin = ['http://localhost:3000', 'https://photon.pages.dev']

const getOrigin = request => {
  const origin = request.headers.get('Origin')
  const allowedRequest = allowedOrigin.find(host => host === origin)
  return allowedRequest || allowedOrigin[0]
}

const getImagesFromService = async (request, query) => {
  console.log('getImagesFromService')
  const response = await fetch(
    `https://api.unsplash.com/search/photos/?query=${query}&client_id=${UNSPLAS_CLIENT_ID}`,
  )
  const data = await response.json()
  console.log('getImagesFromService response', data.length)
  return data.results.map(
    ({ alt_description, height, id, links, tags, urls, width }) => ({
      altDescription: alt_description,
      height,
      id,
      links,
      tags,
      urls,
      width,
    }),
  )
}
const getImages = async request => {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('query')
  let imageData = await SEARCH_KEYS_KV.get(query)
  if (!imageData) {
    const data = await getImagesFromService(request, query)
    imageData = JSON.stringify(data)
    await SEARCH_KEYS_KV.put(query, imageData)
  } else {
    console.log('getImages data from cache', query)
  }

  return new Response(imageData, {
    headers: {
      'content-type': 'application/json',
      ...corsHeaders(getOrigin(request)),
    },
  })
}
/**
 * Respond with hello worker text
 * @param {Request} request
 */
async function handleRequest(request) {
  if (request.method === 'OPTIONS') {
    return handleCors(request)
  }
  if (request.method === 'GET') {
    // return new Response('is Get', {
    //   headers: { 'content-type': 'text/plain' },
    // })
    return getImages(request)
  }
}
