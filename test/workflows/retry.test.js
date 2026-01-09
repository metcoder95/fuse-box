import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { Workflows, FuseBox } from '../../index.js'

const Retry = Workflows.Retry

describe('Retry Workflow', () => {
  test('Should validate that options are valid', () => {
    assert.throws(() => new Retry({ retries: -1 }))
    assert.throws(() => new Retry({ delay: '-1' }))
    assert.throws(() => new Retry({ backoff: 0 }))
    assert.throws(() => new Retry({ maxDelay: 0.123 }))
    assert.ok(new Retry({ retries: 1 }))
    assert.ok(new Retry({ delay: 10 }))
    assert.ok(new Retry({ backoff: 3 }))
    assert.ok(new Retry({ maxDelay: 100 }))
  })

  test('Should create a Retry workflow with default options', async () => {
    let counter = 0
    const retryWorkflow = new Retry()
    const workload = () => {
      if (++counter < 2) {
        throw new Error('Failing workload')
      }
      return 42
    }
    const instance = new FuseBox().addWorkflows(retryWorkflow).protect(workload)

    assert.equal(await instance(), 42)
    assert.equal(counter, 2)
  })

  test('Should exhaust retries and fail', async () => {
    let counter = 0
    const retryWorkflow = new Retry()
    const workload = () => {
      if (++counter < 4) {
        throw new Error('Failing workload')
      }
      return 42
    }
    const instance = new FuseBox().addWorkflows(retryWorkflow).protect(workload)

    await assert.rejects(instance, new Error('Failing workload'))
  })

  test('Should apply custom delays', async () => {
    let counter = 0
    const retryWorkflow = new Retry({ delay: 100 })
    const start = Date.now()
    const marks = []
    const workload = () => {
      switch (++counter) {
        case 1: {
          throw new Error('Failing workload')
        }
        case 2: {
          marks.push([Date.now() - start, Date.now()])
          throw new Error('Failing workload')
        }
        default: {
          if (counter < 4) {
            marks.push([Date.now() - marks[marks.length - 1][1], Date.now()])
            throw new Error('Failing workload')
          }
        }
      }

      return 42
    }
    const instance = new FuseBox().addWorkflows(retryWorkflow).protect(workload)

    await assert.rejects(instance, new Error('Failing workload'))

    for (const [mark] of marks) {
      assert.ok(mark >= 100, `Expected delay of at least 100ms, got ${mark}ms`)
    }
  })
})
