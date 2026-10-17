import { test } from 'node:test';
import assert from 'node:assert/strict';

/**
 * Task 12 — site settings (owner mandate: business info is configuration,
 * never fabricated in code).
 *
 * The four titles below are the plan's literal failing-first tests plus one
 * proof that an entirely unconfigured deployment exposes NO placeholder.
 * Seams load lazily so every title fails on its own assertion (or on the
 * "not implemented yet" check) instead of the file dying at import time.
 */

type Plain = Record<string, unknown>;
type MergeFn = (db: Plain, env: NodeJS.ProcessEnv) => Plain;

interface Seams {
  mergePublicSettings: MergeFn;
  updateSettingsSchema: {
    safeParse: (input: unknown) => { success: boolean; data?: unknown; error?: unknown };
    parse: (input: unknown) => Plain;
  };
  settingsService: { getPublic: () => Promise<Plain> };
  SiteSetting: Plain;
}

async function loadSeams(): Promise<Seams> {
  const service = (await import('../src/services/settingsService')) as unknown as Plain;
  const validators = (await import('../src/validators/settings')) as unknown as Plain;
  const model = (await import('../src/models/SiteSetting')) as unknown as Plain;

  const svc = service.settingsService as Seams['settingsService'] | undefined;
  const missing = [
    typeof service.mergePublicSettings === 'function' ? null : 'settingsService.mergePublicSettings',
    svc && typeof svc.getPublic === 'function' ? null : 'settingsService.settingsService.getPublic',
    validators.updateSettingsSchema ? null : 'settings.updateSettingsSchema',
    model.SiteSetting ? null : 'SiteSetting.SiteSetting',
  ].filter(Boolean) as string[];
  assert.deepEqual(missing, [], `Task 12 seams not implemented yet: ${missing.join(', ')}`);

  return {
    mergePublicSettings: service.mergePublicSettings as MergeFn,
    updateSettingsSchema: validators.updateSettingsSchema as Seams['updateSettingsSchema'],
    settingsService: svc as Seams['settingsService'],
    SiteSetting: model.SiteSetting as Plain,
  };
}

async function withFindOne(
  doc: Plain | null,
  run: (calls: Plain[]) => Promise<void>,
): Promise<void> {
  const seams = await loadSeams();
  const target = seams.SiteSetting;
  const own = Object.getOwnPropertyDescriptor(target, 'findOne');
  const calls: Plain[] = [];
  target.findOne = (query: Plain) => {
    calls.push(query);
    return { lean: () => Promise.resolve(doc) };
  };
  try {
    await run(calls);
  } finally {
    if (own) Object.defineProperty(target, 'findOne', own);
    else delete target.findOne;
  }
}

