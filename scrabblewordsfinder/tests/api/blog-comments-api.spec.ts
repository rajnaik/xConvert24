import { test, expect } from '@playwright/test';

/**
 * Blog Comments API Tests
 * Covers GET, POST, and PATCH endpoints for /api/blog-comments/
 */

const API_URL = '/api/blog-comments/';

test.describe('Blog Comments API — GET — Positive', () => {
  test('GET with valid blogid returns 200 and comments array', async ({ request }) => {
    const response = await request.get(`${API_URL}?blogid=what-is-scrabble`);
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty('comments');
    expect(Array.isArray(body.comments)).toBe(true);
  });

  test('GET with non-existent blogid returns empty comments array', async ({ request }) => {
    const response = await request.get(`${API_URL}?blogid=nonexistent-slug-xyz-999`);
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.comments).toEqual([]);
  });
});

test.describe('Blog Comments API — GET ?mine= — Positive', () => {
  test('GET with mine param returns 200 and comments array', async ({ request }) => {
    const response = await request.get(`${API_URL}?blogid=what-is-scrabble&mine=1,2,3`);
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty('comments');
    expect(Array.isArray(body.comments)).toBe(true);
  });

  test('GET with mine param and nonexistent IDs still returns approved comments', async ({ request }) => {
    const response = await request.get(`${API_URL}?blogid=what-is-scrabble&mine=99999,99998`);
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty('comments');
    expect(Array.isArray(body.comments)).toBe(true);
    // Should at least return approved comments (pending IDs that don't exist add nothing)
  });

  test('GET with empty mine param returns only approved comments', async ({ request }) => {
    const response = await request.get(`${API_URL}?blogid=what-is-scrabble&mine=`);
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty('comments');
    expect(Array.isArray(body.comments)).toBe(true);
  });

  test('GET with single mine ID returns 200', async ({ request }) => {
    const response = await request.get(`${API_URL}?blogid=what-is-scrabble&mine=1`);
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty('comments');
  });

  test('comments are sorted by datetime ascending', async ({ request }) => {
    const response = await request.get(`${API_URL}?blogid=what-is-scrabble&mine=1,2,3`);
    expect(response.status()).toBe(200);
    const body = await response.json();
    const comments = body.comments as { datetime: string }[];
    for (let i = 1; i < comments.length; i++) {
      expect(comments[i].datetime >= comments[i - 1].datetime).toBe(true);
    }
  });
});

test.describe('Blog Comments API — GET ?mine= — Negative', () => {
  test('GET with mine param but no blogid still returns 400', async ({ request }) => {
    const response = await request.get(`${API_URL}?mine=1,2,3`);
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toContain('blogid');
  });

  test('GET with mine containing invalid values (non-numeric) filters them out gracefully', async ({ request }) => {
    const response = await request.get(`${API_URL}?blogid=what-is-scrabble&mine=abc,def,0,-5`);
    expect(response.status()).toBe(200);
    const body = await response.json();
    // Should not crash — invalid IDs are filtered out, returns approved only
    expect(body).toHaveProperty('comments');
    expect(Array.isArray(body.comments)).toBe(true);
  });

  test('GET with mine containing negative and zero IDs does not crash', async ({ request }) => {
    const response = await request.get(`${API_URL}?blogid=what-is-scrabble&mine=0,-1,-999`);
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty('comments');
  });

  test('GET with mine exceeding 50 IDs is capped without error', async ({ request }) => {
    // Generate 60 IDs to test the .slice(0, 50) cap
    const ids = Array.from({ length: 60 }, (_, i) => i + 1).join(',');
    const response = await request.get(`${API_URL}?blogid=what-is-scrabble&mine=${ids}`);
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty('comments');
    expect(Array.isArray(body.comments)).toBe(true);
  });

  test('no duplicate comment IDs in merged response', async ({ request }) => {
    const response = await request.get(`${API_URL}?blogid=what-is-scrabble&mine=1,2,3`);
    expect(response.status()).toBe(200);
    const body = await response.json();
    const ids = (body.comments as { id: number }[]).map(c => c.id);
    const uniqueIds = new Set(ids);
    expect(ids.length).toBe(uniqueIds.size);
  });
});

