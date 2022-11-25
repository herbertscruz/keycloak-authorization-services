/**
 * @group integration/test
 */
import debugPkg from 'debug';
import express, { NextFunction, Request, Response } from 'express';
import request from 'supertest';
import authorizationByPermission from '../authorizationByPermission';
const debug = debugPkg(
  'keycloak-authorization-service:authorization-by-permission-it',
);

// TODO: get access_token in Keycloak automatically
const tokens = {
  user: 'eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJiNGRfNG1ueXpLaTZHclhKWk1kbDIxanBOeHpJQk1fSWwyeTJweHhMeHQ0In0.eyJleHAiOjE2NjkzODU4MTksImlhdCI6MTY2OTM4NTUxOSwianRpIjoiOWRlOWZjYzYtMzFjMS00MjQyLThiYWEtMWJhYzZiZTYzYWYzIiwiaXNzIjoiaHR0cDovL2hvc3QuZG9ja2VyLmludGVybmFsOjgwODEvcmVhbG1zL21haW4iLCJhdWQiOiJhY2NvdW50Iiwic3ViIjoiNzljZDY3OTAtOWU3Ny00NzM3LTljZDctMzQ0MjAyNWI3ODUzIiwidHlwIjoiQmVhcmVyIiwiYXpwIjoiY3VzdG9tZXItY2xpZW50Iiwic2Vzc2lvbl9zdGF0ZSI6IjkzYTFlNTgxLTJjMjgtNGM4MS04ZDQwLTU3YjRlODQ0ZmFmZiIsImFjciI6IjEiLCJyZWFsbV9hY2Nlc3MiOnsicm9sZXMiOlsib2ZmbGluZV9hY2Nlc3MiLCJ1bWFfYXV0aG9yaXphdGlvbiIsImRlZmF1bHQtcm9sZXMtbWFpbiJdfSwicmVzb3VyY2VfYWNjZXNzIjp7ImFjY291bnQiOnsicm9sZXMiOlsibWFuYWdlLWFjY291bnQiLCJtYW5hZ2UtYWNjb3VudC1saW5rcyIsInZpZXctcHJvZmlsZSJdfX0sInNjb3BlIjoib3BlbmlkIHByb2ZpbGUgZW1haWwiLCJzaWQiOiI5M2ExZTU4MS0yYzI4LTRjODEtOGQ0MC01N2I0ZTg0NGZhZmYiLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwibmFtZSI6IkpvaG4gV2ljayIsInByZWZlcnJlZF91c2VybmFtZSI6ImpvaG53aWNrIiwiZ2l2ZW5fbmFtZSI6IkpvaG4iLCJmYW1pbHlfbmFtZSI6IldpY2siLCJlbWFpbCI6ImpvaG53aWNrQGdtYWlsLmNvbSJ9.V1lLEX8vE9kumfinFCRFvgrRa6MQsLS89jsxG-IL20F-28QgCp0llntPZRxFVeL_zSw4ZLzFA759tLLZTf3AMAkk-AeHo-EEQge92cxAK0gCQ6etJ3pIsK9ApWh1_bEqV6w19iEy8HsAA9jO0usWsx6ndREADWLC70JBueop4iA-x8j1sqn9LswXeDY67UYCpu2lWps-VLMBF2iwhkJUSikVz4DPANyLSoyqPVpRBg0SwWIzGg-u-jnm-e1plqtQG60GpOdz2-EIos-YG_neDdlANP0-qsj5O6LMVYI5N6BuYT-8X5UjUFNCD9qhKsJNJkl5T3dihwiMGZP5_5ctyg',
  client:
    'eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJiNGRfNG1ueXpLaTZHclhKWk1kbDIxanBOeHpJQk1fSWwyeTJweHhMeHQ0In0.eyJleHAiOjE2NjkzODU4MzYsImlhdCI6MTY2OTM4NTUzNiwianRpIjoiOTg0YjMxZmEtMWZlOC00Y2ZlLWIwMDYtNWY0ZjgxZmQ4OTRlIiwiaXNzIjoiaHR0cDovL2hvc3QuZG9ja2VyLmludGVybmFsOjgwODEvcmVhbG1zL21haW4iLCJhdWQiOiJhY2NvdW50Iiwic3ViIjoiYWFjODkyNmUtYTE5Ni00MjAyLWFjMTctNWNmZTlkYjc5MGViIiwidHlwIjoiQmVhcmVyIiwiYXpwIjoiY3VzdG9tZXItY2xpZW50IiwiYWNyIjoiMSIsInJlYWxtX2FjY2VzcyI6eyJyb2xlcyI6WyJvZmZsaW5lX2FjY2VzcyIsInVtYV9hdXRob3JpemF0aW9uIiwiZGVmYXVsdC1yb2xlcy1tYWluIl19LCJyZXNvdXJjZV9hY2Nlc3MiOnsiY3VzdG9tZXItY2xpZW50Ijp7InJvbGVzIjpbInVtYV9wcm90ZWN0aW9uIl19LCJhY2NvdW50Ijp7InJvbGVzIjpbIm1hbmFnZS1hY2NvdW50IiwibWFuYWdlLWFjY291bnQtbGlua3MiLCJ2aWV3LXByb2ZpbGUiXX19LCJzY29wZSI6InByb2ZpbGUgZW1haWwiLCJjbGllbnRIb3N0IjoiMTkyLjE2OC4xNi4xIiwiZW1haWxfdmVyaWZpZWQiOmZhbHNlLCJjbGllbnRJZCI6ImN1c3RvbWVyLWNsaWVudCIsInByZWZlcnJlZF91c2VybmFtZSI6InNlcnZpY2UtYWNjb3VudC1jdXN0b21lci1jbGllbnQiLCJjbGllbnRBZGRyZXNzIjoiMTkyLjE2OC4xNi4xIn0.gM_5RNOwYwQth5exxio1Aylhso319qiuW7XOf_rgGtIB0ud0MWKiXiK_RWdwl4_5JoEwbKxDyjFFQj6Xx3oYpdXjIfWN4PsGv8yB2KROMDpeY9lUmOuhnW2XNyOWydpUkXfdj8B3OgyTENK8IpLtL1erBxjpcvf7laEXocKf7HGuQ8VYp6rMvGGrxo-enuffHUBXoMd6KvI3lqF-gS4Xcz9r9l8wI9_i1X3f8Wwy-v3Yyn-5u5t4k6XqtTZsJ59YbLJpjKHQ7snryzTUrhXPDhdAhM1ifHqdo8-8o9qnttcMWElSthBRCwlRIksWN3QplZboH-oyaolyu9IS0RKvhw',
};

const config = {
  baseUrl: 'http://host.docker.internal:8081',
  realm: 'main',
  clientId: 'customer-client',
  clientSecret: 'JaASlgV76n9a8IKx4oGgKi8h8ilHNAQ6',
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
