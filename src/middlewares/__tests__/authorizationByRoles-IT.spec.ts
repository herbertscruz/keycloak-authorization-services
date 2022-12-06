/**
 * @group integration/test
 */
import debugPkg from 'debug';
import * as dotenv from 'dotenv';
import express, { Express, NextFunction, Request, Response } from 'express';
import request from 'supertest';
import TestHelper from '../../utils/test-helper';
import authorizationByRoles from '../authorizationByRoles';
const debug = debugPkg(
  'keycloak-authorization-service:authorization-by-roles-it',
);
dotenv.config();

jest.setTimeout(parseInt(process.env.JEST_TIMEOUT || ''));

const getApp = (config: any): Express => {
  const app = express();

  [express.json(), express.urlencoded({ extended: true })].forEach(
    (middleWare) => app.use(middleWare),
  );

  app.get(
    '/api/test/success/protected',
    authorizationByRoles(config),
    async function (
      req: Request,
      res: Response,
      next: NextFunction,
    ): Promise<void> {
      try {
        res.status(200).send({ message: 'Hello World!' });
      } catch (error) {
        next(error);
      }
    },
  );

  app.get(
    '/api/test/success/verify',
    authorizationByRoles(config, {
      permission: { roles: ['default-roles-main', 'uma_protection'] },
    }),
    async function (
      req: Request,
      res: Response,
      next: NextFunction,
    ): Promise<void> {
      try {
        res.status(200).send({ message: 'Hello World!' });
      } catch (error) {
        next(error);
      }
    },
  );

  app.get(
    '/api/test/success/decode',
    authorizationByRoles(config, {
      decodedType: 'decode',
      permission: {
        client: 'customer-client',
        roles: ['default-roles-main', 'uma_protection'],
      },
    }),
    async function (
      req: Request,
      res: Response,
      next: NextFunction,
    ): Promise<void> {
      try {
        res.status(200).send({ message: 'Hello World!' });
      } catch (error) {
        next(error);
      }
    },
  );

  app.get(
    '/api/test/fail',
    authorizationByRoles(config, {
      permission: { roles: ['other-role'] },
    }),
    async function (
      req: Request,
      res: Response,
      next: NextFunction,
    ): Promise<void> {
      try {
        res.status(200).send({ message: 'Hello World!' });
      } catch (error) {
        next(error);
      }
    },
  );

  return app;
};

describe('when requesting all authorization services endpoints and metadata', () => {
  const helper = new TestHelper();
  const tokens = {} as any;
  const config = { realm: 'main' } as any;
  let app: Express;

  beforeAll(async () => {
    await helper.startKeycloakContainer();
    tokens.user = await helper.getUserAccessToken();
    tokens.client = await helper.getClientAccessToken();
    config.baseUrl = helper.getBaseUrl();
    app = getApp(config);
  });

  afterAll(async () => {
    await helper.stopKeycloakContainer();
  });

  it('should succeed', async () => {
    const res = await Promise.all(
      Object.values(tokens).map((token) =>
        request(app)
          .get('/api/test/success/protected')
          .set({
            Authorization: `Bearer ${token}`,
          }),
      ),
    );
    res.forEach((r) => debug(r.body));
    res.forEach((r) => {
      expect(r.statusCode).toEqual(200);
      expect(r.body).toEqual({ message: 'Hello World!' });
    });
  });

  it('should succeed with verify', async () => {
    const res = await Promise.all(
      Object.values(tokens).map((token) =>
        request(app)
          .get('/api/test/success/verify')
          .set({
            Authorization: `Bearer ${token}`,
          }),
      ),
    );
    res.forEach((r) => debug(r.body));
    res.forEach((r) => {
      expect(r.statusCode).toEqual(200);
      expect(r.body).toEqual({ message: 'Hello World!' });
    });
  });

  it('should succeed with decode', async () => {
    const res = await Promise.all(
      Object.values(tokens).map((token) =>
        request(app)
          .get('/api/test/success/decode')
          .set({
            Authorization: `Bearer ${token}`,
          }),
      ),
    );
    res.forEach((r) => debug(r.body));
    res.forEach((r) => {
      expect(r.statusCode).toEqual(200);
      expect(r.body).toEqual({ message: 'Hello World!' });
    });
  });

  it('should failed', async () => {
    const res = await Promise.all(
      Object.values(tokens).map((token) =>
        request(app)
          .get('/api/test/fail')
          .set({
            Authorization: `Bearer ${token}`,
          }),
      ),
    );
    res.forEach((r) => debug(r.body));
    res.forEach((r) => {
      expect(r.statusCode).toEqual(500);
    });
  });
});
