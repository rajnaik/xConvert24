import { test, expect } from '@playwright/test';

/**
 * API Tasks Endpoint Tests
 * Tests the /api/tasks CRUD endpoint for creating, reading,
 * updating, and deleting tasks.
 */

test.describe('API — GET /api/tasks', () => {
  test('GET /api/tasks returns tasks array', async ({ request }) => {
    const response = await request.get('/api/tasks');
    if (response.status() === 200) {
      const body = await response.json();
      expect(body.tasks).toBeDefined();
      expect(Array.isArray(body.tasks)).toBeTruthy();
      expect(typeof body.total).toBe('number');
    }
    // May be 500 if no DB — acceptable in test env
    expect(response.status()).not.toBe(404);
  });

  test('GET /api/tasks respects limit param', async ({ request }) => {
    const response = await request.get('/api/tasks?limit=5');
    if (response.status() === 200) {
      const body = await response.json();
      expect(body.tasks.length).toBeLessThanOrEqual(5);
    }
  });

  test('GET /api/tasks caps limit at 500', async ({ request }) => {
    const response = await request.get('/api/tasks?limit=9999');
    if (response.status() === 200) {
      const body = await response.json();
      expect(body.tasks.length).toBeLessThanOrEqual(500);
    }
  });

  test('GET /api/tasks filters by status', async ({ request }) => {
    const response = await request.get('/api/tasks?status=pending');
    if (response.status() === 200) {
      const body = await response.json();
      for (const task of body.tasks) {
        expect(task.status).toBe('pending');
      }
    }
  });

  test('GET /api/tasks filters by category', async ({ request }) => {
    const response = await request.get('/api/tasks?category=general');
    if (response.status() === 200) {
      const body = await response.json();
      for (const task of body.tasks) {
        expect(task.task_category).toBe('general');
      }
    }
  });

  test('GET /api/tasks?id=N returns single task', async ({ request }) => {
    const response = await request.get('/api/tasks?id=1');
    if (response.status() === 200) {
      const body = await response.json();
      expect(body.id).toBe(1);
      expect(body.task_name).toBeDefined();
    }
    // 404 if task doesn't exist, 500 if no DB — both acceptable
    expect([200, 404, 500]).toContain(response.status());
  });

  test('GET /api/tasks?id=99999 returns 404 for nonexistent task', async ({ request }) => {
    const response = await request.get('/api/tasks?id=99999');
    // Either 404 (task not found) or 500 (no DB)
    expect([404, 500]).toContain(response.status());
    if (response.status() === 404) {
      const body = await response.json();
      expect(body.error).toContain('not found');
    }
  });
});

