import { expect, it } from 'vitest'

import createForwarder from './index'

it('should create the correct instance of forwarder', () => {
  const forwarder = createForwarder({
    baseUrl: 'http://localhost:8000',
  })

  expect(forwarder).toBeTruthy()
})
