import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { setTimeout as sleep } from 'node:timers/promises'

import { Workflows, FuseBox } from '../../index.js'

const CircuitBreaker = Workflows.CircuitBreaker

describe('CircuitBreaker Workflow', () => {
  test('Should validate that options are valid', () => {
    assert.throws(() => CircuitBreaker({ attempts: -1 }))
    assert.throws(() => CircuitBreaker({ successAttempts: 0 }))
    assert.throws(() => CircuitBreaker({ timeout: '-100' }))
    assert.throws(() => CircuitBreaker({ weight: 1.5 }))
    assert.ok(CircuitBreaker({ attempts: 1 }))
    assert.ok(CircuitBreaker({ successAttempts: 1 }))
    assert.ok(CircuitBreaker({ timeout: 100 }))
    assert.ok(CircuitBreaker({ weight: 0.5 }))
  })

  test('Should create a CircuitBreaker workflow with default options', async () => {
    let counter = 0
    const circuitBreaker = new CircuitBreaker()
    const workload = () => {
      if (++counter < 4) {
        throw new Error('Failing workload')
      }

      return 42
    }
    const instance = new FuseBox().addWorkflows(circuitBreaker).protect(workload)
    await assert.rejects(instance())
    await assert.rejects(instance())
    await assert.rejects(instance())
    await assert.rejects(instance()) // Returns open circuit error
    await sleep(1100) // Wait for timeout
    await assert.equal(await instance(), 42)
    assert.equal(counter, 5)
  })
})