/** Runs `run` with every optional SITE_* fallback variable removed. */
async function withoutSiteEnv(run: () => Promise<void>): Promise<void> {
  const names = [
    'SITE_HOTLINE',
    'SITE_SUPPORT_HOURS',
    'SITE_EMAIL',
    'SITE_ADDRESS',
    'SITE_FACEBOOK_URL',
    'SITE_ZALO_URL',
    'SITE_INSTAGRAM_URL',
  ];
  const saved = new Map<string, string | undefined>();
  for (const name of names) {
    saved.set(name, process.env[name]);
    delete process.env[name];
  }
  try {
    await run();
  } finally {
    for (const [name, value] of saved) {
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
  }
}

// --- Step 1 (plan): literal title 1 ---

test('mergePublicSettings strips empty and missing values — no placeholders ever', async () => {
  const { mergePublicSettings } = await loadSeams();

  const out = mergePublicSettings(
    {
      hotline: '',
      supportHours: '    ',
      email: null,
      address: undefined,
      socialLinks: { facebook: '   ', zalo: null },
    },
    { SITE_HOTLINE: '', SITE_SUPPORT_HOURS: '   ', SITE_EMAIL: undefined, SITE_ADDRESS: '' },
  );

  // Nothing configured anywhere ⇒ an empty object: no nulls, no empty keys,
  // no fabricated default (never '1900 1234', never invented hours).
  assert.deepEqual(out, {});
  assert.equal(JSON.stringify(out), '{}');

  // A partial mix never yields null/undefined values either.
  const partial = mergePublicSettings(
    { hotline: '', address: '  12 Nguyễn Trãi, Q.1  ' },
    { SITE_HOTLINE: '0909 000 000' },
  );
  assert.equal('hotline' in partial, true, 'empty DB value falls back to the env value');
  assert.equal(partial.hotline, '0909 000 000');
  assert.equal(partial.address, '12 Nguyễn Trãi, Q.1');
  assert.equal('supportHours' in partial, false, 'unconfigured keys are omitted, never null');
  assert.equal('socialLinks' in partial, false, 'empty socialLinks object is stripped');
  for (const value of Object.values(partial)) assert.notEqual(value, null);
});

// --- Step 1 (plan): literal title 2 ---

test('database settings override the SITE_* env fallback', async () => {
  const { mergePublicSettings } = await loadSeams();

  const out = mergePublicSettings(
    { hotline: '0909 555 444', email: '', socialLinks: { zalo: 'https://zalo.me/9999' } },
    {
      SITE_HOTLINE: '1900 0000',
      SITE_EMAIL: 'env@store.vn',
      SITE_ADDRESS: '12 Đường A, Q. B, TP.HCM',
      SITE_ZALO_URL: 'https://zalo.me/0000',
      SITE_FACEBOOK_URL: 'https://facebook.com/store3d',
    },
  );

  assert.equal(out.hotline, '0909 555 444', 'DB wins when it is set');
  assert.equal(out.email, 'env@store.vn', 'empty DB value falls back to env');
  assert.equal(out.address, '12 Đường A, Q. B, TP.HCM', 'missing DB value falls back to env');
  assert.deepEqual(out.socialLinks, {
    zalo: 'https://zalo.me/9999',
    facebook: 'https://facebook.com/store3d',
  });
  assert.equal('supportHours' in out, false, 'unset anywhere ⇒ key absent');
});

// --- Step 1 (plan): literal title 3 ---

test('settings Zod schema rejects values longer than 200 chars', async () => {
  const { updateSettingsSchema } = await loadSeams();

  const tooLong = updateSettingsSchema.safeParse({ hotline: '1'.repeat(201) });
  assert.equal(tooLong.success, false, '201-char hotline must be rejected');

  const tooLongNested = updateSettingsSchema.safeParse({
    socialLinks: { instagram: 'x'.repeat(201) },
  });
  assert.equal(tooLongNested.success, false, '201-char social link must be rejected');

  const tooLongAddress = updateSettingsSchema.safeParse({ address: 'a'.repeat(201) });
  assert.equal(tooLongAddress.success, false, '201-char address must be rejected');

  // Boundary + trimming + optionality still hold.
  const ok = updateSettingsSchema.parse({
    hotline: '  0909 111 222  ',
    supportHours: '8:30–21:00',
    socialLinks: { facebook: ' https://facebook.com/x ', instagram: '' },
  });
  assert.equal(ok.hotline, '0909 111 222');
  assert.equal(ok.supportHours, '8:30–21:00');
  assert.deepEqual(ok.socialLinks, {
    facebook: 'https://facebook.com/x',
    instagram: '',
  });
  assert.equal(updateSettingsSchema.safeParse({}).success, true, 'all fields optional');
  assert.equal(
    updateSettingsSchema.safeParse({ hotline: '1'.repeat(200) }).success,
    true,
    'exactly 200 chars accepted',
  );
});

// --- Step 1 (plan): literal title 4 ---

test('public settings payload contains only whitelisted fields', async () => {
  const { mergePublicSettings } = await loadSeams();

  const storedDoc: Plain = {
    _id: '64b0000000000000000000aa',
    key: 'site',
    hotline: '0909 111 222',
    supportHours: '',
    email: 'lienhe@store.vn',
    socialLinks: { facebook: 'https://facebook.com/x', zalo: '', instagram: null },
    internalNote: 'ghi chu noi bo',
    createdAt: '2026-10-17T00:00:00.000Z',
    updatedAt: '2026-10-17T00:00:00.000Z',
    __v: 0,
  };

  const payload = mergePublicSettings(storedDoc, { SITE_HOTLINE: '1900 1111' });

  assert.deepEqual(Object.keys(payload).sort(), ['email', 'hotline', 'socialLinks']);
  assert.deepEqual(payload.socialLinks, { facebook: 'https://facebook.com/x' });
  for (const forbidden of ['_id', 'key', 'createdAt', 'updatedAt', '__v', 'internalNote']) {
    assert.equal(forbidden in payload, false, `"${forbidden}" must never be exposed`);
  }

  // Wire: the actual public read path (service → model) leaks nothing either.
  await withFindOne(storedDoc, async () => {
    const fromService = await loadSeams().then((s) => s.settingsService.getPublic());
    assert.deepEqual(fromService, payload);
    for (const forbidden of ['_id', 'key', 'createdAt', 'updatedAt', '__v']) {
      assert.equal(forbidden in fromService, false, `"${forbidden}" leaked by the service`);
    }
  });
});

// --- Extra proof required by the task: nothing configured ⇒ nothing exposed ---

test('unconfigured site settings produce an empty public payload with no placeholders', async () => {
  await withoutSiteEnv(async () => {
    // No document at all and no SITE_* variables.
    await withFindOne(null, async () => {
      const out = await loadSeams().then((s) => s.settingsService.getPublic());
      assert.deepEqual(out, {});
      assert.equal(JSON.stringify(out), '{}');
      assert.equal(JSON.stringify(out).includes('1900'), false, 'no design placeholder hotline');
      assert.equal(JSON.stringify(out).includes('24/7'), false, 'no invented support hours');
    });

    // A document that exists but holds only empty values behaves identically.
    await withFindOne(
      { _id: '64b0000000000000000000bb', key: 'site', hotline: '', address: '   ' },
      async () => {
        const out = await loadSeams().then((s) => s.settingsService.getPublic());
        assert.deepEqual(out, {});
      },
    );
  });
});