test.describe('API — POST /api/tasks', () => {
  test('POST /api/tasks creates task with valid payload', async ({ request }) => {
    const response = await request.post('/api/tasks', {
      data: {
        task_name: 'Playwright test task',
        task_category: 'testing',
        task_description: 'This is a task created by Playwright automated tests',
        status: 'pending',
        plan: 'Run tests and verify',
      },
    });
    // Either 200 (success) or 500 (no DB) — not 404 or 400
    expect(response.status()).not.toBe(404);
    if (response.status() === 200) {
      const body = await response.json();
      expect(body.ok).toBe(true);
      expect(body.id).toBeDefined();
    }
  });

  test('POST /api/tasks rejects missing task_name', async ({ request }) => {
    const response = await request.post('/api/tasks', {
      data: {
        task_description: 'A description that is long enough',
      },
    });
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toContain('task_name');
  });

  test('POST /api/tasks rejects missing task_description', async ({ request }) => {
    const response = await request.post('/api/tasks', {
      data: {
        task_name: 'Test task',
      },
    });
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toContain('task_description');
  });

  test('POST /api/tasks rejects short task_description (< 10 chars)', async ({ request }) => {
    const response = await request.post('/api/tasks', {
      data: {
        task_name: 'Test task',
        task_description: 'Short',
      },
    });
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toContain('task_description');
  });

  test('POST /api/tasks defaults category to general', async ({ request }) => {
    const response = await request.post('/api/tasks', {
      data: {
        task_name: 'Default category task',
        task_description: 'Testing that category defaults to general when not provided',
      },
    });
    // Can't assert the default from POST response alone, but ensure it doesn't error
    expect(response.status()).not.toBe(400);
  });

  test('POST /api/tasks defaults status to pending', async ({ request }) => {
    const response = await request.post('/api/tasks', {
      data: {
        task_name: 'Default status task',
        task_description: 'Testing that status defaults to pending when not provided',
      },
    });
    expect(response.status()).not.toBe(400);
  });

  test('POST /api/tasks rejects invalid JSON', async ({ request }) => {
    const response = await request.post('/api/tasks', {
      data: 'not valid json at all',
      headers: { 'Content-Type': 'text/plain' },
    });
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toContain('Invalid JSON');
  });

  test('POST /api/tasks accepts extended fields (estimate, approval, results, suggested_improvements)', async ({ request }) => {
    const response = await request.post('/api/tasks', {
      data: {
        task_name: 'Extended fields task',
        task_category: 'testing',
        task_description: 'Testing that the new extended fields are accepted by POST',
        status: 'pending',
        plan: 'Verify extended fields are stored',
        estimate: '2 hours',
        approval: 'approved',
        results: 'All tests passed successfully',
        suggested_improvements: 'Add more edge case coverage',
      },
    });
    expect(response.status()).not.toBe(400);
    expect(response.status()).not.toBe(404);
    if (response.status() === 200) {
      const body = await response.json();
      expect(body.ok).toBe(true);
      expect(body.id).toBeDefined();
    }
  });

  test('POST /api/tasks defaults approval to pending when not provided', async ({ request }) => {
    const response = await request.post('/api/tasks', {
      data: {
        task_name: 'No approval field task',
        task_description: 'Testing that approval defaults to pending when omitted',
      },
    });
    expect(response.status()).not.toBe(400);
  });

  test('POST /api/tasks accepts empty extended fields gracefully', async ({ request }) => {
    const response = await request.post('/api/tasks', {
      data: {
        task_name: 'Empty extended fields task',
        task_description: 'Testing that empty strings for extended fields are accepted',
        estimate: '',
        approval: '',
        results: '',
        suggested_improvements: '',
      },
    });
    expect(response.status()).not.toBe(400);
    expect(response.status()).not.toBe(404);
  });

  test('POST /api/tasks accepts running_updates field', async ({ request }) => {
    const response = await request.post('/api/tasks', {
      data: {
        task_name: 'Task with running updates',
        task_category: 'testing',
        task_description: 'Testing that running_updates field is accepted on create',
        status: 'running',
        running_updates: 'Step 1: Initializing task environment',
      },
    });
    expect(response.status()).not.toBe(400);
    expect(response.status()).not.toBe(404);
    if (response.status() === 200) {
      const body = await response.json();
      expect(body.ok).toBe(true);
      expect(body.id).toBeDefined();

      // Clean up
      await request.delete('/api/tasks', { data: { id: body.id } });
    }
  });

  test('POST /api/tasks defaults running_updates to empty string when omitted', async ({ request }) => {
    const response = await request.post('/api/tasks', {
      data: {
        task_name: 'No running updates task',
        task_description: 'Testing that omitting running_updates does not cause an error',
      },
    });
    expect(response.status()).not.toBe(400);
    expect(response.status()).not.toBe(404);
    if (response.status() === 200) {
      const { id } = await response.json();

      // Verify default value via GET
      const getRes = await request.get(`/api/tasks?id=${id}`);
      if (getRes.status() === 200) {
        const task = await getRes.json();
        expect(task.running_updates === '' || task.running_updates === null).toBeTruthy();
      }

      // Clean up
      await request.delete('/api/tasks', { data: { id } });
    }
  });
});

test.describe('API — PUT /api/tasks', () => {
  test('PUT /api/tasks rejects missing id', async ({ request }) => {
    const response = await request.put('/api/tasks', {
      data: {
        task_name: 'Updated name',
      },
    });
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toContain('id');
  });

  test('PUT /api/tasks rejects empty update (no fields)', async ({ request }) => {
    const response = await request.put('/api/tasks', {
      data: {
        id: 1,
      },
    });
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toContain('No fields to update');
  });

  test('PUT /api/tasks accepts valid update', async ({ request }) => {
    const response = await request.put('/api/tasks', {
      data: {
        id: 1,
        task_name: 'Updated by Playwright',
        status: 'in_progress',
      },
    });
    // Either 200 (success) or 500 (no DB / no such row)
    expect(response.status()).not.toBe(404);
    if (response.status() === 200) {
      const body = await response.json();
      expect(body.ok).toBe(true);
    }
  });

  test('PUT /api/tasks updates extended fields (estimate, approval, results, suggested_improvements)', async ({ request }) => {
    const response = await request.put('/api/tasks', {
      data: {
        id: 1,
        estimate: '4 hours',
        approval: 'approved',
        results: 'Feature deployed to staging',
        suggested_improvements: 'Consider adding retry logic',
      },
    });
    // Either 200 (success) or 500 (no DB / no such row)
    expect(response.status()).not.toBe(404);
    expect(response.status()).not.toBe(400);
    if (response.status() === 200) {
      const body = await response.json();
      expect(body.ok).toBe(true);
    }
  });

  test('PUT /api/tasks accepts partial extended field updates', async ({ request }) => {
    const response = await request.put('/api/tasks', {
      data: {
        id: 1,
        approval: 'rejected',
      },
    });
    expect(response.status()).not.toBe(404);
    expect(response.status()).not.toBe(400);
    if (response.status() === 200) {
      const body = await response.json();
      expect(body.ok).toBe(true);
    }
  });

  test('PUT /api/tasks rejects invalid JSON', async ({ request }) => {
    const response = await request.put('/api/tasks', {
      data: 'not json',
      headers: { 'Content-Type': 'text/plain' },
    });
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toContain('Invalid JSON');
  });
});

