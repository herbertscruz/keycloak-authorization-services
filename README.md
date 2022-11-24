# keycloak-authorization-services

This library implements the [Keycloak Authorization Service](https://www.keycloak.org/docs/latest/authorization_services/#_service_overview).

## Installation

```sh
npm install keycloak-authorization-services
```

## Usage

```js
import express, { NextFunction, Request, Response } from 'express';
import { authorizationByPermission } from '../authorizationByPermission';

/* Start: Define general settings */
const config = {
  baseUrl: 'http://host.docker.internal:8081',
  realm: 'main',
  clientId: 'customer-client',
  clientSecret: 'JaASlgV76n9a8IKx4oGgKi8h8ilHNAQ6',
};
/* End: Define general settings */

const app = express();

app.get(
  '/api/tests',

  /* Start: Adds authorization middleware by permissions */
  authorizationByPermission(config, {
    audience: 'customer-client',
    permission: 'Default Resource',
  }),
  /* End: Adds authorization middleware by permissions */

  async function (
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    //...
  },
);

```

## Backlog

- [x] Discovering authorization services endpoints and metadata
- [x] Authorization request for specific resources protected by a resource server
- [x] Authorization request for any resource and scope protected by a resource server
- [ ] Authorization request for UMA protected resource after receiving a permission ticket from the resource server as part of the authorization process
- [x] Client authentication methods when acting on behalf of a user
- [x] Client authentication methods when acting on your behalf
- [ ] Push arbitrary claims
- [ ] Token RPT introspection