import { json } from '@remix-run/node'

/**
 * Creates a new instance of forwarder.
 *
 * @param config - The configuration object.
 * @param config.baseUrl - The base url of the API.
 * @param config.errorHandler - The function to call when a forwarder error occurs.
 * @returns A new instance of forwarder.
 */
export default function createForwarder({
  baseUrl,
  errorHandler,
  setupHeaders,
}: {
  baseUrl: string
  errorHandler?: (error: Response) => Response
  setupHeaders?: (request: Request) => Promise<Headers>
}) {
  return {
    /**
     * Forward an action to the given endpoint.
     *
     * @param options - The options to forward.
     * @param options.request - The request to forward.
     * @param options.to - The endpoint to forward to.
     * @param options.transform - A function to transform the response.
     * @returns Promise<Response> - The response from the forward.
     */
    forwardAction: async <Data>({
      request,
      to,
      transform,
    }: {
      request: Request
      to: string
      transform?: (result: Data) => Promise<Response>
    }) => {
      const body = await request.formData()

      const response = await fetch(baseUrl + to, {
        method: request.method,
        headers: setupHeaders ? await setupHeaders(request) : request.headers,
        body,
      })

      if (!response.ok) {
        return errorHandler ? errorHandler(response) : response
      }

      return transform ? transform(await response.json()) : response
    },

    /**
     * Forward a loader to the given set of endpoints.
     *
     * @param options - The options to forward.
     * @param options.request - The request to forward.
     * @param options.to - A set of endpoints to forward to.
     * @param options.transform - A function to transform the response.
     * @returns Promise<Response> - The response from the forward.
     */
    forwardLoader: async <Data = any>({
      request,
      to,
      transform,
    }: {
      request: Request
      to: Record<keyof Data, string>
      transform?: (result: Data) => Promise<Response>
    }) => {
      const data: any = {}

      for (const [key, url] of Object.entries<string>(to)) {
        const urlWithParameters = url.replace(
          /:([a-zA-Z0-9_]+)/g,
          (_, name: string) => new URL(request.url).searchParams.get(name) || ''
        )

        const response = await fetch(baseUrl + urlWithParameters, {
          method: request.method,
          headers: setupHeaders ? await setupHeaders(request) : request.headers,
        })

        if (!response.ok) {
          return errorHandler ? errorHandler(response) : response
        }

        data[key] = await response.json()
      }

      return transform ? transform(data) : json(data)
    },
  }
}
