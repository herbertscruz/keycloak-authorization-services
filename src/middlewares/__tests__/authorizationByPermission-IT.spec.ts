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
  user: 'eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJiNGRfNG1ueXpLaTZHclhKWk1kbDIxanBOeHpJQk1fSWwyeTJweHhMeHQ0In0.eyJleHAiOjE2NjkyODE3MzcsImlhdCI6MTY2OTI4MTQzNywianRpIjoiMmVjZGJlOWItNWYyZi00OTU3LWIwOTAtMzcwZDkyOTU2MjAzIiwiaXNzIjoiaHR0cDovL2hvc3QuZG9ja2VyLmludGVybmFsOjgwODEvcmVhbG1zL21haW4iLCJhdWQiOiJhY2NvdW50Iiwic3ViIjoiNzljZDY3OTAtOWU3Ny00NzM3LTljZDctMzQ0MjAyNWI3ODUzIiwidHlwIjoiQmVhcmVyIiwiYXpwIjoiY3VzdG9tZXItY2xpZW50Iiwic2Vzc2lvbl9zdGF0ZSI6Ijk5N2JhMDQ5LWUwZDUtNGZjNS1hNmUxLTFlYzI2MzEyYmU1MyIsImFjciI6IjEiLCJyZWFsbV9hY2Nlc3MiOnsicm9sZXMiOlsib2ZmbGluZV9hY2Nlc3MiLCJ1bWFfYXV0aG9yaXphdGlvbiIsImRlZmF1bHQtcm9sZXMtbWFpbiJdfSwicmVzb3VyY2VfYWNjZXNzIjp7ImFjY291bnQiOnsicm9sZXMiOlsibWFuYWdlLWFjY291bnQiLCJtYW5hZ2UtYWNjb3VudC1saW5rcyIsInZpZXctcHJvZmlsZSJdfX0sInNjb3BlIjoib3BlbmlkIHByb2ZpbGUgZW1haWwiLCJzaWQiOiI5OTdiYTA0OS1lMGQ1LTRmYzUtYTZlMS0xZWMyNjMxMmJlNTMiLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwibmFtZSI6IkpvaG4gV2ljayIsInByZWZlcnJlZF91c2VybmFtZSI6ImpvaG53aWNrIiwiZ2l2ZW5fbmFtZSI6IkpvaG4iLCJmYW1pbHlfbmFtZSI6IldpY2siLCJlbWFpbCI6ImpvaG53aWNrQGdtYWlsLmNvbSJ9.NWAK0uIYtdX8U1gVNreSyQIBxkra7zjp3YoyzVWpdArGSozoRUNZG8veAfGlkRueBS31aGyXilXhpiLj_RutnPmekHygJhC3zdDbIMDx1Nj5q3BiEvH2aorfqyBOOIdxIvd1drh-hQCXuuhBcIqwxqdhAmm7U8E8lYCkShnhIN2d6NmQE4x0Duyo860_WCZuLNi7fCY47tEA5a_uaBLXO0Ny5kC-8ZuALiUIijRAX1_o6wZqxgOjy-uPiC5VTJVZAmNn3wUCTaWsQ4eTJYS-oy1aUg5lKX6JDSm2026bTewiMpARfoFuQYN4kleJEcyTyGLSL9_dPG4qWci3gCr2OQ',
  client:
    'eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJiNGRfNG1ueXpLaTZHclhKWk1kbDIxanBOeHpJQk1fSWwyeTJweHhMeHQ0In0.eyJleHAiOjE2NjkyODE3NTIsImlhdCI6MTY2OTI4MTQ1MiwianRpIjoiODA5ZDk2YTctMzEwYy00YzAxLThkOWItNWY4NTBhNjM1MGMzIiwiaXNzIjoiaHR0cDovL2hvc3QuZG9ja2VyLmludGVybmFsOjgwODEvcmVhbG1zL21haW4iLCJhdWQiOiJhY2NvdW50Iiwic3ViIjoiNmVkNDI1NDctMjUyNC00NjU5LWEwODAtZWYxNjQ0ZDUzOTZlIiwidHlwIjoiQmVhcmVyIiwiYXpwIjoiY3VzdG9tZXItY2xpZW50IiwiYWNyIjoiMSIsInJlYWxtX2FjY2VzcyI6eyJyb2xlcyI6WyJvZmZsaW5lX2FjY2VzcyIsInVtYV9hdXRob3JpemF0aW9uIiwiZGVmYXVsdC1yb2xlcy1tYWluIl19LCJyZXNvdXJjZV9hY2Nlc3MiOnsiY3VzdG9tZXItY2xpZW50Ijp7InJvbGVzIjpbInVtYV9wcm90ZWN0aW9uIl19LCJhY2NvdW50Ijp7InJvbGVzIjpbIm1hbmFnZS1hY2NvdW50IiwibWFuYWdlLWFjY291bnQtbGlua3MiLCJ2aWV3LXByb2ZpbGUiXX19LCJzY29wZSI6InByb2ZpbGUgZW1haWwiLCJjbGllbnRJZCI6ImN1c3RvbWVyLWNsaWVudCIsImVtYWlsX3ZlcmlmaWVkIjpmYWxzZSwiY2xpZW50SG9zdCI6IjE3Mi4yMC4wLjEiLCJwcmVmZXJyZWRfdXNlcm5hbWUiOiJzZXJ2aWNlLWFjY291bnQtY3VzdG9tZXItY2xpZW50IiwiY2xpZW50QWRkcmVzcyI6IjE3Mi4yMC4wLjEifQ.BTOG8aaFiU2YcWAtYH8l4b0Tp2pACFWEztH0TJDTQi1YlBESdy4YUROzv1ZHwWPqEgxEUtU9f01lEbhJj6cxryErfB5rOHmN1WxhhaRNDDQ0Nf4fmZ2Rj0Wgt3LTNudiI0u-coOJKCuxgreHbVmxLNNS4EFc0VogEcINeTpKUPb8w2uVGifn1bdHEAty7B1ETgo76MZ6DS9RE35ICNiPYlQWRZM812ms6l5znAnR2jcOrSH7bWQhkLJ0HcGeIx7sOJTl78PC_e0aqRkndnhMghX51qrXMIOpO8W3iV_NUqncxCcYcy3gBT6BtuGhn_QXnZS3b5J1x-NOsHRE6r2xYA',
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
    audience: 'customer-client',
    permission: 'Default Resource',
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
    audience: 'customer-client',
    permission: 'Other Resource',
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
