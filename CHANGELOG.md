# Changelog

## v0.38.1

[compare changes](https://github.com/kiki-core-stack/pack/compare/v0.38.0...v0.38.1)

### 🩹 Fixes

- **hono-backend:** Resolve response error handling issue ([9c6371c](https://github.com/kiki-core-stack/pack/commit/9c6371c))

### ❤️ Contributors

- kiki-kanri

## v0.38.0

[compare changes](https://github.com/kiki-core-stack/pack/compare/v0.37.0...v0.38.0)

### 🚀 Enhancements

- Add 429 status to `statusCodeToResponseMessageMap` ([024a4ed](https://github.com/kiki-core-stack/pack/commit/024a4ed))

### 💅 Refactors

- ⚠️ Migrate from hyper-express-backend to hono-backend ([7ad324a](https://github.com/kiki-core-stack/pack/commit/7ad324a))

### 🏡 Chore

- Remove zod-openapi file ([92bd76c](https://github.com/kiki-core-stack/pack/commit/92bd76c))

#### ⚠️ Breaking Changes

- ⚠️ Migrate from hyper-express-backend to hono-backend ([7ad324a](https://github.com/kiki-core-stack/pack/commit/7ad324a))

### ❤️ Contributors

- kiki-kanri

## v0.37.0

[compare changes](https://github.com/kiki-core-stack/pack/compare/v0.36.0...v0.37.0)

### 💅 Refactors

- Replace `Partial<Record` with `PartialRecord` ([aef6899](https://github.com/kiki-core-stack/pack/commit/aef6899))

### 🏡 Chore

- Update import order ([f80029a](https://github.com/kiki-core-stack/pack/commit/f80029a))
- Upgrade dependencies and modify release script ([912687d](https://github.com/kiki-core-stack/pack/commit/912687d))
- ⚠️ Move mongoose-related dependencies to devDependencies ([915d7fa](https://github.com/kiki-core-stack/pack/commit/915d7fa))

#### ⚠️ Breaking Changes

- ⚠️ Move mongoose-related dependencies to devDependencies ([915d7fa](https://github.com/kiki-core-stack/pack/commit/915d7fa))

### ❤️ Contributors

- kiki-kanri

## v0.36.0

[compare changes](https://github.com/kiki-core-stack/pack/compare/v0.35.0...v0.36.0)

### 🚀 Enhancements

- Export `AdminMethodsAndOverrides` interface ([cc9d001](https://github.com/kiki-core-stack/pack/commit/cc9d001))

### 💅 Refactors

- Modify the instantiation method of `redisController` ([51f09dd](https://github.com/kiki-core-stack/pack/commit/51f09dd))
- Rename cryptoSha3256 to cryptoSHA3256 ([2da2622](https://github.com/kiki-core-stack/pack/commit/2da2622))
- Change Totp and Otp to uppercase naming ([e104923](https://github.com/kiki-core-stack/pack/commit/e104923))
- Change Api to uppercase naming ([bf8b163](https://github.com/kiki-core-stack/pack/commit/bf8b163))
- Update method for handling port value when using `createTransport` ([60952bf](https://github.com/kiki-core-stack/pack/commit/60952bf))

### 🏡 Chore

- Upgrade dependencies ([549e036](https://github.com/kiki-core-stack/pack/commit/549e036))
- Update import path for `setReadonlyConstantToGlobalThis` ([a33a2ff](https://github.com/kiki-core-stack/pack/commit/a33a2ff))
- Remove .npmrc and refresh dependencies list ([37acf67](https://github.com/kiki-core-stack/pack/commit/37acf67))
- Modify rollup node external config ([5ab3115](https://github.com/kiki-core-stack/pack/commit/5ab3115))
- Switch changelog generation package and upgrade dependencies ([3ef527d](https://github.com/kiki-core-stack/pack/commit/3ef527d))
- Add release script to package.json ([4d82d80](https://github.com/kiki-core-stack/pack/commit/4d82d80))
- Modify tsconfig.json ([d66917d](https://github.com/kiki-core-stack/pack/commit/d66917d))
- Remove tslib ([da6a141](https://github.com/kiki-core-stack/pack/commit/da6a141))
- Move some dependencies to devDependencies ([99b6ef2](https://github.com/kiki-core-stack/pack/commit/99b6ef2))

### ❤️ Contributors

- kiki-kanri

## v0.35.0

[compare changes](https://github.com/kiki-core-stack/pack/compare/v0.34.1...v0.35.0)

### 🚀 Enhancements

- Exclude `createdByAdmin` and `editedByAdmin` fields from ZodValidatorType keys ([e64957f](https://github.com/kiki-core-stack/pack/commit/e64957f))

### 💅 Refactors

- Change some relative import paths to use `@/` ([242e93c](https://github.com/kiki-core-stack/pack/commit/242e93c))

### 🏡 Chore

- Remove default export from redisController ([3920b3b](https://github.com/kiki-core-stack/pack/commit/3920b3b))
- Run tsc-alias command after build ([04e8546](https://github.com/kiki-core-stack/pack/commit/04e8546))
- Set paths field in tsconfig.json ([d12ee92](https://github.com/kiki-core-stack/pack/commit/d12ee92))

### ❤️ Contributors

- kiki-kanri

## v0.34.1

[compare changes](https://github.com/kiki-core-stack/pack/compare/v0.34.0...v0.34.1)

### 🩹 Fixes

- Resolve `ZodValidatorType` type errors ([d8405ef](https://github.com/kiki-core-stack/pack/commit/d8405ef))

### ❤️ Contributors

- kiki-kanri

## v0.34.0

[compare changes](https://github.com/kiki-core-stack/pack/compare/v0.33.0...v0.34.0)

### 🚀 Enhancements

- Add global `ZodValidatorType` type ([396a2f7](https://github.com/kiki-core-stack/pack/commit/396a2f7))

### 💅 Refactors

- Use function to handle binding values to globalThis ([a1e719e](https://github.com/kiki-core-stack/pack/commit/a1e719e))

### ❤️ Contributors

- kiki-kanri

## v0.33.0

[compare changes](https://github.com/kiki-core-stack/pack/compare/v0.32.0...v0.33.0)

### 🚀 Enhancements

- **hyper-express-backend:** Add `createApiSuccessResponseData` API utility ([689b02d](https://github.com/kiki-core-stack/pack/commit/689b02d))

### 🩹 Fixes

- Resolve unused imported types issue ([8423f72](https://github.com/kiki-core-stack/pack/commit/8423f72))

### 💅 Refactors

- **hyper-express-backend:** Rename ApiError class and update binding to globalThis ([cbaf643](https://github.com/kiki-core-stack/pack/commit/cbaf643))
- Update regex pattern for validating telegramSuperGroupId in zod validator ([96ee34c](https://github.com/kiki-core-stack/pack/commit/96ee34c))
- Change binding of constants or functions to globalThis to use `Object.defineProperty` ([72aab30](https://github.com/kiki-core-stack/pack/commit/72aab30))

### 🏡 Chore

- Remove unused imports ([d586b10](https://github.com/kiki-core-stack/pack/commit/d586b10))

### ❤️ Contributors

- kiki-kanri

## v0.32.0

[compare changes](https://github.com/kiki-core-stack/pack/compare/v0.31.0...v0.32.0)

### 🚀 Enhancements

- **hyper-express-backend:** Bind zod's z constant to globalThis when importing globals ([78b6700](https://github.com/kiki-core-stack/pack/commit/78b6700))
- **hyper-express-backend:** Add handling for zod errors ([0c13fa4](https://github.com/kiki-core-stack/pack/commit/0c13fa4))

### ❤️ Contributors

- kiki-kanri

## v0.31.0

[compare changes](https://github.com/kiki-core-stack/pack/compare/v0.30.0...v0.31.0)

### 🩹 Fixes

- Set ApiError instance message directly from input value or default value instead of response text ([ceba479](https://github.com/kiki-core-stack/pack/commit/ceba479))

### 💅 Refactors

- **hyper-express-backend:** Merge files in `constants/response` folder ([7d86e17](https://github.com/kiki-core-stack/pack/commit/7d86e17))
- Migrate hono-backend error-handling setup to hyper-express-backend ([3b06431](https://github.com/kiki-core-stack/pack/commit/3b06431))
- Migrate hono-backend image utils to hyper-express-backend ([68c2443](https://github.com/kiki-core-stack/pack/commit/68c2443))
- Migrate hono-backend two-factor-authentication utils to hyper-express-backend globals ([b8ff90b](https://github.com/kiki-core-stack/pack/commit/b8ff90b))

### 🏡 Chore

- Update rollup nodeExternal list ([37daa07](https://github.com/kiki-core-stack/pack/commit/37daa07))
- Move hono-backend folder to temporary storage folder ([52335b8](https://github.com/kiki-core-stack/pack/commit/52335b8))
- Remove hono and bun dependencies ([6580d6d](https://github.com/kiki-core-stack/pack/commit/6580d6d))
- Add @kikiutils/hyper-express dependency ([7933fa2](https://github.com/kiki-core-stack/pack/commit/7933fa2))
- Migrate hono-backend constants to hyper-express-backend ([2d3f4d7](https://github.com/kiki-core-stack/pack/commit/2d3f4d7))
- Migrate hono-backend api error class to hyper-express-backend ([cacddc5](https://github.com/kiki-core-stack/pack/commit/cacddc5))
- **hyper-express-backend:** Remove `jsonResponseHeaders` constant ([b14879c](https://github.com/kiki-core-stack/pack/commit/b14879c))
- Migrate hono-backend api utils to hyper-express-backend ([ec5c5fa](https://github.com/kiki-core-stack/pack/commit/ec5c5fa))
- Migrate hono-backend mongoose-model-statics setup to hyper-express-backend ([12b0297](https://github.com/kiki-core-stack/pack/commit/12b0297))
- Remove unused files ([5c97afb](https://github.com/kiki-core-stack/pack/commit/5c97afb))

### ❤️ Contributors

- kiki-kanri

## v0.30.0

[compare changes](https://github.com/kiki-core-stack/pack/compare/v0.29.1...v0.30.0)

### 🚀 Enhancements

- **hono-backend:** Add zValidator global function ([706d7ac](https://github.com/kiki-core-stack/pack/commit/706d7ac))

### 🩹 Fixes

- Correct export method for zod wrapped constants ([93e2e4e](https://github.com/kiki-core-stack/pack/commit/93e2e4e))

### ❤️ Contributors

- kiki-kanri

## v0.29.1

[compare changes](https://github.com/kiki-core-stack/pack/compare/v0.29.0...v0.29.1)

### 🩹 Fixes

- Modify zod extension to prevent emitting internal types during ts build ([49825c5](https://github.com/kiki-core-stack/pack/commit/49825c5))

### ❤️ Contributors

- kiki-kanri

## v0.29.0

[compare changes](https://github.com/kiki-core-stack/pack/compare/v0.28.0...v0.29.0)

### 🚀 Enhancements

- Add custom zod object extension in constants file ([c5d9484](https://github.com/kiki-core-stack/pack/commit/c5d9484))
- **hono-backend:** Add zod global file ([9513d18](https://github.com/kiki-core-stack/pack/commit/9513d18))
- **hono-backend:** Add two-factor authentication global utils ([41cb1ba](https://github.com/kiki-core-stack/pack/commit/41cb1ba))

### 💅 Refactors

- **hono-backend:** Replace mongoose mongo error handling with native mongodb package ([e4ed82f](https://github.com/kiki-core-stack/pack/commit/e4ed82f))

### 🏡 Chore

- Remove all ajv dependencies, constants, and utils ([e50f00c](https://github.com/kiki-core-stack/pack/commit/e50f00c))
- Update import path for `AdminModel` in `scripts/create-admin.ts` ([07f06e1](https://github.com/kiki-core-stack/pack/commit/07f06e1))

### ❤️ Contributors

- kiki-kanri

## v0.28.0

[compare changes](https://github.com/kiki-core-stack/pack/compare/v0.27.0...v0.28.0)

### 🚀 Enhancements

- **hono-backend:** Add 200 and 500 status codes to `statusCodeToMessageMap` ([4be1f1a](https://github.com/kiki-core-stack/pack/commit/4be1f1a))
- **hono-backend:** Allow setting Context type parameter in `defineApiHandler` and `defineRouteHandler` ([5d59d52](https://github.com/kiki-core-stack/pack/commit/5d59d52))
- **hono-backend:** Add response related constants ([bb65e10](https://github.com/kiki-core-stack/pack/commit/bb65e10))
- **hono-backend:** Add global API utils ([16d10c8](https://github.com/kiki-core-stack/pack/commit/16d10c8))
- **hono-backend:** Add `compileHonoRequestDataAjvValidator` global util ([bd66e09](https://github.com/kiki-core-stack/pack/commit/bd66e09))
- **hono-backend:** Add global API error class ([d61c223](https://github.com/kiki-core-stack/pack/commit/d61c223))
- **hono-backend:** Add zod-openapi related global utils ([f075f54](https://github.com/kiki-core-stack/pack/commit/f075f54))
- Export types from `@kikiutils/mongoose/types` ([ca9fcbb](https://github.com/kiki-core-stack/pack/commit/ca9fcbb))
- **hono-backend:** Add image utils ([7fb1a7c](https://github.com/kiki-core-stack/pack/commit/7fb1a7c))
- **hono-backend:** Add setup error-handling file ([ba1993d](https://github.com/kiki-core-stack/pack/commit/ba1993d))
- **hono-backend:** Add setup mongoose-model-statics file ([fe7fd1a](https://github.com/kiki-core-stack/pack/commit/fe7fd1a))

### 🩹 Fixes

- **hono-backend:** Resolve type error in `defineApiHandler` ([e0b1f9d](https://github.com/kiki-core-stack/pack/commit/e0b1f9d))

### 💅 Refactors

- **hono-backend:** Remove `defaultApiRouteConfig.request.headers` setting ([3399cb6](https://github.com/kiki-core-stack/pack/commit/3399cb6))
- **hono-backend:** Update definition of `defaultApiRouteConfig` ([a7fbf4d](https://github.com/kiki-core-stack/pack/commit/a7fbf4d))
- **hono-backend:** Remove server and APIs setup files ([be0eb89](https://github.com/kiki-core-stack/pack/commit/be0eb89))
- **hono-backend:** Remove types-related files ([f689a1f](https://github.com/kiki-core-stack/pack/commit/f689a1f))
- **hono-backend:** Move `statusCodeToMessageMap` to constants folder ([f687ae3](https://github.com/kiki-core-stack/pack/commit/f687ae3))
- ⚠️ Move `mongooseConnections` export to `constants/mongoose.ts` ([6c43d17](https://github.com/kiki-core-stack/pack/commit/6c43d17))

### 🏡 Chore

- **hono-backend:** Remove all files and related dependencies ([89a5c4a](https://github.com/kiki-core-stack/pack/commit/89a5c4a))

#### ⚠️ Breaking Changes

- ⚠️ Move `mongooseConnections` export to `constants/mongoose.ts` ([6c43d17](https://github.com/kiki-core-stack/pack/commit/6c43d17))

### ❤️ Contributors

- kiki-kanri

## v0.27.0

[compare changes](https://github.com/kiki-core-stack/pack/compare/v0.26.1...v0.27.0)

### 🚀 Enhancements

- **hono-backend:** Add zod openapi dependencies and global utils ([b179bf7](https://github.com/kiki-core-stack/pack/commit/b179bf7))
- **hono-backend:** Add `zod-openapi-server.ts` file ([fe5325b](https://github.com/kiki-core-stack/pack/commit/fe5325b))
- **hono-backend:** Add zod openapi route handling in APIs setup ([23b1c1c](https://github.com/kiki-core-stack/pack/commit/23b1c1c))

### ❤️ Contributors

- kiki-kanri

## v0.26.1

[compare changes](https://github.com/kiki-core-stack/pack/compare/v0.26.0...v0.26.1)

### 💅 Refactors

- **hono-backend:** Rewrite code for loading APIs ([12ce7e8](https://github.com/kiki-core-stack/pack/commit/12ce7e8))
- **hono-backend:** Update handling of server hostname and port values ([ba8d4c6](https://github.com/kiki-core-stack/pack/commit/ba8d4c6))

### ❤️ Contributors

- kiki-kanri

## v0.26.0

[compare changes](https://github.com/kiki-core-stack/pack/compare/v0.25.0...v0.26.0)

### 🚀 Enhancements

- **hono-backend:** Add message for 413 status code in `statusCodeToMessageMap` ([490b9c6](https://github.com/kiki-core-stack/pack/commit/490b9c6))

### 💅 Refactors

- **hono-backend:** Rename `utils/validator.ts` to `utils/ajv-validator.ts` and fix incorrect function name ([2eeb36d](https://github.com/kiki-core-stack/pack/commit/2eeb36d))
- ⚠️ Rename `constants/validator.ts` to `constants/ajv-validator.ts` and merge `utils/validator.ts` ([1b3695d](https://github.com/kiki-core-stack/pack/commit/1b3695d))

### 🏡 Chore

- Update vscode settings file and upgrade dependencies ([480cc2a](https://github.com/kiki-core-stack/pack/commit/480cc2a))

#### ⚠️ Breaking Changes

- ⚠️ Rename `constants/validator.ts` to `constants/ajv-validator.ts` and merge `utils/validator.ts` ([1b3695d](https://github.com/kiki-core-stack/pack/commit/1b3695d))

### ❤️ Contributors

- kiki-kanri

## v0.25.0

[compare changes](https://github.com/kiki-core-stack/pack/compare/v0.24.1...v0.25.0)

### 🚀 Enhancements

- **hono-backend:** Add `getClientIpFromXForwardedForHeader` global util ([92446e4](https://github.com/kiki-core-stack/pack/commit/92446e4))

### ❤️ Contributors

- kiki-kanri

## v0.24.1

[compare changes](https://github.com/kiki-core-stack/pack/compare/v0.24.0...v0.24.1)

### 🔥 Performance

- **hono-backend:** Optimize error handling by reusing ApiError messages ([8eccef3](https://github.com/kiki-core-stack/pack/commit/8eccef3))

### 🩹 Fixes

- **hono-backend:** Fix incorrect route paths in automatic API route loading ([3c27ce0](https://github.com/kiki-core-stack/pack/commit/3c27ce0))

### ❤️ Contributors

- kiki-kanri

## v0.24.0

[compare changes](https://github.com/kiki-core-stack/pack/compare/v0.23.0...v0.24.0)

### 🚀 Enhancements

- Add two-factor authentication utils from nitro to hono backend utils ([941ef6b](https://github.com/kiki-core-stack/pack/commit/941ef6b))
- Add `defineRouteHandler` util to hono-backend ([d09d223](https://github.com/kiki-core-stack/pack/commit/d09d223))

### 💅 Refactors

- Update import paths in `scripts/send-admin-email-otp-code.ts` ([d1773ba](https://github.com/kiki-core-stack/pack/commit/d1773ba))
- **hono-backend:** Move mongoose-related type definitions to mongoose setup file ([0501562](https://github.com/kiki-core-stack/pack/commit/0501562))

### 🏡 Chore

- Move `nodemailer` to devDependencies ([ae2b5a4](https://github.com/kiki-core-stack/pack/commit/ae2b5a4))
- Update example env and npm registry setup ([b66e554](https://github.com/kiki-core-stack/pack/commit/b66e554))

### ❤️ Contributors

- kiki-kanri

## v0.23.0

[compare changes](https://github.com/kiki-core-stack/pack/compare/v0.22.1...v0.23.0)

### 🚀 Enhancements

- Add hono devDependency ([6c85f0b](https://github.com/kiki-core-stack/pack/commit/6c85f0b))
- Add basic server files for hono backend ([ce4a556](https://github.com/kiki-core-stack/pack/commit/ce4a556))
- Add API utils for hono backend ([38b3512](https://github.com/kiki-core-stack/pack/commit/38b3512))
- Add dynamic API loading for hono backend ([ac8ddf6](https://github.com/kiki-core-stack/pack/commit/ac8ddf6))

### 💅 Refactors

- Remove or migrate files from nitro folder to `hono-backend` ([b931ad5](https://github.com/kiki-core-stack/pack/commit/b931ad5))
- Migrate `compileH3RequestDataValidator` utils to hono backend ([3fb40aa](https://github.com/kiki-core-stack/pack/commit/3fb40aa))
- Migrate nitro image utils to hono backend ([5e3b3cf](https://github.com/kiki-core-stack/pack/commit/5e3b3cf))
- Update usage of was magic ([42956bb](https://github.com/kiki-core-stack/pack/commit/42956bb))

### 🏡 Chore

- Remove h3 and nitro dependencies ([85d1073](https://github.com/kiki-core-stack/pack/commit/85d1073))
- Remove all nitro-related files ([d1153ea](https://github.com/kiki-core-stack/pack/commit/d1153ea))
- Update dependencies and rollup nodeExternal plugin include list ([d683f66](https://github.com/kiki-core-stack/pack/commit/d683f66))

### ❤️ Contributors

- kiki-kanri

## v0.22.1

[compare changes](https://github.com/kiki-core-stack/pack/compare/v0.22.0...v0.22.1)

### 🏡 Chore

- Auto-generate `exports` configuration in package.json ([56a05fb](https://github.com/kiki-core-stack/pack/commit/56a05fb))

### ❤️ Contributors

- kiki-kanri

## v0.22.0

[compare changes](https://github.com/kiki-core-stack/pack/compare/v0.21.0...v0.22.0)

### 🚀 Enhancements

- Add `acceptedImageMimeTypes` constant ([1941b4c](https://github.com/kiki-core-stack/pack/commit/1941b4c))
- Add related dependencies and `isAcceptedImageFile` and `getFileMimeType` utilities ([823bfa0](https://github.com/kiki-core-stack/pack/commit/823bfa0))
- Add `convertAndSaveImageFile` util and related dependencies ([9a156bc](https://github.com/kiki-core-stack/pack/commit/9a156bc))
- Add image-related utilities for nitro ([21bcc8c](https://github.com/kiki-core-stack/pack/commit/21bcc8c))

### 💅 Refactors

- Move `emailOtpExpirationSeconds` and `sendEmailOtpCodeCoolingSeconds` constants to `constants/two-factor-authentication.ts` ([027b12d](https://github.com/kiki-core-stack/pack/commit/027b12d))
- Remove constants export from `nitro/utils/index.ts` ([4bef3c3](https://github.com/kiki-core-stack/pack/commit/4bef3c3))

### 🏡 Chore

- Update `nodeExternal.include` list in build configuration ([2fcb5e9](https://github.com/kiki-core-stack/pack/commit/2fcb5e9))

### ❤️ Contributors

- kiki-kanri

## v0.21.0

[compare changes](https://github.com/kiki-core-stack/pack/compare/v0.20.1...v0.21.0)

### 💅 Refactors

- ⚠️ Update exports in `nitro/utils/index.ts` ([e88eb87](https://github.com/kiki-core-stack/pack/commit/e88eb87))

#### ⚠️ Breaking Changes

- ⚠️ Update exports in `nitro/utils/index.ts` ([e88eb87](https://github.com/kiki-core-stack/pack/commit/e88eb87))

### ❤️ Contributors

- kiki-kanri

## v0.20.1

[compare changes](https://github.com/kiki-core-stack/pack/compare/v0.20.0...v0.20.1)

### 🏡 Chore

- Update devDependencies list ([bdaeb2b](https://github.com/kiki-core-stack/pack/commit/bdaeb2b))

### ❤️ Contributors

- kiki-kanri

## v0.20.0

[compare changes](https://github.com/kiki-core-stack/pack/compare/v0.19.0...v0.20.0)

### 💅 Refactors

- Update `adminSchema.totpSecret` index configuration ([8f5b59e](https://github.com/kiki-core-stack/pack/commit/8f5b59e))

### 🏡 Chore

- Add .npmrc file ([849e457](https://github.com/kiki-core-stack/pack/commit/849e457))
- ⚠️  Move some dependencies to devDependencies ([cf35154](https://github.com/kiki-core-stack/pack/commit/cf35154))

#### ⚠️ Breaking Changes

- ⚠️  Move some dependencies to devDependencies ([cf35154](https://github.com/kiki-core-stack/pack/commit/cf35154))

### ❤️ Contributors

- kiki-kanri

## v0.19.0

[compare changes](https://github.com/kiki-core-stack/pack/compare/v0.18.0...v0.19.0)

### 🚀 Enhancements

- Add socket.io-client dependencies ([df38c71](https://github.com/kiki-core-stack/pack/commit/df38c71))
- Add `createSocketIoClient` utility ([05cc13e](https://github.com/kiki-core-stack/pack/commit/05cc13e))
- Add socket.io event constants and related type definitions ([545b457](https://github.com/kiki-core-stack/pack/commit/545b457))

### 🏡 Chore

- Upgrade dependencies ([f782b32](https://github.com/kiki-core-stack/pack/commit/f782b32))

### ❤️ Contributors

- kiki-kanri

## v0.18.0

[compare changes](https://github.com/kiki-core-stack/pack/compare/v0.17.1...v0.18.0)

### 💅 Refactors

- ⚠️ Move mongoose-setup to nitro plugin ([8d726af](https://github.com/kiki-core-stack/pack/commit/8d726af))

#### ⚠️ Breaking Changes

- ⚠️ Move mongoose-setup to nitro plugin ([8d726af](https://github.com/kiki-core-stack/pack/commit/8d726af))

### ❤️ Contributors

- kiki-kanri

## v0.17.1

[compare changes](https://github.com/kiki-core-stack/pack/compare/v0.17.0...v0.17.1)

### 🏡 Chore

- Remove unnecessary types export files ([eb2c7e8](https://github.com/kiki-core-stack/pack/commit/eb2c7e8))

### ❤️ Contributors

- kiki-kanri

## v0.17.0

[compare changes](https://github.com/kiki-core-stack/pack/compare/v0.16.0...v0.17.0)

### 🚀 Enhancements

- Add default export to mongoose-setup ([b58cf8c](https://github.com/kiki-core-stack/pack/commit/b58cf8c))

### 🩹 Fixes

- Add h3 dependency to rollup node externals list ([2f968c9](https://github.com/kiki-core-stack/pack/commit/2f968c9))

### 💅 Refactors

- Simplify some import paths ([eb95ef6](https://github.com/kiki-core-stack/pack/commit/eb95ef6))
- ⚠️  Move API error class to nitro folder ([86e4ac5](https://github.com/kiki-core-stack/pack/commit/86e4ac5))

#### ⚠️ Breaking Changes

- ⚠️  Move API error class to nitro folder ([86e4ac5](https://github.com/kiki-core-stack/pack/commit/86e4ac5))

### ❤️ Contributors

- kiki-kanri

## v0.16.0

[compare changes](https://github.com/kiki-core-stack/pack/compare/v0.15.0...v0.16.0)

### 💅 Refactors

- ⚠️ Move h3-related mongoose schema static methods and types to nitro folder ([a7f0436](https://github.com/kiki-core-stack/pack/commit/a7f0436))

### 🏡 Chore

- Upgrade nitropack to v3 beta ([30b6f16](https://github.com/kiki-core-stack/pack/commit/30b6f16))
- ⚠️ Rename nitropack folder to nitro ([c302845](https://github.com/kiki-core-stack/pack/commit/c302845))
- Upgrade dependencies ([0231f27](https://github.com/kiki-core-stack/pack/commit/0231f27))

#### ⚠️ Breaking Changes

- ⚠️ Move h3-related mongoose schema static methods and types to nitro folder ([a7f0436](https://github.com/kiki-core-stack/pack/commit/a7f0436))
- ⚠️ Rename nitropack folder to nitro ([c302845](https://github.com/kiki-core-stack/pack/commit/c302845))

### ❤️ Contributors

- kiki-kanri

## v0.15.0

[compare changes](https://github.com/kiki-core-stack/pack/compare/v0.14.1...v0.15.0)

### 🚀 Enhancements

- Export `flattenToSingleValue` in nitropack utils ([bd84306](https://github.com/kiki-core-stack/pack/commit/bd84306))

### 🏡 Chore

- Upgrade dependencies ([9a1105e](https://github.com/kiki-core-stack/pack/commit/9a1105e))

### ❤️ Contributors

- kiki-kanri

## v0.14.1

[compare changes](https://github.com/kiki-core-stack/pack/compare/v0.14.0...v0.14.1)

### 🩹 Fixes

- Validate if id can be converted to `ObjectId` in `findByRouteIdOrThrowNotFoundError` static method ([ae0fc4f](https://github.com/kiki-core-stack/pack/commit/ae0fc4f))

### ❤️ Contributors

- kiki-kanri

## v0.14.0

[compare changes](https://github.com/kiki-core-stack/pack/compare/v0.13.0...v0.14.0)

### 🚀 Enhancements

- ⚠️ Add `filterQuery` parameter to `findByRouteIdOrThrowNotFoundError` static method in model ([123808e](https://github.com/kiki-core-stack/pack/commit/123808e))

### 🩹 Fixes

- Add `InstanceMethodsAndOverrides` type parameter to `MongooseFindOneReturnType` usage ([b28df6a](https://github.com/kiki-core-stack/pack/commit/b28df6a))

### 💅 Refactors

- Use `Object.freeze` to freeze some constants ([cdfa49a](https://github.com/kiki-core-stack/pack/commit/cdfa49a))
- Update type definitions for constants defined with `Object.freeze` ([c332777](https://github.com/kiki-core-stack/pack/commit/c332777))

### 🏡 Chore

- Upgrade dependencies ([049853e](https://github.com/kiki-core-stack/pack/commit/049853e))

#### ⚠️ Breaking Changes

- ⚠️ Add `filterQuery` parameter to `findByRouteIdOrThrowNotFoundError` static method in model ([123808e](https://github.com/kiki-core-stack/pack/commit/123808e))

### ❤️ Contributors

- kiki-kanri

## v0.13.0

[compare changes](https://github.com/kiki-core-stack/pack/compare/v0.12.3...v0.13.0)

### 🚀 Enhancements

- Add error handler for nitropack ([d3a0597](https://github.com/kiki-core-stack/pack/commit/d3a0597))

### 💅 Refactors

- Update static method definition in model ([5172403](https://github.com/kiki-core-stack/pack/commit/5172403))

### 🏡 Chore

- Update example env and upgrade dependencies ([2250cde](https://github.com/kiki-core-stack/pack/commit/2250cde))
- Update `build-and-publish` script ([2efe7d0](https://github.com/kiki-core-stack/pack/commit/2efe7d0))
- Modify file permissions ([9bca6ac](https://github.com/kiki-core-stack/pack/commit/9bca6ac))
- Upgrade dependencies ([7c72bc4](https://github.com/kiki-core-stack/pack/commit/7c72bc4))

### ❤️ Contributors

- kiki-kanri

## v0.12.3

[compare changes](https://github.com/kiki-core-stack/pack/compare/v0.12.2...v0.12.3)

### 💅 Refactors

- **types:** Update `AjvValidatorJSONSchema` to refine generic parameter constraints ([dfebd53](https://github.com/kiki-core-stack/pack/commit/dfebd53))

### 🏡 Chore

- Upgrade dependencies ([43c5b5a](https://github.com/kiki-core-stack/pack/commit/43c5b5a))

### ❤️ Contributors

- kiki-kanri

## v0.12.2

[compare changes](https://github.com/kiki-core-stack/pack/compare/v0.12.1...v0.12.2)

### 💅 Refactors

- Update references to old organization name due to name change ([ba28cdb](https://github.com/kiki-core-stack/pack/commit/ba28cdb))
- Update return type of requestApi function in api-requests to possibly be undefined ([48f3f1a](https://github.com/kiki-core-stack/pack/commit/48f3f1a))

### 🏡 Chore

- Update example env file ([a5b3018](https://github.com/kiki-core-stack/pack/commit/a5b3018))
- Upgrade dependencies ([251af1e](https://github.com/kiki-core-stack/pack/commit/251af1e))

### ❤️ Contributors

- kiki-kanri

## v0.12.1

[compare changes](https://github.com/kiki-core-stack/pack/compare/v0.12.0...v0.12.1)

### 🩹 Fixes

- Resolve issue where email OTP resend was blocked after a failed attempt ([dd20224](https://github.com/kiki-core-stack/pack/commit/dd20224))

### 💅 Refactors

- Replace ts-ignore with ts-expect-error ([6b9b1d3](https://github.com/kiki-core-stack/pack/commit/6b9b1d3))
- Move send-admin-email-otp-code to scripts directory ([daf9185](https://github.com/kiki-core-stack/pack/commit/daf9185))

### 🏡 Chore

- Update include fields in tsconfig ([a47144c](https://github.com/kiki-core-stack/pack/commit/a47144c))
- Remove unused imports ([8af323c](https://github.com/kiki-core-stack/pack/commit/8af323c))
- Update tsconfig.json ([1e6dfad](https://github.com/kiki-core-stack/pack/commit/1e6dfad))

### ❤️ Contributors

- kiki-kanri

## v0.12.0

[compare changes](https://github.com/kiki-core-stack/pack/compare/v0.11.1...v0.12.0)

### 🚀 Enhancements

- Add `createApiErrorAndThrow` utils ([b46ac0b](https://github.com/kiki-core-stack/pack/commit/b46ac0b))

### 💅 Refactors

- ⚠️  Rename `createResponseData` to `createApiSuccessResponseData` and update file name ([88b8f7b](https://github.com/kiki-core-stack/pack/commit/88b8f7b))
- Update method for creating and throwing `ApiError` ([74e5fcf](https://github.com/kiki-core-stack/pack/commit/74e5fcf))

#### ⚠️ Breaking Changes

- ⚠️  Rename `createResponseData` to `createApiSuccessResponseData` and update file name ([88b8f7b](https://github.com/kiki-core-stack/pack/commit/88b8f7b))

### ❤️ Contributors

- kiki-kanri

## v0.11.1

[compare changes](https://github.com/kiki-core-stack/pack/compare/v0.11.0...v0.11.1)

### 💅 Refactors

- Update error logging logic in unified error handling hook ([1cc4a84](https://github.com/kiki-core-stack/pack/commit/1cc4a84))

### ❤️ Contributors

- kiki-kanri

## v0.11.0

[compare changes](https://github.com/kiki-core-stack/pack/compare/v0.10.0...v0.11.0)

### 🚀 Enhancements

- Add ApiError class ([85afdc2](https://github.com/kiki-core-stack/pack/commit/85afdc2))
- Log original error in unified error handling hook ([c453f44](https://github.com/kiki-core-stack/pack/commit/c453f44))

### 💅 Refactors

- Modify `createApiError` to instantiate `ApiError` instead of `H3Error` ([74aab91](https://github.com/kiki-core-stack/pack/commit/74aab91))
- ⚠️ Remove `createApiErrorAndThrow` util ([cae1b74](https://github.com/kiki-core-stack/pack/commit/cae1b74))
- Update logic in unified error handling hook ([1fa5a6a](https://github.com/kiki-core-stack/pack/commit/1fa5a6a))

### 🏡 Chore

- Export ApiError in nitropack utils ([9a6b1d1](https://github.com/kiki-core-stack/pack/commit/9a6b1d1))

#### ⚠️ Breaking Changes

- ⚠️ Remove `createApiErrorAndThrow` util ([cae1b74](https://github.com/kiki-core-stack/pack/commit/cae1b74))

### ❤️ Contributors

- kiki-kanri

## v0.10.0

[compare changes](https://github.com/kiki-core-stack/pack/compare/v0.9.0...v0.10.0)

### 🚀 Enhancements

- Split `createH3ErrorAndThrow` into `createH3Error` and throw versions ([69d31bb](https://github.com/kiki-core-stack/pack/commit/69d31bb))
- Add hook for unified error handling and conversion to generic error format ([0b19f91](https://github.com/kiki-core-stack/pack/commit/0b19f91))

### 🩹 Fixes

- Correct password setting method in create admin script ([4d4030a](https://github.com/kiki-core-stack/pack/commit/4d4030a))

### 💅 Refactors

- ⚠️ Rename createH3Error to createApiError ([95fcaf5](https://github.com/kiki-core-stack/pack/commit/95fcaf5))

#### ⚠️ Breaking Changes

- ⚠️ Rename createH3Error to createApiError ([95fcaf5](https://github.com/kiki-core-stack/pack/commit/95fcaf5))

### ❤️ Contributors

- kiki-kanri

## v0.9.0

[compare changes](https://github.com/kiki-core-stack/pack/compare/v0.8.0...v0.9.0)

### 🚀 Enhancements

- Add profile related types file ([5001a06](https://github.com/kiki-core-stack/pack/commit/5001a06))
- Add script for creating admin ([4099791](https://github.com/kiki-core-stack/pack/commit/4099791))

### 🩹 Fixes

- Extend `AdminLoginFormData` interface with `TwoFactorAuthenticationCodesData` ([5a6b31b](https://github.com/kiki-core-stack/pack/commit/5a6b31b))

### 🏡 Chore

- Add `MONGODB_URI` and `REDIS_URI` settings to example env ([a39ec7d](https://github.com/kiki-core-stack/pack/commit/a39ec7d))

### ✅ Tests

- Add `send-admin-email-otp-code` file ([2eb365c](https://github.com/kiki-core-stack/pack/commit/2eb365c))

### ❤️ Contributors

- kiki-kanri

## v0.8.0

[compare changes](https://github.com/kiki-core-stack/pack/compare/v0.7.0...v0.8.0)

### 🚀 Enhancements

- Add `AdminLoginFormData` interface ([9b0a99b](https://github.com/kiki-core-stack/pack/commit/9b0a99b))

### 🏡 Chore

- Upgrade dependencies ([c3a4d9e](https://github.com/kiki-core-stack/pack/commit/c3a4d9e))

### ❤️ Contributors

- kiki-kanri

## v0.7.0

[compare changes](https://github.com/kiki-core-stack/pack/compare/v0.6.1...v0.7.0)

### 🚀 Enhancements

- Export all constants from `constants/index.ts` in `nitropack/utils/index.ts` ([5e964e3](https://github.com/kiki-core-stack/pack/commit/5e964e3))

### 🏡 Chore

- Upgrade dependencies ([1c48d03](https://github.com/kiki-core-stack/pack/commit/1c48d03))

### ❤️ Contributors

- kiki-kanri

## v0.6.1

[compare changes](https://github.com/kiki-core-stack/pack/compare/v0.6.0...v0.6.1)

### 🩹 Fixes

- Add missing nitropack path in package.json exports field ([292cb2a](https://github.com/kiki-core-stack/pack/commit/292cb2a))

### ❤️ Contributors

- kiki-kanri

## v0.6.0

[compare changes](https://github.com/kiki-core-stack/pack/compare/v0.5.0...v0.6.0)

### 🚀 Enhancements

- Export common lodash functions in `nitropack/utils` ([173d438](https://github.com/kiki-core-stack/pack/commit/173d438))

### 🩹 Fixes

- Correct incorrect type names ([84554e8](https://github.com/kiki-core-stack/pack/commit/84554e8))

### 💅 Refactors

- ⚠️ Split and move some utils to `nitropack/utils` ([d20f25a](https://github.com/kiki-core-stack/pack/commit/d20f25a))

### 🏡 Chore

- Move `@types/lodash-es` to dependencies ([cb969f7](https://github.com/kiki-core-stack/pack/commit/cb969f7))

#### ⚠️ Breaking Changes

- ⚠️ Split and move some utils to `nitropack/utils` ([d20f25a](https://github.com/kiki-core-stack/pack/commit/d20f25a))

### ❤️ Contributors

- kiki-kanri

## v0.5.0

[compare changes](https://github.com/kiki-core-stack/pack/compare/v0.4.1...v0.5.0)

### 🚀 Enhancements

- Add optional `requiredTwoFactorAuthentications` field to ApiResponseData's data property ([85eb862](https://github.com/kiki-core-stack/pack/commit/85eb862))

### ❤️ Contributors

- kiki-kanri

## v0.4.1

[compare changes](https://github.com/kiki-core-stack/pack/compare/v0.4.0...v0.4.1)

### 🏡 Chore

- Remove API_BASE_URL env and update axios baseURL ([05740ba](https://github.com/kiki-core-stack/pack/commit/05740ba))

### ❤️ Contributors

- kiki-kanri

## v0.4.0

[compare changes](https://github.com/kiki-core-stack/pack/compare/v0.3.0...v0.4.0)

### 🚀 Enhancements

- Export `mongooseConnections` in `models/index.ts` ([e9ee50e](https://github.com/kiki-core-stack/pack/commit/e9ee50e))

### ❤️ Contributors

- kiki-kanri

## v0.3.0

[compare changes](https://github.com/kiki-core-stack/pack/compare/v0.2.0...v0.3.0)

### 🩹 Fixes

- Correct excluded type in `AjvValidatorJSONSchema` type definition ([14fd4be](https://github.com/kiki-core-stack/pack/commit/14fd4be))

### ❤️ Contributors

- kiki-kanri

## v0.2.0

[compare changes](https://github.com/kiki-core-stack/pack/compare/v0.1.0...v0.2.0)

### 🚀 Enhancements

- Add `commonAjvValidatorSchemas` constant ([7d718aa](https://github.com/kiki-core-stack/pack/commit/7d718aa))
- Add two-factor authentication types ([d79c5bb](https://github.com/kiki-core-stack/pack/commit/d79c5bb))
- Add Redis dependency and related files ([fe9a705](https://github.com/kiki-core-stack/pack/commit/fe9a705))
- Add email dependencies and related files ([dc458d2](https://github.com/kiki-core-stack/pack/commit/dc458d2))
- Add two-factor authentication dependencies and utils ([58caa23](https://github.com/kiki-core-stack/pack/commit/58caa23))

### 🩹 Fixes

- Correct key error in `TwoFactorAuthenticationCodesData` type ([7833f2c](https://github.com/kiki-core-stack/pack/commit/7833f2c))

### 🏡 Chore

- Update exports field in package.json ([3e59470](https://github.com/kiki-core-stack/pack/commit/3e59470))
- Remove unused files ([7385cda](https://github.com/kiki-core-stack/pack/commit/7385cda))

### ❤️ Contributors

- kiki-kanri

## v0.1.0

### 🚀 Enhancements

- Add AJV validator utils ([9fd470a](https://github.com/kiki-core-stack/pack/commit/9fd470a))
- Add basic shared types file ([cdc14cc](https://github.com/kiki-core-stack/pack/commit/cdc14cc))
- Add api-requests file and define API response data interface ([57ca36b](https://github.com/kiki-core-stack/pack/commit/57ca36b))
- Add nitropack utils ([7284992](https://github.com/kiki-core-stack/pack/commit/7284992))
- Add Mongoose related files ([e32a1e3](https://github.com/kiki-core-stack/pack/commit/e32a1e3))
- Add two-factor authentication types ([d055dad](https://github.com/kiki-core-stack/pack/commit/d055dad))
- Add admin constants, models, and types ([f5099dc](https://github.com/kiki-core-stack/pack/commit/f5099dc))

### 🩹 Fixes

- Add missing ref in `commonMongooseSchemas` ([632b123](https://github.com/kiki-core-stack/pack/commit/632b123))

### 🏡 Chore

- Add required dependencies ([fcbd581](https://github.com/kiki-core-stack/pack/commit/fcbd581))
- Add required dependencies ([c9d039f](https://github.com/kiki-core-stack/pack/commit/c9d039f))
- Set exports field in package.json ([d7c5ff3](https://github.com/kiki-core-stack/pack/commit/d7c5ff3))
- Add changelogen dev dependency and related script ([9b67212](https://github.com/kiki-core-stack/pack/commit/9b67212))

### ❤️ Contributors

- kiki-kanri
