import { StartedTestContainer } from 'testcontainers';

export default async () => {
  console.log(
    '\n--- Running jest global teardown triggering once after all test suites ---',
  );

  await ((global as any).keycloakContainer as StartedTestContainer).stop();

  console.log('\n--- Completed test suites ---');
};
