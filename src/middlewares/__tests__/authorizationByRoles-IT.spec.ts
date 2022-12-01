/**
 * @group integration/test
 */
import debugPkg from 'debug';
import * as dotenv from 'dotenv';
import express, { NextFunction, Request, Response } from 'express';
import request from 'supertest';
import authorizationByRoles from '../authorizationByRoles';
const debug = debugPkg(
  'keycloak-authorization-service:authorization-by-roles-it',
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
  clientId: '',
  clientSecret: '',
};

const app = express();

[express.json(), express.urlencoded({ extended: true })].forEach((middleWare) =>
  app.use(middleWare),
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
      application: 'customer-client',
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

describe('when requesting all authorization services endpoints and metadata', () => {
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
