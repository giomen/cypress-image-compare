# Cypress Screenshot Compare

[![npm](https://img.shields.io/npm/v/cypress-screenshot-compare)](https://www.npmjs.com/package/cypress-screenshot-compare)


Module for adding visual regression testing to [Cypress](https://www.cypress.io/).

## Getting Started

Install:

```sh
$ npm install cypress-screenshot-compare
```

Add the following config to your *cypress.config.js* file:

```javascript
const { defineConfig } = require("cypress");
const getCompareSnapshotsPlugin = require('cypress-screenshot-compare/dist/plugin');

module.exports = defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      getCompareSnapshotsPlugin(on, config);
    },
  },
});
```

Add the command to *cypress/support/commands.js*:

```javascript
const compareSnapshotCommand = require('cypress-screenshot-compare/dist/command');

compareSnapshotCommand();
```

> Make sure you import *commands.js* in *cypress/support/e2e.js*:
>
> ```javascript
> import './commands'
> ```

### TypeScript

If you're using TypeScript, use files with a `.ts` extension, as follows:

*cypress/cypress.config.ts*

```ts
import { defineConfig } from 'cypress';
import getCompareSnapshotsPlugin from 'cypress-screenshot-compare/dist/plugin';

export default defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      getCompareSnapshotsPlugin(on, config);
    },
  },
});
```

*cypress/support/commands.ts*

```ts
import compareSnapshotCommand from 'cypress-screenshot-compare/dist/command';

compareSnapshotCommand();
```

*cypress/tsconfig.json*

```json:
{
  "compilerOptions": {
    "types": [
      "cypress",
      "cypress-screenshot-compare"
    ]
  }
}
```

For more info on how to use TypeScript with Cypress, please refer to [this document](https://docs.cypress.io/guides/tooling/typescript-support#Set-up-your-dev-environment).

### Options

There are two possible start-up options `update` and `compare`, defined in the `screenshotEvalType` field under 'env'
```javascript
{
  env: {
      screenshotEvalType: 'update'
  }
}
```
`update` will create/update the screenshots in the 'base' folder

`compare` will compare screenshots located in 'base' folder with the newer one created in the 'actual' folder. 
By default, it will automatically create a new screenshot if one is not already present in the 'actual' folder

`failSilently` is enabled by default. Add the following config to your *cypress.config.js* file to see the errors:

```javascript
{
  env: {
    failSilently: false
  }
}
```

You can also pass default [arguments](https://docs.cypress.io/api/cypress-api/screenshot-api.html#Arguments) to `compareSnapshotCommand()`:

```javascript
const compareSnapshotCommand = require('cypress-screenshot-compare/dist/command');

compareSnapshotCommand({
  capture: 'fullPage'
});
```

These will be used by default when no parameters are passed to the `compareSnapshot` command.

**Configure snapshot paths**

You can control where snapshots should be located by setting two environment variables:

| Variable                  | Description                                     |
|---------------------------|-------------------------------------------------|
| SNAPSHOT_BASE_DIRECTORY   | Directory of the base snapshots                 |
| SNAPSHOT_DIFF_DIRECTORY   | Directory for the snapshot difference           |
| INTEGRATION_FOLDER        | Used for computing correct snapshot directories |

The `actual` directory always points to the configured screenshot directory.

For more information regarding `INTEGRATION_FOLDER` please refer to [PR#139](https://github.com/cypress-image-compare/cypress-image-compare/pull/139)

**Configure snapshot generation**

In order to control the creation of diff images you may want to use the following environment variables which are
typically set by using the field `env` in configuration in `cypress.config.json`.

| Variable                        | Description                  |
|---------------------------------|------------------------------|
| ALWAYS_GENERATE_DIFF            | Boolean, defaults to `true`  |
| ALLOW_VISUAL_REGRESSION_TO_FAIL | Boolean, defaults to `false` |


`ALWAYS_GENERATE_DIFF` specifies if diff images are generated for successful tests.
If you only want the tests to create diff images based on your threshold without the tests to fail, you can set `ALLOW_VISUAL_REGRESSION_TO_FAIL`.
If this variable is set, diffs will be computed using your thresholds but tests will not fail if a diff is found.

If you want to see all diff images which are different (based on your thresholds), use the following in your `cypress.config.json`:
```json
{
  "env": {
    "ALWAYS_GENERATE_DIFF": false,
    "ALLOW_VISUAL_REGRESSION_TO_FAIL": true
  }
}
```

## To Use

Add `cy.compareSnapshot('home');` in your tests specs whenever you want to test for screenshot comparison, making sure to replace `home` with a relevant name. You can also add an optional error threshold: Value can range from 0.00 (no difference) to 1.00 (every pixel is different). So, if you enter an error threshold of 0.51, the test would fail only if > 51% of pixels are different.

More examples:

| Threshold | Fails when |
|-----------|------------|
| .25 | > 25%  |
| .30 | > 30% |
| .50 | > 50% |
| .75 | > 75% |


Sample:

```js
it('should display the login page correctly', () => {
  cy.visit('/03.html');
  cy.get('H1').contains('Login');
  cy.compareSnapshot('login', 0.0);
  cy.compareSnapshot('login', 0.1);
});
```

You can target a single HTML element as well:

```js
cy.get('#my-header').compareSnapshot('just-header')
```



```
Based on cypress-visual-regression
```
