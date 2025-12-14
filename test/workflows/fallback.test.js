import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { Workflows, FuseBox } from '../../index.js'

const Fallback = Workflows.Fallback

describe('Fallback Workflow', () => {
  test('Should validate that options are valid', () => {
    assert.throws(() => new Fallback({ value: undefined }))
    assert.throws(() => new Fallback({ value: null }))
    assert.throws(() => new Fallback({}))
    assert.throws(() => new Fallback({ value: 42, handleAbort: 'yes' }))
  })

  test('Should provide a fallback in case of a failure', async () => {
    const workload = () => {
      throw new Error('Failure')
    }
    const instance = new FuseBox()
      .addWorkflows([Fallback({ value: 42 })])
      .protect(workload)
    const instance2 = new FuseBox()
      .addWorkflows([Fallback({ value: async () => 42 })])
      .protect(workload)
    const instance3 = new FuseBox()
      .addWorkflows([Fallback({ value: () => 42 })])
      .protect(workload)
    const instance4 = new FuseBox()
      .addWorkflows([Fallback({ value: () => Promise.resolve(42) })])
      .protect(workload)

    assert.equal(await instance(), 42)
    assert.equal(await instance2(), 42)
    assert.equal(await instance3(), 42)
    assert.equal(await instance4(), 42)
  })

  test('Should not provide a fallback if operation succeeded', async () => {
    const workload = () => {
      return 42
    }
    const instance = new FuseBox()
      .addWorkflows([Fallback({ value: 84 })])
      .protect(workload)

    assert.equal(await instance(), 42)
  })
})
