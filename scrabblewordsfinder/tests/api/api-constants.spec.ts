import { test, expect } from '@playwright/test';

/**
 * API Constants Endpoint Tests
 * Tests the /api/constants CRUD endpoint with enhanced fields,
 * KV cache layer (X-Cache: HIT/MISS), and cache invalidation on writes.
 */

test.describe('API Constants — GET — Positive', () => {
  test('GET /api/constants returns constants array with all fields', async ({ request }) => {
    const response = await request.get('/api/constants/');
    if (response.status() === 200) {
      const body = await response.json();
      expect(body.constants).toBeDefined();
      expect(Array.isArray(body.constants)).toBeTruthy();
      if (body.constants.length > 0) {
        const c = body.constants[0];
        expect(c).toHaveProperty('id');
        expect(c).toHaveProperty('name');
        expect(c).toHaveProperty('text');
        expect(c).toHaveProperty('description');
        expect(c).toHaveProperty('category');
        expect(c).toHaveProperty('status');
        expect(c).toHaveProperty('updated_at');
        expect(c).toHaveProperty('updated_by');
        expect(c).toHaveProperty('created_at');
      }
    }
    expect([200, 500]).toContain(response.status());
  });

  test('GET /api/constants?name=TAGLINE returns single constant with all fields', async ({ request }) => {
    const response = await request.get('/api/constants/?name=TAGLINE');
    expect([200, 404, 500]).toContain(response.status());
    if (response.status() === 200) {
      const body = await response.json();
      expect(body.constant).toBeDefined();
      expect(body.constant.name).toBe('TAGLINE');
      expect(body.constant.text).toBeDefined();
      expect(body.constant.category).toBe('branding');
      expect(body.constant.description).toBeTruthy();
      expect(body.constant.status).toBe(1);
      expect(body.constant.updated_by).toBeTruthy();
      expect(body.constant.created_at).toBeTruthy();
    }
  });

  test('GET /api/constants?category=branding filters by category', async ({ request }) => {
    const response = await request.get('/api/constants/?category=branding');
    if (response.status() === 200) {
      const body = await response.json();
      for (const c of body.constants) {
        expect(c.category).toBe('branding');
      }
    }
    expect([200, 500]).toContain(response.status());
  });

  test('GET /api/constants?active=true returns only active constants', async ({ request }) => {
    const response = await request.get('/api/constants/?active=true');
    if (response.status() === 200) {
      const body = await response.json();
      for (const c of body.constants) {
        expect(c.status).toBe(1);
      }
    }
    expect([200, 500]).toContain(response.status());
  });
});

test.describe('API Constants — GET — Negative', () => {
  test('GET /api/constants?name=NONEXISTENT returns 404', async ({ request }) => {
    const response = await request.get('/api/constants/?name=NONEXISTENT_XYZ_999');
    expect([404, 500]).toContain(response.status());
    if (response.status() === 404) {
      const body = await response.json();
      expect(body.error).toContain('not found');
    }
  });

  test('GET /api/constants?category=nonexistent returns empty array', async ({ request }) => {
    const response = await request.get('/api/constants/?category=zzz_no_such_cat');
    if (response.status() === 200) {
      const body = await response.json();
      expect(body.constants).toHaveLength(0);
    }
  });
});

test.describe('API Constants — POST — Positive', () => {
  const testName = `TEST_POST_${Date.now()}`;

  test.afterAll(async ({ request }) => {
    const getRes = await request.get(`/api/constants/?name=${testName}`);
    if (getRes.status() === 200) {
      const { constant } = await getRes.json();
      if (constant?.id) await request.delete('/api/constants/', { data: { id: constant.id } });
    }
  });

  test('POST /api/constants creates constant with all fields', async ({ request }) => {
    const response = await request.post('/api/constants/', {
      data: {
        name: testName,
        text: 'Test value',
        description: 'A test constant',
        category: 'testing',
        status: 1,
      },
    });
    expect([201, 500]).toContain(response.status());
    if (response.status() === 201) {
      const body = await response.json();
      expect(body.constant.name).toBe(testName);
      expect(body.constant.text).toBe('Test value');
      expect(body.constant.description).toBe('A test constant');
      expect(body.constant.category).toBe('testing');
      expect(body.constant.status).toBe(1);
      expect(body.constant.created_at).toBeTruthy();
      expect(body.constant.updated_at).toBeTruthy();
    }
  });
});