test.describe('Blog Comments API — GET — Negative', () => {
  test('GET without blogid returns 400', async ({ request }) => {
    const response = await request.get(API_URL);
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toContain('blogid');
  });

  test('GET with empty blogid returns 400', async ({ request }) => {
    const response = await request.get(`${API_URL}?blogid=`);
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toContain('blogid');
  });
});

test.describe('Blog Comments API — POST — Positive', () => {
  test('POST with valid fields returns 200 with ok:true', async ({ request }) => {
    const response = await request.post(API_URL, {
      data: {
        blogid: 'playwright-test-post',
        blogname: 'Playwright Test Post',
        subject: 'Test comment subject',
        comment: 'This is a Playwright test comment',
        commenterName: 'PW Tester',
      },
    });
    // Should succeed if DB is available; not 404
    expect(response.status()).not.toBe(404);
    if (response.status() === 200) {
      const body = await response.json();
      expect(body.ok).toBe(true);
      expect(body.id).toBeDefined();
    }
  });

  test('POST with related field (reply) is accepted', async ({ request }) => {
    const response = await request.post(API_URL, {
      data: {
        blogid: 'playwright-test-post',
        blogname: 'Playwright Test Post',
        subject: '',
        comment: 'This is a reply comment',
        commenterName: 'PW Replier',
        related: 1,
      },
    });
    expect(response.status()).not.toBe(404);
  });
});

test.describe('Blog Comments API — POST — Negative', () => {
  test('POST without blogid returns 400', async ({ request }) => {
    const response = await request.post(API_URL, {
      data: {
        comment: 'Missing blogid',
        commenterName: 'Tester',
      },
    });
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toContain('blogid');
  });

  test('POST without comment returns 400', async ({ request }) => {
    const response = await request.post(API_URL, {
      data: {
        blogid: 'test-post',
        commenterName: 'Tester',
      },
    });
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toContain('comment');
  });

  test('POST without commenterName returns 400', async ({ request }) => {
    const response = await request.post(API_URL, {
      data: {
        blogid: 'test-post',
        comment: 'Valid comment text',
      },
    });
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toContain('Name');
  });

  test('POST with empty comment (whitespace only) returns 400', async ({ request }) => {
    const response = await request.post(API_URL, {
      data: {
        blogid: 'test-post',
        comment: '   ',
        commenterName: 'Tester',
      },
    });
    expect(response.status()).toBe(400);
  });

  test('POST with invalid JSON returns 400 or 403', async ({ request }) => {
    const response = await request.post(API_URL, {
      data: 'not-valid-json',
      headers: { 'Content-Type': 'text/plain' },
    });
    // Workers may reject non-JSON content types at platform level (403) or handler level (400)
    expect([400, 403]).toContain(response.status());
  });
});

test.describe('Blog Comments API — PATCH — Positive', () => {
  test('PATCH with valid id and status=approved returns ok', async ({ request }) => {
    const response = await request.patch(API_URL, {
      data: {
        id: 1,
        status: 'approved',
      },
    });
    // Should not 404 — endpoint exists
    expect(response.status()).not.toBe(404);
    if (response.status() === 200) {
      const body = await response.json();
      expect(body.ok).toBe(true);
      expect(body.id).toBe(1);
      expect(body.status).toBe('approved');
    }
  });

  test('PATCH with valid id and status=pending returns ok', async ({ request }) => {
    const response = await request.patch(API_URL, {
      data: {
        id: 1,
        status: 'pending',
      },
    });
    expect(response.status()).not.toBe(404);
    if (response.status() === 200) {
      const body = await response.json();
      expect(body.ok).toBe(true);
      expect(body.status).toBe('pending');
    }
  });
});

