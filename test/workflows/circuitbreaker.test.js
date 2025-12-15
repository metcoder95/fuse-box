import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { Workflows } from '../../index.js'

const CircuitBreaker = Workflows.CircuitBreaker

describe('CircuitBreaker Workflow', () => {
  test('Should validate that options are valid', () => {
    assert.throws(() => CircuitBreaker({ attempts: -1 }))
    assert.throws(() => CircuitBreaker({ successAttempts: 0 }))
    assert.throws(() => CircuitBreaker({ timeout: '-100' }))
    assert.ok(CircuitBreaker({ attempts: 1 }))
    assert.ok(CircuitBreaker({ successAttempts: 1 }))
    assert.ok(CircuitBreaker({ timeout: 100 }))
  })

  test(
    'Should create a Retry workflow with default options',
    { todo: true },
    async () => {
      //   let counter = 0
      //   const retryWorkflow = new CircuitBreaker()
      //   const workload = () => {
      //     if (++counter < 2) {
      //       throw new Error('Failing workload')
      //     }
      //     return 42
      //   }
      //   const instance = new FuseBox()
      //     .addWorkflows(retryWorkflow)
      //     .protect(workload)
      //   assert.equal(await instance(), 42)
      //   assert.equal(counter, 2)
    }
  )
})
