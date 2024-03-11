/**
 * @group integration/test
 */
import debugPkg from 'debug';
import * as dotenv from 'dotenv';
import express, { NextFunction, Request, Response, Express } from 'express';
import request from 'supertest';
import TestHelper from '../../utils/test-helper';
import authorizationByPermission from '../authorizationByPermission';
const debug = debugPkg(
  'keycloak-authorization-service:authorization-by-permission-it',
);
dotenv.config();

jest.setTimeout(parseInt(process.env.JEST_TIMEOUT || ''));

const getApp = (config: any): Express => {
  const app = express();

  [express.json(), express.urlencoded({ extended: true })].forEach(
    (middleWare) => app.use(middleWare),
  );

  app.get(
    '/api/test/success',
    authorizationByPermission(config, {
      permission: { resource: 'Default Resource', scopes: ['view'] },
      audience: 'customer-client',
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
    authorizationByPermission(config, {
      permission: { resource: 'Other Resource' },
      audience: 'customer-client',
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
    tokens.user = await helper.getUserAccessToken();
    tokens.client = await helper.getClientAccessToken();
    config.baseUrl = helper.getBaseUrl();
    app = getApp(config);
  });

  it('should succeed', async () => {
    const res = await Promise.all(
      Object.values(tokens).map((token) =>
        request(app)
          .get('/api/test/success')
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