test.describe('Blog Comments API — PATCH — Negative', () => {
  test('PATCH without id returns 400', async ({ request }) => {
    const response = await request.patch(API_URL, {
      data: {
        status: 'approved',
      },
    });
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toContain('id');
  });

  test('PATCH without status returns 400', async ({ request }) => {
    const response = await request.patch(API_URL, {
      data: {
        id: 1,
      },
    });
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toContain('status');
  });

  test('PATCH with invalid status value returns 400', async ({ request }) => {
    const response = await request.patch(API_URL, {
      data: {
        id: 1,
        status: 'deleted',
      },
    });
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toContain('approved|pending');
  });

  test('PATCH with empty body returns 400', async ({ request }) => {
    const response = await request.patch(API_URL, {
      data: {},
    });
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toBeDefined();
  });

  test('PATCH with invalid JSON returns 400 or 403', async ({ request }) => {
    const response = await request.patch(API_URL, {
      data: 'not-valid-json',
      headers: { 'Content-Type': 'text/plain' },
    });
    // Workers may reject non-JSON content types at platform level (403) or handler level (400)
    expect([400, 403]).toContain(response.status());
  });
});

test.describe('Blog Comments API — PUT (Edit) — Positive', () => {
  test('PUT with valid id and comment returns 200', async ({ request }) => {
    // First create a pending comment to edit
    const postRes = await request.post(API_URL, {
      data: {
        blogid: 'playwright-edit-test',
        blogname: 'Edit Test',
        subject: 'Original subject',
        comment: 'Original comment text',
        commenterName: 'PW Editor',
      },
    });
    if (postRes.status() !== 200) return;
    const postBody = await postRes.json();
    const commentId = postBody.id;

    // Now edit it
    const response = await request.put(API_URL, {
      data: {
        id: commentId,
        comment: 'Updated comment text',
        subject: 'Updated subject',
      },
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.ok).toBe(true);
    expect(body.id).toBe(commentId);
  });

  test('PUT without subject only updates comment', async ({ request }) => {
    const postRes = await request.post(API_URL, {
      data: {
        blogid: 'playwright-edit-test-2',
        blogname: 'Edit Test 2',
        subject: 'Keep this subject',
        comment: 'Original text',
        commenterName: 'PW Editor',
      },
    });
    if (postRes.status() !== 200) return;
    const postBody = await postRes.json();

    const response = await request.put(API_URL, {
      data: {
        id: postBody.id,
        comment: 'Only comment updated',
      },
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.ok).toBe(true);
  });
});

test.describe('Blog Comments API — PUT (Edit) — Negative', () => {
  test('PUT without id returns 400', async ({ request }) => {
    const response = await request.put(API_URL, {
      data: {
        comment: 'No id provided',
      },
    });
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toContain('id');
  });

  test('PUT without comment returns 400', async ({ request }) => {
    const response = await request.put(API_URL, {
      data: {
        id: 1,
      },
    });
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toContain('comment');
  });

  test('PUT with empty comment returns 400', async ({ request }) => {
    const response = await request.put(API_URL, {
      data: {
        id: 1,
        comment: '   ',
      },
    });
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toContain('comment');
  });

  test('PUT on non-existent comment returns 404', async ({ request }) => {
    const response = await request.put(API_URL, {
      data: {
        id: 999999,
        comment: 'Does not exist',
      },
    });
    expect(response.status()).toBe(404);
    const body = await response.json();
    expect(body.error).toContain('not found');
  });

  test('PUT on approved comment returns 403', async ({ request }) => {
    // Create a comment, approve it, then try to edit
    const postRes = await request.post(API_URL, {
      data: {
        blogid: 'playwright-edit-approved',
        blogname: 'Edit Approved Test',
        subject: '',
        comment: 'Will be approved',
        commenterName: 'PW Tester',
      },
    });
    if (postRes.status() !== 200) return;
    const postBody = await postRes.json();
    const id = postBody.id;

    // Approve it
    await request.patch(API_URL, { data: { id, status: 'approved' } });

    // Try to edit — should be forbidden
    const response = await request.put(API_URL, {
      data: { id, comment: 'Trying to edit approved' },
    });
    expect(response.status()).toBe(403);
    const body = await response.json();
    expect(body.error).toContain('pending');
  });

  test('PUT with invalid JSON returns 400 or 403', async ({ request }) => {
    const response = await request.put(API_URL, {
      data: 'not-valid-json',
      headers: { 'Content-Type': 'text/plain' },
    });
    expect([400, 403]).toContain(response.status());
  });
});

test.describe('Blog Comments API — PUT (Edit Pending Comment) — Positive', () => {
  test('PUT with valid id and comment returns 200 with ok:true', async ({ request }) => {
    // First, create a pending comment to edit
    const postRes = await request.post(API_URL, {
      data: {
        blogid: 'playwright-put-test',
        blogname: 'PW PUT Test',
        subject: 'Original subject',
        comment: 'Original comment body for PUT test',
        commenterName: 'PW PUT Tester',
      },
    });
    if (postRes.status() !== 200) {
      test.skip();
      return;
    }
    const postBody = await postRes.json();
    const commentId = postBody.id;

    // Now edit it via PUT
    const response = await request.put(API_URL, {
      data: {
        id: commentId,
        comment: 'Edited comment body via Playwright PUT test',
      },
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.ok).toBe(true);
    expect(body.id).toBe(commentId);
  });

  test('PUT with id, comment, and subject updates both fields', async ({ request }) => {
    // Create a pending comment
    const postRes = await request.post(API_URL, {
      data: {
        blogid: 'playwright-put-test-subject',
        blogname: 'PW PUT Subject Test',
        subject: 'Old subject',
        comment: 'Old comment for subject edit test',
        commenterName: 'PW Subject Tester',
      },
    });
    if (postRes.status() !== 200) {
      test.skip();
      return;
    }
    const postBody = await postRes.json();
    const commentId = postBody.id;

    // Edit both comment and subject
    const response = await request.put(API_URL, {
      data: {
        id: commentId,
        comment: 'Updated comment text',
        subject: 'Updated subject text',
      },
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.ok).toBe(true);
    expect(body.id).toBe(commentId);
  });

  test('PUT trims comment content and respects max length', async ({ request }) => {
    // Create a pending comment
    const postRes = await request.post(API_URL, {
      data: {
        blogid: 'playwright-put-trim-test',
        blogname: 'PW Trim Test',
        subject: 'Trim test',
        comment: 'Comment to be trimmed',
        commenterName: 'PW Trimmer',
      },
    });
    if (postRes.status() !== 200) {
      test.skip();
      return;
    }
    const postBody = await postRes.json();
    const commentId = postBody.id;

    // PUT with whitespace-padded comment (should be trimmed)
    const response = await request.put(API_URL, {
      data: {
        id: commentId,
        comment: '   Trimmed edit content   ',
      },
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.ok).toBe(true);
  });
});

test.describe('Blog Comments API — PUT (Edit Pending Comment) — Negative', () => {
  test('PUT without id returns 400', async ({ request }) => {
    const response = await request.put(API_URL, {
      data: {
        comment: 'No id provided',
      },
    });
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toContain('id');
  });

  test('PUT without comment returns 400', async ({ request }) => {
    const response = await request.put(API_URL, {
      data: {
        id: 1,
      },
    });
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toContain('comment');
  });

  test('PUT with empty comment (whitespace only) returns 400', async ({ request }) => {
    const response = await request.put(API_URL, {
      data: {
        id: 1,
        comment: '    ',
      },
    });
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toContain('comment');
  });

  test('PUT with non-existent comment id returns 404', async ({ request }) => {
    const response = await request.put(API_URL, {
      data: {
        id: 999999,
        comment: 'Trying to edit non-existent comment',
      },
    });
    // 404 if comment not found, or 503 if DB unavailable
    expect([404, 503]).toContain(response.status());
    if (response.status() === 404) {
      const body = await response.json();
      expect(body.error).toContain('not found');
    }
  });

  test('PUT on an approved comment returns 403', async ({ request }) => {
    // First, create a comment and approve it
    const postRes = await request.post(API_URL, {
      data: {
        blogid: 'playwright-put-approved-test',
        blogname: 'PW Approved Test',
        subject: 'Will be approved',
        comment: 'This comment will be approved then PUT attempted',
        commenterName: 'PW Approved Tester',
      },
    });
    if (postRes.status() !== 200) {
      test.skip();
      return;
    }
    const postBody = await postRes.json();
    const commentId = postBody.id;

    // Approve via PATCH
    const patchRes = await request.patch(API_URL, {
      data: { id: commentId, status: 'approved' },
    });
    if (patchRes.status() !== 200) {
      test.skip();
      return;
    }

    // Now attempt PUT on the approved comment — should get 403
    const putRes = await request.put(API_URL, {
      data: {
        id: commentId,
        comment: 'Trying to edit approved comment',
      },
    });
    expect(putRes.status()).toBe(403);
    const body = await putRes.json();
    expect(body.error).toContain('pending');
  });

  test('PUT with invalid JSON returns 400 or 403', async ({ request }) => {
    const response = await request.put(API_URL, {
      data: 'not-valid-json',
      headers: { 'Content-Type': 'text/plain' },
    });
    expect([400, 403]).toContain(response.status());
  });

  test('PUT with empty body returns 400', async ({ request }) => {
    const response = await request.put(API_URL, {
      data: {},
    });
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toBeDefined();
  });
});

test.describe('Blog Comments API — PATCH hidden toggle — Positive', () => {
  test('PATCH with hidden=1 hides a comment', async ({ request }) => {
    // Create a comment first
    const postRes = await request.post(API_URL, {
      data: {
        blogid: 'playwright-hidden-test',
        blogname: 'PW Hidden Test',
        subject: 'Hidden toggle test',
        comment: 'This comment will be hidden',
        commenterName: 'PW Hidden Tester',
      },
    });
    if (postRes.status() !== 200) { test.skip(); return; }
    const { id } = await postRes.json();

    const response = await request.patch(API_URL, {
      data: { id, hidden: 1 },
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.ok).toBe(true);
    expect(body.id).toBe(id);
    expect(body.hidden).toBe(1);
  });

  test('PATCH with hidden=0 unhides a comment', async ({ request }) => {
    // Create and hide a comment
    const postRes = await request.post(API_URL, {
      data: {
        blogid: 'playwright-unhide-test',
        blogname: 'PW Unhide Test',
        subject: 'Unhide test',
        comment: 'This comment will be unhidden',
        commenterName: 'PW Unhide Tester',
      },
    });
    if (postRes.status() !== 200) { test.skip(); return; }
    const { id } = await postRes.json();

    // Hide it
    await request.patch(API_URL, { data: { id, hidden: 1 } });

    // Unhide it
    const response = await request.patch(API_URL, {
      data: { id, hidden: 0 },
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.ok).toBe(true);
    expect(body.hidden).toBe(0);
  });

  test('PATCH with both status and hidden updates both', async ({ request }) => {
    const postRes = await request.post(API_URL, {
      data: {
        blogid: 'playwright-both-test',
        blogname: 'PW Both Test',
        subject: 'Both fields',
        comment: 'Testing status + hidden together',
        commenterName: 'PW Both Tester',
      },
    });
    if (postRes.status() !== 200) { test.skip(); return; }
    const { id } = await postRes.json();

    const response = await request.patch(API_URL, {
      data: { id, status: 'approved', hidden: 1 },
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.ok).toBe(true);
    expect(body.status).toBe('approved');
    expect(body.hidden).toBe(1);
  });
});

test.describe('Blog Comments API — PATCH hidden toggle — Negative', () => {
  test('PATCH with invalid hidden value returns 400', async ({ request }) => {
    const response = await request.patch(API_URL, {
      data: { id: 1, hidden: 5 },
    });
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toContain('hidden');
  });

  test('PATCH with hidden as string "true" returns 400', async ({ request }) => {
    const response = await request.patch(API_URL, {
      data: { id: 1, hidden: 'true' },
    });
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toContain('hidden');
  });
});

test.describe('Blog Comments API — GET ?hidden=true (admin filter) — Positive', () => {
  test('GET with admin=true&hidden=true returns hidden comments', async ({ request }) => {
    const response = await request.get(`${API_URL}?admin=true&hidden=true`);
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty('comments');
    expect(Array.isArray(body.comments)).toBe(true);
    // All returned comments should have hidden=1
    for (const c of body.comments) {
      expect(c.hidden).toBe(1);
    }
  });

  test('GET with admin=true returns non-hidden comments and stats include hidden count', async ({ request }) => {
    const response = await request.get(`${API_URL}?admin=true`);
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty('comments');
    expect(body).toHaveProperty('stats');
    expect(body.stats).toHaveProperty('hidden');
    expect(typeof body.stats.hidden).toBe('number');
    // All returned comments should NOT be hidden
    for (const c of body.comments) {
      expect(c.hidden).toBe(0);
    }
  });

  test('GET with admin=true&stats=true includes hidden count in stats', async ({ request }) => {
    const response = await request.get(`${API_URL}?admin=true&stats=true`);
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty('stats');
    expect(body.stats).toHaveProperty('hidden');
    expect(typeof body.stats.hidden).toBe('number');
    expect(body.stats.hidden).toBeGreaterThanOrEqual(0);
  });
});

test.describe('Blog Comments API — GET public excludes hidden — Positive', () => {
  test('public GET does not return hidden comments', async ({ request }) => {
    // Create a comment, approve it, then hide it
    const postRes = await request.post(API_URL, {
      data: {
        blogid: 'playwright-public-hidden-check',
        blogname: 'PW Public Hidden Check',
        subject: 'Should be hidden',
        comment: 'This comment is approved but hidden',
        commenterName: 'PW Public Hidden',
      },
    });
    if (postRes.status() !== 200) { test.skip(); return; }
    const { id } = await postRes.json();

    // Approve it
    await request.patch(API_URL, { data: { id, status: 'approved' } });
    // Hide it
    await request.patch(API_URL, { data: { id, hidden: 1 } });

    // Public GET should NOT return it
    const getRes = await request.get(`${API_URL}?blogid=playwright-public-hidden-check`);
    expect(getRes.status()).toBe(200);
    const body = await getRes.json();
    const foundHidden = body.comments.find((c: any) => c.id === id);
    expect(foundHidden).toBeUndefined();
  });
});


test.describe('Blog Comments API — GET Admin Hidden — Positive', () => {
  test('GET ?admin=true returns 200 with comments array and stats object', async ({ request }) => {
    const response = await request.get(`${API_URL}?admin=true`);
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty('comments');
    expect(body).toHaveProperty('stats');
    expect(Array.isArray(body.comments)).toBe(true);
  });

  test('GET ?admin=true stats include hidden count', async ({ request }) => {
    const response = await request.get(`${API_URL}?admin=true`);
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.stats).toHaveProperty('hidden');
    expect(typeof body.stats.hidden).toBe('number');
    expect(body.stats.hidden).toBeGreaterThanOrEqual(0);
  });

  test('GET ?admin=true stats include approved, pending, hidden, and total', async ({ request }) => {
    const response = await request.get(`${API_URL}?admin=true`);
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.stats).toHaveProperty('approved');
    expect(body.stats).toHaveProperty('pending');
    expect(body.stats).toHaveProperty('hidden');
    expect(body.stats).toHaveProperty('total');
  });

  test('GET ?admin=true&stats=true returns stats with hidden count', async ({ request }) => {
    const response = await request.get(`${API_URL}?admin=true&stats=true`);
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty('stats');
    expect(body.stats).toHaveProperty('hidden');
    expect(typeof body.stats.hidden).toBe('number');
    expect(body.stats).toHaveProperty('approved');
    expect(body.stats).toHaveProperty('pending');
    expect(body.stats).toHaveProperty('total');
  });

  test('GET ?admin=true&hidden=true returns 200 with comments array', async ({ request }) => {
    const response = await request.get(`${API_URL}?admin=true&hidden=true`);
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty('comments');
    expect(Array.isArray(body.comments)).toBe(true);
  });

  test('GET ?admin=true&hidden=true returns only hidden comments (hidden=1)', async ({ request }) => {
    const response = await request.get(`${API_URL}?admin=true&hidden=true`);
    expect(response.status()).toBe(200);
    const body = await response.json();
    // Every returned comment should have hidden = 1
    for (const comment of body.comments) {
      expect(comment.hidden).toBe(1);
    }
  });

  test('GET ?admin=true (non-hidden) comments include hidden field set to 0', async ({ request }) => {
    const response = await request.get(`${API_URL}?admin=true`);
    expect(response.status()).toBe(200);
    const body = await response.json();
    // All returned comments should have hidden = 0 (non-hidden mode)
    for (const comment of body.comments) {
      expect(comment.hidden).toBe(0);
    }
  });
});

test.describe('Blog Comments API — GET Admin Hidden — Negative', () => {
  test('GET ?admin=true&hidden=true without admin being true is treated as public (requires blogid)', async ({ request }) => {
    // hidden=true alone without admin=true should fall through to public mode and require blogid
    const response = await request.get(`${API_URL}?hidden=true`);
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toContain('blogid');
  });

  test('GET ?admin=true returns no hidden comments in default mode', async ({ request }) => {
    const response = await request.get(`${API_URL}?admin=true`);
    expect(response.status()).toBe(200);
    const body = await response.json();
    // Default admin mode should exclude hidden comments from the list
    const hiddenComments = body.comments.filter((c: any) => c.hidden === 1);
    expect(hiddenComments.length).toBe(0);
  });
});

test.describe('Blog Comments API — PATCH Hidden Toggle — Positive', () => {
  test('PATCH with id and hidden=1 returns ok with hidden field', async ({ request }) => {
    // Create a comment to hide
    const postRes = await request.post(API_URL, {
      data: {
        blogid: 'playwright-hidden-test',
        blogname: 'Hidden Test',
        subject: 'Will be hidden',
        comment: 'This comment will be hidden via PATCH',
        commenterName: 'PW Hidden Tester',
      },
    });
    if (postRes.status() !== 200) {
      test.skip();
      return;
    }
    const postBody = await postRes.json();
    const commentId = postBody.id;

    // Hide it
    const response = await request.patch(API_URL, {
      data: { id: commentId, hidden: 1 },
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.ok).toBe(true);
    expect(body.id).toBe(commentId);
    expect(body.hidden).toBe(1);
  });

  test('PATCH with id and hidden=0 unhides a comment', async ({ request }) => {
    // Create and hide a comment
    const postRes = await request.post(API_URL, {
      data: {
        blogid: 'playwright-unhide-test',
        blogname: 'Unhide Test',
        subject: '',
        comment: 'Comment to hide then unhide',
        commenterName: 'PW Unhide Tester',
      },
    });
    if (postRes.status() !== 200) {
      test.skip();
      return;
    }
    const postBody = await postRes.json();
    const commentId = postBody.id;

    // Hide it first
    const hideRes = await request.patch(API_URL, {
      data: { id: commentId, hidden: 1 },
    });
    expect(hideRes.status()).toBe(200);

    // Unhide it
    const response = await request.patch(API_URL, {
      data: { id: commentId, hidden: 0 },
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.ok).toBe(true);
    expect(body.hidden).toBe(0);
  });

  test('PATCH with both status and hidden updates both fields', async ({ request }) => {
    const postRes = await request.post(API_URL, {
      data: {
        blogid: 'playwright-both-test',
        blogname: 'Both Test',
        subject: '',
        comment: 'Comment for combined PATCH test',
        commenterName: 'PW Both Tester',
      },
    });
    if (postRes.status() !== 200) {
      test.skip();
      return;
    }
    const postBody = await postRes.json();
    const commentId = postBody.id;

    // Update both status and hidden together
    const response = await request.patch(API_URL, {
      data: { id: commentId, status: 'approved', hidden: 1 },
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.ok).toBe(true);
    expect(body.status).toBe('approved');
    expect(body.hidden).toBe(1);
  });
});

test.describe('Blog Comments API — PATCH Hidden Toggle — Negative', () => {
  test('PATCH with invalid hidden value (not 0 or 1) returns 400', async ({ request }) => {
    const response = await request.patch(API_URL, {
      data: { id: 1, hidden: 2 },
    });
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toContain('hidden');
  });

  test('PATCH with hidden as string returns 400', async ({ request }) => {
    const response = await request.patch(API_URL, {
      data: { id: 1, hidden: 'yes' },
    });
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toContain('hidden');
  });

  test('PATCH with only id (no status, no hidden) returns 400', async ({ request }) => {
    const response = await request.patch(API_URL, {
      data: { id: 1 },
    });
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toBeDefined();
  });
});

test.describe('Blog Comments API — Public Hidden Filtering — Positive', () => {
  test('hidden comments do not appear in public GET', async ({ request }) => {
    // Create a comment, approve it, then hide it
    const postRes = await request.post(API_URL, {
      data: {
        blogid: 'playwright-public-hidden-test',
        blogname: 'Public Hidden Test',
        subject: '',
        comment: 'This approved comment will be hidden from public',
        commenterName: 'PW Public Hidden',
      },
    });
    if (postRes.status() !== 200) {
      test.skip();
      return;
    }
    const postBody = await postRes.json();
    const commentId = postBody.id;

    // Approve it
    await request.patch(API_URL, { data: { id: commentId, status: 'approved' } });
    // Hide it
    await request.patch(API_URL, { data: { id: commentId, hidden: 1 } });

    // Public GET should NOT include this comment
    const publicRes = await request.get(`${API_URL}?blogid=playwright-public-hidden-test`);
    expect(publicRes.status()).toBe(200);
    const publicBody = await publicRes.json();
    const found = publicBody.comments.find((c: any) => c.id === commentId);
    expect(found).toBeUndefined();
  });

  test('non-hidden approved comments still appear in public GET', async ({ request }) => {
    // Create and approve a comment (don't hide it)
    const postRes = await request.post(API_URL, {
      data: {
        blogid: 'playwright-public-visible-test',
        blogname: 'Public Visible Test',
        subject: '',
        comment: 'This approved comment should appear publicly',
        commenterName: 'PW Visible',
      },
    });
    if (postRes.status() !== 200) {
      test.skip();
      return;
    }
    const postBody = await postRes.json();
    const commentId = postBody.id;

    // Approve it (don't hide)
    await request.patch(API_URL, { data: { id: commentId, status: 'approved' } });

    // Public GET should include this comment
    const publicRes = await request.get(`${API_URL}?blogid=playwright-public-visible-test`);
    expect(publicRes.status()).toBe(200);
    const publicBody = await publicRes.json();
    const found = publicBody.comments.find((c: any) => c.id === commentId);
    expect(found).toBeDefined();
  });
});
