/**
 * @group integration/test
 */
import debugPkg from 'debug';
import * as dotenv from 'dotenv';
import express, { NextFunction, Request, Response } from 'express';
import request from 'supertest';
import authorizationByPermission from '../authorizationByPermission';
const debug = debugPkg(
  'keycloak-authorization-service:authorization-by-permission-it',
);
dotenv.config();

// TODO: get access_token in Keycloak automatically
const tokens = {
  user: process.env.USER_ACCESS_TOKEN || '',
  client: process.env.CLIENT_ACCESS_TOKEN || '',
};

const config = {
  baseUrl: process.env.KEYCLOAK_BASE_URL || '',
  realm: process.env.KEYCLOAK_REALM || '',
  clientId: process.env.KEYCLOAK_CLIENT_ID || '',
  clientSecret: process.env.KEYCLOAK_CLIENT_SECRET || '',
};

const app = express();

[express.json(), express.urlencoded({ extended: true })].forEach((middleWare) =>
  app.use(middleWare),
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

describe('when requesting all authorization services endpoints and metadata', () => {
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
