import test from 'node:test';
import assert from 'node:assert/strict';

test('CI Sanity Check (Always Passes)', () => {
  assert.strictEqual(1 + 1, 2, 'Math works!');
});

test('CI Gatekeeper Check (Toggle to Pass or Fail)', () => {
  // Set to true to test a CI failure (or pass SIMULATE_FAILURE=true in CI env)
  // const shouldFail = process.env.SIMULATE_FAILURE === 'true';
   const shouldFail = true ;

  assert.strictEqual(
    shouldFail,
    false,
    '❌ Simulated test failure! CI/CD deployment should be blocked.'
  );
});