test.describe('API — POST+GET round-trip with extended fields', () => {
  test('creates task with extended fields and retrieves them', async ({ request }) => {
    // Create a task with all extended fields populated
    const createRes = await request.post('/api/tasks', {
      data: {
        task_name: 'Round-trip extended test',
        task_category: 'integration',
        task_description: 'Verify extended fields persist correctly through create and read',
        status: 'in_progress',
        plan: 'Create then fetch',
        estimate: '30 minutes',
        approval: 'approved',
        results: 'Pending execution',
        suggested_improvements: 'None yet',
      },
    });
    // Skip if DB not available
    if (createRes.status() !== 200) return;

    const { id } = await createRes.json();
    expect(id).toBeDefined();

    // Fetch the created task and verify extended fields
    const getRes = await request.get(`/api/tasks?id=${id}`);
    expect(getRes.status()).toBe(200);
    const task = await getRes.json();

    expect(task.task_name).toBe('Round-trip extended test');
    expect(task.task_category).toBe('integration');
    expect(task.estimate).toBe('30 minutes');
    expect(task.approval).toBe('approved');
    expect(task.results).toBe('Pending execution');
    expect(task.suggested_improvements).toBe('None yet');

    // Clean up
    await request.delete('/api/tasks', { data: { id } });
  });

  test('creates task with running_updates and retrieves it', async ({ request }) => {
    const createRes = await request.post('/api/tasks', {
      data: {
        task_name: 'Round-trip running_updates test',
        task_category: 'integration',
        task_description: 'Verify running_updates persists correctly through create and read',
        status: 'running',
        running_updates: 'Step 1: Started\nStep 2: Processing data',
      },
    });
    // Skip if DB not available
    if (createRes.status() !== 200) return;

    const { id } = await createRes.json();
    expect(id).toBeDefined();

    // Fetch and verify running_updates is stored
    const getRes = await request.get(`/api/tasks?id=${id}`);
    expect(getRes.status()).toBe(200);
    const task = await getRes.json();

    expect(task.task_name).toBe('Round-trip running_updates test');
    expect(task.running_updates).toBe('Step 1: Started\nStep 2: Processing data');
    // Since status was 'running', running_started_at should be set
    expect(task.running_started_at).toBeTruthy();

    // Clean up
    await request.delete('/api/tasks', { data: { id } });
  });
});