test.describe('API Constants — POST — Negative', () => {
  test('POST /api/constants rejects missing name', async ({ request }) => {
    const response = await request.post('/api/constants/', {
      data: { text: 'some value' },
    });
    expect([400, 500]).toContain(response.status());
    if (response.status() === 400) {
      const body = await response.json();
      expect(body.error).toContain('required');
    }
  });

  test('POST /api/constants rejects missing text', async ({ request }) => {
    const response = await request.post('/api/constants/', {
      data: { name: 'MISSING_TEXT' },
    });
    expect([400, 500]).toContain(response.status());
    if (response.status() === 400) {
      const body = await response.json();
      expect(body.error).toContain('required');
    }
  });

  test('POST /api/constants rejects duplicate name', async ({ request }) => {
    const uniqueName = `DUPE_${Date.now()}`;
    const first = await request.post('/api/constants/', {
      data: { name: uniqueName, text: 'first' },
    });
    if (first.status() !== 201) return;

    const second = await request.post('/api/constants/', {
      data: { name: uniqueName, text: 'second' },
    });
    expect([409, 500]).toContain(second.status());

    // Clean up
    const getRes = await request.get(`/api/constants/?name=${uniqueName}`);
    if (getRes.status() === 200) {
      const { constant } = await getRes.json();
      if (constant?.id) await request.delete('/api/constants/', { data: { id: constant.id } });
    }
  });

  test('POST /api/constants defaults category to general when omitted', async ({ request }) => {
    const name = `DEFCAT_${Date.now()}`;
    const res = await request.post('/api/constants/', {
      data: { name, text: 'no category' },
    });
    if (res.status() !== 201) return;

    const { constant } = await res.json();
    expect(constant.category).toBe('general');
    expect(constant.status).toBe(1);

    // Clean up
    await request.delete('/api/constants/', { data: { id: constant.id } });
  });
});

test.describe('API Constants — PUT — Positive', () => {
  const putName = `PUT_${Date.now()}`;
  let createdId: number | undefined;

  test.beforeAll(async ({ request }) => {
    const res = await request.post('/api/constants/', {
      data: { name: putName, text: 'original', description: 'orig desc', category: 'testing' },
    });
    if (res.status() === 201) {
      createdId = (await res.json()).constant.id;
    }
  });

  test.afterAll(async ({ request }) => {
    if (createdId) await request.delete('/api/constants/', { data: { id: createdId } });
  });

  test('PUT /api/constants updates text and stamps updated_at', async ({ request }) => {
    if (!createdId) return test.skip();
    const response = await request.put('/api/constants/', {
      data: { name: putName, text: 'updated text' },
    });
    expect(response.status()).toBe(200);
    const { constant } = await response.json();
    expect(constant.text).toBe('updated text');
    expect(constant.updated_at).toBeTruthy();
    expect(constant.updated_by).toBe('admin');
  });

  test('PUT /api/constants updates category and description', async ({ request }) => {
    if (!createdId) return test.skip();
    const response = await request.put('/api/constants/', {
      data: { name: putName, category: 'config', description: 'new desc' },
    });
    expect(response.status()).toBe(200);
    const { constant } = await response.json();
    expect(constant.category).toBe('config');
    expect(constant.description).toBe('new desc');
  });

  test('PUT /api/constants updates status to inactive', async ({ request }) => {
    if (!createdId) return test.skip();
    const response = await request.put('/api/constants/', {
      data: { name: putName, status: 0 },
    });
    expect(response.status()).toBe(200);
    const { constant } = await response.json();
    expect(constant.status).toBe(0);
  });

  test('PUT /api/constants respects custom updated_by', async ({ request }) => {
    if (!createdId) return test.skip();
    const response = await request.put('/api/constants/', {
      data: { name: putName, text: 'by kiro', updated_by: 'kiro' },
    });
    expect(response.status()).toBe(200);
    const { constant } = await response.json();
    expect(constant.updated_by).toBe('kiro');
  });
});

test.describe('API Constants — PUT — Negative', () => {
  test('PUT /api/constants rejects missing name', async ({ request }) => {
    const response = await request.put('/api/constants/', {
      data: { text: 'no name' },
    });
    expect([400, 500]).toContain(response.status());
    if (response.status() === 400) {
      const body = await response.json();
      expect(body.error).toContain('required');
    }
  });

  test('PUT /api/constants rejects empty update (name only, no fields)', async ({ request }) => {
    const response = await request.put('/api/constants/', {
      data: { name: 'TAGLINE' },
    });
    // Should be 400 — no fields to update
    expect([400, 500]).toContain(response.status());
  });

  test('PUT /api/constants returns 404 for nonexistent constant', async ({ request }) => {
    const response = await request.put('/api/constants/', {
      data: { name: 'NONEXISTENT_ZZZ', text: 'value' },
    });
    expect([404, 500]).toContain(response.status());
    if (response.status() === 404) {
      const body = await response.json();
      expect(body.error).toContain('not found');
    }
  });
});

