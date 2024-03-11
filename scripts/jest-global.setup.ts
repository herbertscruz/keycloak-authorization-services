import * as path from 'path';
import { GenericContainer } from 'testcontainers';

export default async () => {
  console.log(
    '\n--- Running jest global setup triggering once before all test suites ---',
  );

  const importFilenames = ['main-realm.json'];
  (global as any).keycloakContainer = await new GenericContainer(
    'quay.io/keycloak/keycloak:21.0.2',
  )
    .withEnvironment({
      KEYCLOAK_ADMIN: 'admin',
      KEYCLOAK_ADMIN_PASSWORD: 'admin',
    })
    .withCopyFilesToContainer(
      importFilenames.map((fileName) => ({
        source: path.resolve(process.cwd(), 'keycloak', fileName),
        target: `/opt/keycloak/data/import/${fileName}`,
      })),
    )
    .withEntrypoint([
      '/opt/keycloak/bin/kc.sh',
      'start-dev',
      '--import-realm',
    ])
    .withExposedPorts({
      container: 8080,
      host: 8080,
    })
    .start();

  console.log('\n--- Starting test suites ---');
};
