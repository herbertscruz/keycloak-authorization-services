/**
 * @group integration/test
 */
import debugPkg from 'debug';
import express, { NextFunction, Request, Response } from 'express';
import request from 'supertest';
import authorizationByPermission from '../authorizationByPermission';
const debug = debugPkg(
  'keycloak-authorization-service:authorization-by-permission-it'
);

// TODO: get access_token in Keycloak automatically
const token =
  'eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJiNGRfNG1ueXpLaTZHclhKWk1kbDIxanBOeHpJQk1fSWwyeTJweHhMeHQ0In0.eyJleHAiOjE2NjkyNTMyMTEsImlhdCI6MTY2OTI1MjkxMSwianRpIjoiOGQ0ZjM3NGItZGQ4Ni00MmI5LTg4N2EtZTZjNTU1ODdiMGRhIiwiaXNzIjoiaHR0cDovL2hvc3QuZG9ja2VyLmludGVybmFsOjgwODEvcmVhbG1zL21haW4iLCJhdWQiOiJhY2NvdW50Iiwic3ViIjoiNzljZDY3OTAtOWU3Ny00NzM3LTljZDctMzQ0MjAyNWI3ODUzIiwidHlwIjoiQmVhcmVyIiwiYXpwIjoiY3VzdG9tZXItY2xpZW50Iiwic2Vzc2lvbl9zdGF0ZSI6ImUzOTE4ZmZiLTkwYmUtNDc1Ny05MDRhLTRhNDRlZDdmMTgyZCIsImFjciI6IjEiLCJyZWFsbV9hY2Nlc3MiOnsicm9sZXMiOlsib2ZmbGluZV9hY2Nlc3MiLCJ1bWFfYXV0aG9yaXphdGlvbiIsImRlZmF1bHQtcm9sZXMtbWFpbiJdfSwicmVzb3VyY2VfYWNjZXNzIjp7ImFjY291bnQiOnsicm9sZXMiOlsibWFuYWdlLWFjY291bnQiLCJtYW5hZ2UtYWNjb3VudC1saW5rcyIsInZpZXctcHJvZmlsZSJdfX0sInNjb3BlIjoib3BlbmlkIHByb2ZpbGUgZW1haWwiLCJzaWQiOiJlMzkxOGZmYi05MGJlLTQ3NTctOTA0YS00YTQ0ZWQ3ZjE4MmQiLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwibmFtZSI6IkpvaG4gV2ljayIsInByZWZlcnJlZF91c2VybmFtZSI6ImpvaG53aWNrIiwiZ2l2ZW5fbmFtZSI6IkpvaG4iLCJmYW1pbHlfbmFtZSI6IldpY2siLCJlbWFpbCI6ImpvaG53aWNrQGdtYWlsLmNvbSJ9.IWCIa4in8XxjJPS47B-aqqlAF3Y880OKb6iei7jjtK8_kbZpCae6DO9e9gGh5oLRk6T6A3ytclmQn-rg4bzdjs2QH0rJkVhr2sLBgk4xUeJWis51BZibvdtg46_S4P_5dnkVX3On6Z4d5CSr3ttlUzw7tX1SzTh0sP8rC9bek-PXn0EGR7Lpx_d7c_-VaouUJsz6_HlmcWLUascCrfF9NeESoeIAz9OZLg7SvXwgp_hvRuHRENjr08V5O_bsB0i0Vf8S9qCU4qs5BjOBtIuk6_8UuUtSlQHuaUcMCnLUerZvT5j-RsyIs9tqUUMoswulYe2NNLwMMS2irQLBTFysLQ';

  const config = {
  baseUrl: 'http://host.docker.internal:8081',
  realm: 'main',
  clientId: 'customer-client',
  clientSecret: 'JaASlgV76n9a8IKx4oGgKi8h8ilHNAQ6',
};

const app = express();

[express.json(), express.urlencoded({ extended: true })].forEach((middleWare) =>
  app.use(middleWare)
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
    next: NextFunction
  ): Promise<void> {
    try {
      res.status(200).send({ message: 'Hello World!' });
    } catch (error) {
      next(error);
    }
  }
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
    next: NextFunction
  ): Promise<void> {
    try {
      res.status(200).send({ message: 'Hello World!' });
    } catch (error) {
      next(error);
    }
  }
);

describe('when requesting all authorization services endpoints and metadata', () => {
  it('should succeed', async () => {
    const res = await request(app)
      .get('/api/test/success')
      .set({
        Authorization: `Bearer ${token}`,
      });
    debug(res.body);
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: 'Hello World!' });
  });

  it('should failed', async () => {
    const res = await request(app)
      .get('/api/test/fail')
      .set({
        Authorization: `Bearer ${token}`,
      });
    debug(res.body);
    expect(res.statusCode).toEqual(500);
  });
});