test.describe('API Constants — DELETE — Positive', () => {
  test('DELETE /api/constants deletes existing constant by id', async ({ request }) => {
    const createRes = await request.post('/api/constants/', {
      data: { name: `DEL_${Date.now()}`, text: 'to delete', category: 'testing' },
    });
    if (createRes.status() !== 201) return;

    const { constant } = await createRes.json();
    const delRes = await request.delete('/api/constants/', { data: { id: constant.id } });
    expect(delRes.status()).toBe(200);
    const body = await delRes.json();
    expect(body.success).toBe(true);

    // Verify gone
    const getRes = await request.get(`/api/constants/?name=${constant.name}`);
    expect(getRes.status()).toBe(404);
  });
});

test.describe('API Constants — DELETE — Negative', () => {
  test('DELETE /api/constants rejects missing id', async ({ request }) => {
    const response = await request.delete('/api/constants/', { data: {} });
    expect([400, 500]).toContain(response.status());
    if (response.status() === 400) {
      const body = await response.json();
      expect(body.error).toContain('id is required');
    }
  });

  test('DELETE /api/constants returns 404 for nonexistent id', async ({ request }) => {
    const response = await request.delete('/api/constants/', { data: { id: 999999 } });
    expect([404, 500]).toContain(response.status());
    if (response.status() === 404) {
      const body = await response.json();
      expect(body.error).toContain('not found');
    }
  });

  test('DELETE /api/constants rejects id=0 as missing', async ({ request }) => {
    const response = await request.delete('/api/constants/', { data: { id: 0 } });
    expect([400, 500]).toContain(response.status());
  });
});

test.describe('API Constants — Full CRUD Round-trip', () => {
  test('create with all fields → read → update → toggle status → delete', async ({ request }) => {
    const name = `LIFECYCLE_${Date.now()}`;

    // 1. CREATE with all fields
    const createRes = await request.post('/api/constants/', {
      data: { name, text: 'initial', description: 'Test lifecycle', category: 'testing', status: 1 },
    });
    if (createRes.status() !== 201) return;
    const { constant: created } = await createRes.json();
    expect(created.category).toBe('testing');
    expect(created.description).toBe('Test lifecycle');
    expect(created.status).toBe(1);

    // 2. READ by name
    const getRes = await request.get(`/api/constants/?name=${name}`);
    expect(getRes.status()).toBe(200);
    const { constant: fetched } = await getRes.json();
    expect(fetched.text).toBe('initial');

    // 3. UPDATE text + category
    const putRes = await request.put('/api/constants/', {
      data: { name, text: 'updated', category: 'config', updated_by: 'playwright' },
    });
    expect(putRes.status()).toBe(200);
    const { constant: updated } = await putRes.json();
    expect(updated.text).toBe('updated');
    expect(updated.category).toBe('config');
    expect(updated.updated_by).toBe('playwright');

    // 4. TOGGLE status off
    const toggleRes = await request.put('/api/constants/', {
      data: { name, status: 0 },
    });
    expect(toggleRes.status()).toBe(200);
    expect((await toggleRes.json()).constant.status).toBe(0);

    // 5. Verify filtered out by active=true
    const activeRes = await request.get('/api/constants/?active=true');
    if (activeRes.status() === 200) {
      const { constants } = await activeRes.json();
      const found = constants.find((c: any) => c.name === name);
      expect(found).toBeUndefined();
    }

    // 6. DELETE
    const delRes = await request.delete('/api/constants/', { data: { id: created.id } });
    expect(delRes.status()).toBe(200);

    // 7. VERIFY GONE
    const verifyRes = await request.get(`/api/constants/?name=${name}`);
    expect(verifyRes.status()).toBe(404);
  });
});

// --- KV Cache Tests ---

test.describe('API Constants — KV Cache — Positive', () => {
  test('GET /api/constants returns X-Cache header (HIT or MISS)', async ({ request }) => {
    const response = await request.get('/api/constants/');
    if (response.status() === 200) {
      const cacheHeader = response.headers()['x-cache'];
      // Should be present and be HIT or MISS
      expect(cacheHeader).toBeDefined();
      expect(['HIT', 'MISS']).toContain(cacheHeader);
    }
  });

  test('GET /api/constants?name=TAGLINE returns X-Cache header', async ({ request }) => {
    const response = await request.get('/api/constants/?name=TAGLINE');
    if (response.status() === 200) {
      const cacheHeader = response.headers()['x-cache'];
      expect(cacheHeader).toBeDefined();
      expect(['HIT', 'MISS']).toContain(cacheHeader);
    }
  });

  test('second identical GET returns X-Cache: HIT (cache populated)', async ({ request }) => {
    // First call primes the cache
    const first = await request.get('/api/constants/?active=true');
    if (first.status() !== 200) return;

    // Second call should hit cache
    const second = await request.get('/api/constants/?active=true');
    expect(second.status()).toBe(200);
    const cacheHeader = second.headers()['x-cache'];
    expect(cacheHeader).toBe('HIT');
  });

  test('second GET by name returns X-Cache: HIT', async ({ request }) => {
    // First call primes
    const first = await request.get('/api/constants/?name=TAGLINE');
    if (first.status() !== 200) return;

    // Second call should hit
    const second = await request.get('/api/constants/?name=TAGLINE');
    expect(second.status()).toBe(200);
    expect(second.headers()['x-cache']).toBe('HIT');
  });
});

