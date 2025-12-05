'use strict'
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'

describe('FuseBox API', () => {
  test('should import FuseBox and Workflows', async t => {
    const {
      default: FuseBox,
      FuseBox: NamedFuseBox,
      Workflows
    } = await import('../index.js')

    assert.strictEqual(
      FuseBox,
      NamedFuseBox,
      'Default and named FuseBox should be the same'
    )
    assert.ok(Workflows, 'Workflows should be defined')
    assert.ok(Workflows.Retry, 'Retry workflow should be defined')
    assert.ok(Workflows.Fallback, 'Fallback workflow should be defined')
    assert.ok(
      Workflows.CircuitBreaker,
      'CircuitBreaker workflow should be defined'
    )
  })

  test('should create an instance of FuseBox (default)', async () => {
    const { default: FuseBox, Workflows } = await import('../index.js')
    const fusebox = new FuseBox()
    assert.ok(
      fusebox instanceof FuseBox,
      'fusebox should be an instance of FuseBox'
    )
    assert.ok(
      fusebox.addWorkflows(Workflows.CircuitBreaker(), Workflows.Retry())
    )
    assert.ok(
      fusebox.addWorkflows([Workflows.CircuitBreaker(), Workflows.Retry()])
    )
    assert.ok(fusebox.protect(() => {}))
  })

  test('should create an instance of FuseBox (named)', async () => {
    const { FuseBox, Workflows } = await import('../index.js')
    const fusebox = new FuseBox()
    assert.ok(
      fusebox instanceof FuseBox,
      'fusebox should be an instance of FuseBox'
    )
    assert.ok(
      fusebox.addWorkflows(Workflows.CircuitBreaker(), Workflows.Retry())
    )
    assert.ok(
      fusebox.addWorkflows([Workflows.CircuitBreaker(), Workflows.Retry()])
    )
    assert.ok(fusebox.protect(() => {}))
  })
})