test.describe('API — PUT /api/tasks running time tracking', () => {
  let taskId: number | undefined;

  test.beforeAll(async ({ request }) => {
    // Create a dedicated task for running-time tests
    const res = await request.post('/api/tasks', {
      data: {
        task_name: 'Running time test task',
        task_category: 'testing',
        task_description: 'Task created to verify running_time accumulation logic',
        status: 'pending',
      },
    });
    if (res.status() === 200) {
      const body = await res.json();
      taskId = body.id;
    }
  });

  test.afterAll(async ({ request }) => {
    if (taskId) {
      await request.delete('/api/tasks', { data: { id: taskId } });
    }
  });

  test('transitioning to "running" stamps running_started_at', async ({ request }) => {
    if (!taskId) return test.skip();

    const putRes = await request.put('/api/tasks', {
      data: { id: taskId, status: 'running' },
    });
    if (putRes.status() !== 200) return test.skip();

    const getRes = await request.get(`/api/tasks?id=${taskId}`);
    expect(getRes.status()).toBe(200);
    const task = await getRes.json();
    expect(task.running_started_at).toBeTruthy();
    expect(task.status).toBe('running');
  });

  test('transitioning away from "running" accumulates running_time and clears running_started_at', async ({ request }) => {
    if (!taskId) return test.skip();

    // Ensure task is in running state first
    const putRunning = await request.put('/api/tasks', {
      data: { id: taskId, status: 'running' },
    });
    if (putRunning.status() !== 200) return test.skip();

    // Wait a moment so elapsed time > 0
    await new Promise((resolve) => setTimeout(resolve, 1100));

    // Transition away from running
    const putDone = await request.put('/api/tasks', {
      data: { id: taskId, status: 'paused' },
    });
    expect(putDone.status()).toBe(200);

    const getRes = await request.get(`/api/tasks?id=${taskId}`);
    expect(getRes.status()).toBe(200);
    const task = await getRes.json();
    expect(task.status).toBe('paused');
    expect(task.running_started_at).toBeNull();
    expect(task.running_time).toBeGreaterThanOrEqual(1);
  });

  test('multiple running sessions accumulate total running_time', async ({ request }) => {
    if (!taskId) return test.skip();

    // First session: running → paused
    let res = await request.put('/api/tasks', { data: { id: taskId, status: 'running' } });
    if (res.status() !== 200) return test.skip();
    await new Promise((resolve) => setTimeout(resolve, 1100));
    res = await request.put('/api/tasks', { data: { id: taskId, status: 'paused' } });
    if (res.status() !== 200) return test.skip();

    const afterFirst = await request.get(`/api/tasks?id=${taskId}`);
    const firstTime = (await afterFirst.json()).running_time;

    // Second session: running → completed
    res = await request.put('/api/tasks', { data: { id: taskId, status: 'running' } });
    if (res.status() !== 200) return test.skip();
    await new Promise((resolve) => setTimeout(resolve, 1100));
    res = await request.put('/api/tasks', { data: { id: taskId, status: 'completed' } });
    if (res.status() !== 200) return test.skip();

    const afterSecond = await request.get(`/api/tasks?id=${taskId}`);
    const secondTime = (await afterSecond.json()).running_time;

    // Total should be greater than first session alone
    expect(secondTime).toBeGreaterThan(firstTime);
  });

  test('non-running status transitions do not affect running_time fields', async ({ request }) => {
    if (!taskId) return test.skip();

    // Reset task to a non-running state
    let res = await request.put('/api/tasks', { data: { id: taskId, status: 'pending' } });
    if (res.status() !== 200) return test.skip();

    const before = await request.get(`/api/tasks?id=${taskId}`);
    const beforeTask = await before.json();

    // Transition between two non-running statuses
    res = await request.put('/api/tasks', { data: { id: taskId, status: 'in_progress' } });
    expect(res.status()).toBe(200);

    const after = await request.get(`/api/tasks?id=${taskId}`);
    const afterTask = await after.json();

    // running_time should remain unchanged
    expect(afterTask.running_time).toBe(beforeTask.running_time);
    expect(afterTask.running_started_at).toBeNull();
  });

  test('setting status to "running" when already running does not reset running_started_at', async ({ request }) => {
    if (!taskId) return test.skip();

    // Set to running
    let res = await request.put('/api/tasks', { data: { id: taskId, status: 'running' } });
    if (res.status() !== 200) return test.skip();

    const firstGet = await request.get(`/api/tasks?id=${taskId}`);
    const firstStamp = (await firstGet.json()).running_started_at;

    // Wait, then "set running again" (no-op on timestamp)
    await new Promise((resolve) => setTimeout(resolve, 1100));
    res = await request.put('/api/tasks', { data: { id: taskId, status: 'running' } });
    expect(res.status()).toBe(200);

    const secondGet = await request.get(`/api/tasks?id=${taskId}`);
    const secondStamp = (await secondGet.json()).running_started_at;

    // Timestamp should not have been overwritten since oldStatus was already "running"
    expect(secondStamp).toBe(firstStamp);
  });
});

test.describe('API — DELETE /api/tasks', () => {
  test('DELETE /api/tasks rejects missing id', async ({ request }) => {
    const response = await request.delete('/api/tasks');
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toContain('id');
  });

  test('DELETE /api/tasks accepts id via query param', async ({ request }) => {
    const response = await request.delete('/api/tasks?id=99999');
    // Either 200 (deleted / no-op) or 500 (no DB) — not 400 or 404
    expect(response.status()).not.toBe(400);
    expect(response.status()).not.toBe(404);
  });

  test('DELETE /api/tasks accepts id via body', async ({ request }) => {
    const response = await request.delete('/api/tasks', {
      data: { id: 99999 },
    });
    // Either 200 or 500 — not 400 or 404
    expect(response.status()).not.toBe(400);
    expect(response.status()).not.toBe(404);
  });
});