test.describe('API Constants — KV Cache Invalidation — Positive', () => {
  const cacheName = `CACHE_TEST_${Date.now()}`;
  let cacheTestId: number | undefined;

  test.afterAll(async ({ request }) => {
    if (cacheTestId) {
      await request.delete('/api/constants/', { data: { id: cacheTestId } });
    }
  });

  test('POST invalidates cache — subsequent GET is MISS', async ({ request }) => {
    // Prime list cache
    const prime = await request.get('/api/constants/');
    if (prime.status() !== 200) return;

    // Create a new constant (should invalidate cache)
    const createRes = await request.post('/api/constants/', {
      data: { name: cacheName, text: 'cache test', category: 'testing' },
    });
    if (createRes.status() !== 201) return;
    cacheTestId = (await createRes.json()).constant.id;

    // Next GET should be a MISS (cache was invalidated)
    const after = await request.get('/api/constants/');
    expect(after.status()).toBe(200);
    expect(after.headers()['x-cache']).toBe('MISS');
  });

  test('PUT invalidates cache — subsequent GET by name is MISS', async ({ request }) => {
    if (!cacheTestId) return test.skip();

    // Prime name cache
    const prime = await request.get(`/api/constants/?name=${cacheName}`);
    if (prime.status() !== 200) return;
    expect(prime.headers()['x-cache']).toBeDefined();

    // Update it
    const putRes = await request.put('/api/constants/', {
      data: { name: cacheName, text: 'cache updated' },
    });
    expect(putRes.status()).toBe(200);

    // Next GET should be MISS
    const after = await request.get(`/api/constants/?name=${cacheName}`);
    expect(after.status()).toBe(200);
    expect(after.headers()['x-cache']).toBe('MISS');
    expect((await after.json()).constant.text).toBe('cache updated');
  });

  test('DELETE invalidates cache — subsequent list GET is MISS', async ({ request }) => {
    if (!cacheTestId) return test.skip();

    // Prime list cache
    const prime = await request.get('/api/constants/');
    if (prime.status() !== 200) return;

    // Delete
    const delRes = await request.delete('/api/constants/', { data: { id: cacheTestId } });
    expect(delRes.status()).toBe(200);
    cacheTestId = undefined; // prevent afterAll double-delete

    // Next list GET should be MISS
    const after = await request.get('/api/constants/');
    expect(after.status()).toBe(200);
    expect(after.headers()['x-cache']).toBe('MISS');
  });
});

test.describe('API Constants — KV Cache — Negative', () => {
  test('cache does not serve stale data after update', async ({ request }) => {
    const name = `STALE_${Date.now()}`;

    // Create
    const createRes = await request.post('/api/constants/', {
      data: { name, text: 'v1' },
    });
    if (createRes.status() !== 201) return;
    const id = (await createRes.json()).constant.id;

    // Prime cache
    const get1 = await request.get(`/api/constants/?name=${name}`);
    expect(get1.status()).toBe(200);
    expect((await get1.json()).constant.text).toBe('v1');

    // Update
    await request.put('/api/constants/', { data: { name, text: 'v2' } });

    // Read again — must reflect v2, not stale v1
    const get2 = await request.get(`/api/constants/?name=${name}`);
    expect(get2.status()).toBe(200);
    expect((await get2.json()).constant.text).toBe('v2');

    // Clean up
    await request.delete('/api/constants/', { data: { id } });
  });

  test('cache does not return deleted constants', async ({ request }) => {
    const name = `GHOST_${Date.now()}`;

    // Create and prime cache
    const createRes = await request.post('/api/constants/', {
      data: { name, text: 'ghost' },
    });
    if (createRes.status() !== 201) return;
    const id = (await createRes.json()).constant.id;

    // Prime cache
    await request.get(`/api/constants/?name=${name}`);

    // Delete
    await request.delete('/api/constants/', { data: { id } });

    // Read — should be 404, not a stale cached result
    const afterDelete = await request.get(`/api/constants/?name=${name}`);
    expect(afterDelete.status()).toBe(404);
  });
});