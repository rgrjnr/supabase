import { isResponseOk } from 'lib/common/fetch'
import { IS_PLATFORM } from 'lib/constants'
import { NextApiHandler, NextApiResponse } from 'next'
import { NextRequest } from 'next/server'
import { apiAuthenticate } from './apiAuthenticate copy'

// Purpose of this apiWrapper is to function like a global catchall for ANY errors
// It's a safety net as the API service should never drop, nor fail

export default async function apiWrapper(
  req: NextRequest,
  res: NextApiResponse,
  handler: NextApiHandler,
  options?: { withAuth: boolean }
) {
  try {
    const { withAuth } = options || {}

    if (IS_PLATFORM && withAuth) {
      const response = await apiAuthenticate(req)
      if (!isResponseOk(response)) {
        throw new Error(`Unauthorized: ${response.error.message}`)
      } else {
        // Attach user information to request parameters
        ;(req as any).user = response
      }
    }

    // const func = wrapApiHandlerWithSentry(handler, req.url || '')
    // @ts-ignore
    return await handler(req)
  } catch (error) {
    return res.status(500).json({ error })
  }
}
