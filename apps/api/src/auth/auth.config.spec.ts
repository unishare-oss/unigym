import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

describe('auth config', () => {
  it('fails at startup when a required env var is missing', () => {
    const config = fileURLToPath(new URL('./auth.config.ts', import.meta.url));
    const env: NodeJS.ProcessEnv = {
      ...process.env,
      DOTENV_CONFIG_PATH: '/nonexistent/.env',
      DATABASE_URL: 'postgresql://unigym:unigym@localhost:5433/unigym',
      BETTER_AUTH_URL: 'http://127.0.0.1:3003',
      BETTER_AUTH_SECRET: 'secret-at-least-thirty-two-characters',
      UNIAUTH_ISSUER: 'http://localhost:3002/api/auth',
      UNIAUTH_CLIENT_SECRET: 'secret',
    };
    delete env.UNIAUTH_CLIENT_ID;

    const result = spawnSync(
      'bun',
      ['-e', `await import(${JSON.stringify(config)})`],
      // Bun loads .env from the working directory, so run where there is none.
      { cwd: tmpdir(), env, encoding: 'utf8' },
    );

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('Missing UNIAUTH_CLIENT_ID');
  });
});
