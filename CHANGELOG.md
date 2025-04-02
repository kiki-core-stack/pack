# Changelog

## v0.60.1

[compare changes](https://github.com/kiki-core-stack/pack/compare/v0.60.0...v0.60.1)

### 💅 Refactors

- Move `src/hono-backend/libs/zod-validator.ts` to `src/hono-backend/libs/api/zod-validator.ts` ([052402c](https://github.com/kiki-core-stack/pack/commit/052402c))

### ❤️ Contributors

- kiki-kanri

## v0.60.0

[compare changes](https://github.com/kiki-core-stack/pack/compare/v0.59.0...v0.60.0)

### 🚀 Enhancements

- **hono-backend:** Add `defineApiErrorMapByErrorCode` lib ([3aa3bcf](https://github.com/kiki-core-stack/pack/commit/3aa3bcf))
- **hono-backend:** Add `apiZValidator` lib ([8f97e17](https://github.com/kiki-core-stack/pack/commit/8f97e17))

### ❤️ Contributors

- kiki-kanri

## v0.59.0

[compare changes](https://github.com/kiki-core-stack/pack/compare/v0.58.0...v0.59.0)

### 🚀 Enhancements

- Add `toResponseData` method and getter to `ApiError` ([5aeaf9c](https://github.com/kiki-core-stack/pack/commit/5aeaf9c))

### 💅 Refactors

- Update api error mappings and default value check ([054e003](https://github.com/kiki-core-stack/pack/commit/054e003))

### 🏡 Chore

- Add punctuation to default message for response 200 ([7220fa8](https://github.com/kiki-core-stack/pack/commit/7220fa8))

### ❤️ Contributors

- kiki-kanri

## v0.58.0

[compare changes](https://github.com/kiki-core-stack/pack/compare/v0.57.3...v0.58.0)

### 🚀 Enhancements

- Add `statusCodeToResponseErrorCodeMap` constant and update `ApiError` structure ([81dbe44](https://github.com/kiki-core-stack/pack/commit/81dbe44))

### ❤️ Contributors

- kiki-kanri

## v0.57.3

[compare changes](https://github.com/kiki-core-stack/pack/compare/v0.57.2...v0.57.3)

### 🩹 Fixes

- Set return type of `throwApiError` to `never` ([81b37f4](https://github.com/kiki-core-stack/pack/commit/81b37f4))

### ❤️ Contributors

- kiki-kanri

## v0.57.2

[compare changes](https://github.com/kiki-core-stack/pack/compare/v0.57.1...v0.57.2)

### 💅 Refactors

- Simplify `createApiSuccessResponseData` ([964f882](https://github.com/kiki-core-stack/pack/commit/964f882))

### ❤️ Contributors

- kiki-kanri

## v0.57.1

[compare changes](https://github.com/kiki-core-stack/pack/compare/v0.57.0...v0.57.1)

### 🩹 Fixes

- Make `statusCode` parameter optional in `ApiError` and `throwApiError` ([357e8e3](https://github.com/kiki-core-stack/pack/commit/357e8e3))

### ❤️ Contributors

- kiki-kanri

## v0.57.0

[compare changes](https://github.com/kiki-core-stack/pack/compare/v0.56.0...v0.57.0)

### 🚀 Enhancements

- Add `errorCode` field to response message when handling `ApiError` in Hono app onError ([36ecb4d](https://github.com/kiki-core-stack/pack/commit/36ecb4d))

### 💅 Refactors

- Simplify `ApiError` and `throwApiError` ([0618d28](https://github.com/kiki-core-stack/pack/commit/0618d28))

### ❤️ Contributors

- kiki-kanri

## v0.56.0

[compare changes](https://github.com/kiki-core-stack/pack/compare/v0.55.0...v0.56.0)

### 🚀 Enhancements

- Update `ApiResponseData` type and modify `api-requests` functions to support `errorCode` field type configuration ([26d74b1](https://github.com/kiki-core-stack/pack/commit/26d74b1))

### ❤️ Contributors

- kiki-kanri

## v0.55.0

[compare changes](https://github.com/kiki-core-stack/pack/compare/v0.54.0...v0.55.0)

### 🚀 Enhancements

- Optimize `ApiResponseData` type for correct field presence and add `errorCode` field ([61932c0](https://github.com/kiki-core-stack/pack/commit/61932c0))
- Add `errorCode` parameter to `ApiError` and `throwApiError` ([d649ad7](https://github.com/kiki-core-stack/pack/commit/d649ad7))
- Add `emailOtpCode` control group to `redisController` ([355e750](https://github.com/kiki-core-stack/pack/commit/355e750))

### ❤️ Contributors

- kiki-kanri

## v0.54.0

[compare changes](https://github.com/kiki-core-stack/pack/compare/v0.53.1...v0.54.0)

### 💅 Refactors

- **hono-backend:** ⚠️ Remove `globals` folder and switch to `export/import` for module management ([50df68b](https://github.com/kiki-core-stack/pack/commit/50df68b))

#### ⚠️ Breaking Changes

- **hono-backend:** ⚠️ Remove `globals` folder and switch to `export/import` for module management ([50df68b](https://github.com/kiki-core-stack/pack/commit/50df68b))

### ❤️ Contributors

- kiki-kanri

## v0.53.1

[compare changes](https://github.com/kiki-core-stack/pack/compare/v0.53.0...v0.53.1)

### 💅 Refactors

- Rename fields in some admin models ([a93d777](https://github.com/kiki-core-stack/pack/commit/a93d777))

### ❤️ Contributors

- kiki-kanri

## v0.53.0

[compare changes](https://github.com/kiki-core-stack/pack/compare/v0.52.1...v0.53.0)

### 🚀 Enhancements

- Add `assertUpdateOneByRouteId` to hono backend mongoose model statics ([ae52aed](https://github.com/kiki-core-stack/pack/commit/ae52aed))

### 🏡 Chore

- Upgrade dependencies ([5fa88a2](https://github.com/kiki-core-stack/pack/commit/5fa88a2))

### ❤️ Contributors

- kiki-kanri

## v0.52.1

[compare changes](https://github.com/kiki-core-stack/pack/compare/v0.52.0...v0.52.1)

### 🩹 Fixes

- Rename `AdminSession` field `loginIP` to `loginIp` ([69dc4ed](https://github.com/kiki-core-stack/pack/commit/69dc4ed))

### ❤️ Contributors

- kiki-kanri

## v0.52.0

[compare changes](https://github.com/kiki-core-stack/pack/compare/v0.51.0...v0.52.0)

### 🚀 Enhancements

- Add field `isCurrent` to `AdminSessionData` ([32313ed](https://github.com/kiki-core-stack/pack/commit/32313ed))

### 💅 Refactors

- Set `token` field in `AdminSession` as private ([97359b5](https://github.com/kiki-core-stack/pack/commit/97359b5))

### ❤️ Contributors

- kiki-kanri

## v0.51.0

[compare changes](https://github.com/kiki-core-stack/pack/compare/v0.50.0...v0.51.0)

### 🚀 Enhancements

- Add `baseSetCookieOptions` constant ([3b4670a](https://github.com/kiki-core-stack/pack/commit/3b4670a))
- Update `AdminSession` ([fcd4512](https://github.com/kiki-core-stack/pack/commit/fcd4512))

### ❤️ Contributors

- kiki-kanri

## v0.50.0

[compare changes](https://github.com/kiki-core-stack/pack/compare/v0.49.1...v0.50.0)

### 🚀 Enhancements

- Add `schemaTimestampsConfigOnlyCreatedAt` mongoose constants ([ca2ccc2](https://github.com/kiki-core-stack/pack/commit/ca2ccc2))
- Add AdminSession model and types files ([39e2c79](https://github.com/kiki-core-stack/pack/commit/39e2c79))

### 🩹 Fixes

- Resolve missing newline in `package.json` after running `update-package-exports` ([f744a6f](https://github.com/kiki-core-stack/pack/commit/f744a6f))

### 💅 Refactors

- Move `timestamps` setting for `AdminLog` from `buildMongooseModel` parameters to schema definition ([5bf9e35](https://github.com/kiki-core-stack/pack/commit/5bf9e35))

### 🏡 Chore

- Ignore some eslint max-len warning ([b7a9bec](https://github.com/kiki-core-stack/pack/commit/b7a9bec))
- ⚠️ Remove all OTP and two-factor authentication related code ([e485de7](https://github.com/kiki-core-stack/pack/commit/e485de7))

### 🎨 Styles

- Format and lint codes ([f4be25c](https://github.com/kiki-core-stack/pack/commit/f4be25c))

#### ⚠️ Breaking Changes

- ⚠️ Remove all OTP and two-factor authentication related code ([e485de7](https://github.com/kiki-core-stack/pack/commit/e485de7))

### ❤️ Contributors

- kiki-kanri

## v0.49.1

[compare changes](https://github.com/kiki-core-stack/pack/compare/v0.49.0...v0.49.1)

### 🩹 Fixes

- Add missing type exports ([78bccb5](https://github.com/kiki-core-stack/pack/commit/78bccb5))

### ❤️ Contributors

- kiki-kanri

## v0.49.0

[compare changes](https://github.com/kiki-core-stack/pack/compare/v0.48.0...v0.49.0)

### 💅 Refactors

- ⚠️ Change model definition approach ([a2e77c0](https://github.com/kiki-core-stack/pack/commit/a2e77c0))
- Remove `rollup-plugin-delete` and add custom `clean-empty-mjs` plugin ([ae95467](https://github.com/kiki-core-stack/pack/commit/ae95467))
- Modify `update-package-exports` to remove dependencies on `glob` and `@kikiutils/fs-extra` ([d1551f3](https://github.com/kiki-core-stack/pack/commit/d1551f3))

### 🏡 Chore

- Upgrade dependencies ([3ddd0a5](https://github.com/kiki-core-stack/pack/commit/3ddd0a5))
- Set `hideAuthorEmail` arg in changelogen command ([0afbffb](https://github.com/kiki-core-stack/pack/commit/0afbffb))

#### ⚠️ Breaking Changes

- ⚠️ Change model definition approach ([a2e77c0](https://github.com/kiki-core-stack/pack/commit/a2e77c0))

### ❤️ Contributors

- kiki-kanri

## v0.48.0

[compare changes](https://github.com/kiki-core-stack/pack/compare/v0.47.1...v0.48.0)

### 🚀 Enhancements

- Add models and types related to admin permission ([404b2be](https://github.com/kiki-core-stack/pack/commit/404b2be))
- Add models and types related to admin group ([cf21213](https://github.com/kiki-core-stack/pack/commit/cf21213))
- Add storage abstraction layer with providers and factory functionality ([ab79cb6](https://github.com/kiki-core-stack/pack/commit/ab79cb6))
- Add `getDefaultStorage` function ([6093230](https://github.com/kiki-core-stack/pack/commit/6093230))
- Add `fileExists` method to `StorageProvider` ([df1cea3](https://github.com/kiki-core-stack/pack/commit/df1cea3))
- Add automatic creation of parent directories and permission setting in LocalStorageProvider's `uploadFile` method ([9dea933](https://github.com/kiki-core-stack/pack/commit/9dea933))

### 🩹 Fixes

- Modify LocalStorageProvider's `deleteFile` and `uploadFile` methods to throw errors on failure ([831b893](https://github.com/kiki-core-stack/pack/commit/831b893))
- Resolve parameter and type errors in `BaseStorageProvider.uploadFile` ([a6a2297](https://github.com/kiki-core-stack/pack/commit/a6a2297))
- Resolve filename extension concatenation issue in `AbstractStorageProvider.generateFilePath` ([3a05957](https://github.com/kiki-core-stack/pack/commit/3a05957))

### 💅 Refactors

- Refactor string concatenation in `redisController.emailOTPCode` to avoid nested string templates ([4174437](https://github.com/kiki-core-stack/pack/commit/4174437))
- Remove unnecessary parameter assignments when using `throwAPIError` in `convertAndSaveImageFileOrThrowError` ([c02bdbe](https://github.com/kiki-core-stack/pack/commit/c02bdbe))
- ⚠️ Modify image processing functions ([637fb77](https://github.com/kiki-core-stack/pack/commit/637fb77))
- ⚠️ Modify storage-related code ([5c1164f](https://github.com/kiki-core-stack/pack/commit/5c1164f))
- ⚠️ Modify StorageProvider-related code ([a402e36](https://github.com/kiki-core-stack/pack/commit/a402e36))
- Rename `BaseStorageProvider` to `AbstractStorageProvider` ([a0558ed](https://github.com/kiki-core-stack/pack/commit/a0558ed))
- ⚠️ Remove static `findByAccount` method from `AdminModel` ([cb53275](https://github.com/kiki-core-stack/pack/commit/cb53275))
- ⚠️ Enforce camelCase naming for all variables, classes, methods, types, etc., ignoring abbreviations ([b428a00](https://github.com/kiki-core-stack/pack/commit/b428a00))

### 📦 Build

- Disable sourcemap output in build process ([593a60f](https://github.com/kiki-core-stack/pack/commit/593a60f))

### 🏡 Chore

- Upgrade dependencies ([a3d53c3](https://github.com/kiki-core-stack/pack/commit/a3d53c3))
- Upgrade dependencies and set `pnpm.onlyBuiltDependencies` in `package.json` ([f1bf714](https://github.com/kiki-core-stack/pack/commit/f1bf714))
- Set `AdminGroupModel` field `permissions` to required ([b7a70ce](https://github.com/kiki-core-stack/pack/commit/b7a70ce))
- Upgrade dependencies ([5ab50fd](https://github.com/kiki-core-stack/pack/commit/5ab50fd))
- Update list of files to delete after build ([31052f8](https://github.com/kiki-core-stack/pack/commit/31052f8))
- Upgrade dependencies ([e11261d](https://github.com/kiki-core-stack/pack/commit/e11261d))
- Update code due to dependency updates ([3a7ff9e](https://github.com/kiki-core-stack/pack/commit/3a7ff9e))

### 🎨 Styles

- Format `src/libs/socket.io.ts` ([85bba39](https://github.com/kiki-core-stack/pack/commit/85bba39))
- Format and lint codes ([ef496fc](https://github.com/kiki-core-stack/pack/commit/ef496fc))
- Format codes ([72071da](https://github.com/kiki-core-stack/pack/commit/72071da))

#### ⚠️ Breaking Changes

- ⚠️ Modify image processing functions ([637fb77](https://github.com/kiki-core-stack/pack/commit/637fb77))
- ⚠️ Modify storage-related code ([5c1164f](https://github.com/kiki-core-stack/pack/commit/5c1164f))
- ⚠️ Modify StorageProvider-related code ([a402e36](https://github.com/kiki-core-stack/pack/commit/a402e36))
- ⚠️ Remove static `findByAccount` method from `AdminModel` ([cb53275](https://github.com/kiki-core-stack/pack/commit/cb53275))
- ⚠️ Enforce camelCase naming for all variables, classes, methods, types, etc., ignoring abbreviations ([b428a00](https://github.com/kiki-core-stack/pack/commit/b428a00))

### ❤️ Contributors

- kiki-kanri

## v0.47.1

[compare changes](https://github.com/kiki-core-stack/pack/compare/v0.47.0...v0.47.1)

### 🏡 Chore

- Remove unused `.map` files after build ([a248da7](https://github.com/kiki-core-stack/pack/commit/a248da7))

### ❤️ Contributors

- kiki-kanri

## v0.47.0

[compare changes](https://github.com/kiki-core-stack/pack/compare/v0.46.0...v0.47.0)

### 🚀 Enhancements

- Add `adminBindEmail` to `EmailOTPCodeType` ([39a10c7](https://github.com/kiki-core-stack/pack/commit/39a10c7))

### 💅 Refactors

- Replace logger with consola in `sendEmailOTPCode` ([66ed16b](https://github.com/kiki-core-stack/pack/commit/66ed16b))
- Modify definition and implementation of `SocketIoEvent` constant ([cf6ffb1](https://github.com/kiki-core-stack/pack/commit/cf6ffb1))
- Modify key order in `update-package-exports.mjs` and remove lint `package.json` command after build ([ceb1199](https://github.com/kiki-core-stack/pack/commit/ceb1199))

### 📦 Build

- Enable sourcemap output in build process ([f933af1](https://github.com/kiki-core-stack/pack/commit/f933af1))

### 🏡 Chore

- Upgrade dependencies ([cd741e3](https://github.com/kiki-core-stack/pack/commit/cd741e3))
- Modify pack file structure and update package.json.exports configuration ([ed9e822](https://github.com/kiki-core-stack/pack/commit/ed9e822))

### 🎨 Styles

- Format `EmailOTPCodeType` code ([b87d44a](https://github.com/kiki-core-stack/pack/commit/b87d44a))

### ❤️ Contributors

- kiki-kanri

## v0.46.0

[compare changes](https://github.com/kiki-core-stack/pack/compare/v0.45.2...v0.46.0)

### 💅 Refactors

- ⚠️ Reorganize and split code ([c8c3529](https://github.com/kiki-core-stack/pack/commit/c8c3529))

### 🏡 Chore

- Upgrade dependencies ([e164a39](https://github.com/kiki-core-stack/pack/commit/e164a39))

#### ⚠️ Breaking Changes

- ⚠️ Reorganize and split code ([c8c3529](https://github.com/kiki-core-stack/pack/commit/c8c3529))

### ❤️ Contributors

- kiki-kanri

## v0.45.2

[compare changes](https://github.com/kiki-core-stack/pack/compare/v0.45.1...v0.45.2)

### 🩹 Fixes

- Make `redisAdditionalKey` parameter optional in `verifyEmailOTPCode` ([3944561](https://github.com/kiki-core-stack/pack/commit/3944561))

### ❤️ Contributors

- kiki-kanri

## v0.45.1

[compare changes](https://github.com/kiki-core-stack/pack/compare/v0.45.0...v0.45.1)

### 💅 Refactors

- Modify `redisController.emailOTPCode` getKeyFunction ([f7120db](https://github.com/kiki-core-stack/pack/commit/f7120db))

### ❤️ Contributors

- kiki-kanri

## v0.45.0

[compare changes](https://github.com/kiki-core-stack/pack/compare/v0.44.0...v0.45.0)

### 💅 Refactors

- ⚠️ Update redis controller ([e58d0d2](https://github.com/kiki-core-stack/pack/commit/e58d0d2))
- ⚠️ Update `hono-backend/globals/two-factor-authentication.ts` ([7015a6e](https://github.com/kiki-core-stack/pack/commit/7015a6e))
- ⚠️ Rename `src/utils/two-factor-authentication.ts` to `src/utils/otp.ts` ([cd4ac64](https://github.com/kiki-core-stack/pack/commit/cd4ac64))
- ⚠️ Rename `src/constants/two-factor-authentication.ts` to `src/constants/otp.ts` ([989560c](https://github.com/kiki-core-stack/pack/commit/989560c))

### 🏡 Chore

- Upgrade dependencies ([3f39a73](https://github.com/kiki-core-stack/pack/commit/3f39a73))
- Set `tsconfig.json.moduleResolution` to bundler ([f03ca83](https://github.com/kiki-core-stack/pack/commit/f03ca83))
- Log error using `console.error` when `sendEmailOTPCode` fails ([c1b8fe4](https://github.com/kiki-core-stack/pack/commit/c1b8fe4))
- Upgrade dependencies ([e6b351a](https://github.com/kiki-core-stack/pack/commit/e6b351a))

#### ⚠️ Breaking Changes

- ⚠️ Update redis controller ([e58d0d2](https://github.com/kiki-core-stack/pack/commit/e58d0d2))
- ⚠️ Update `hono-backend/globals/two-factor-authentication.ts` ([7015a6e](https://github.com/kiki-core-stack/pack/commit/7015a6e))
- ⚠️ Rename `src/utils/two-factor-authentication.ts` to `src/utils/otp.ts` ([cd4ac64](https://github.com/kiki-core-stack/pack/commit/cd4ac64))
- ⚠️ Rename `src/constants/two-factor-authentication.ts` to `src/constants/otp.ts` ([989560c](https://github.com/kiki-core-stack/pack/commit/989560c))

### ❤️ Contributors

- kiki-kanri

## v0.44.0

[compare changes](https://github.com/kiki-core-stack/pack/compare/v0.43.0...v0.44.0)

### 🩹 Fixes

- Fix the problem that `getFileMimeType` method return type is not `Promise<string>` ([e4da948](https://github.com/kiki-core-stack/pack/commit/e4da948))

### 💅 Refactors

- Explicitly import from buffer module when using Blob ([4765ba1](https://github.com/kiki-core-stack/pack/commit/4765ba1))
- Replace `formatDateOrTimestamp` with date-fns `format` in `sendEmailOTPCode` ([9f7f2ee](https://github.com/kiki-core-stack/pack/commit/9f7f2ee))
- Change `StatusCode` parameter type to `ContentfulStatusCode` in hono api-error/utils ([5029619](https://github.com/kiki-core-stack/pack/commit/5029619))
- Merge duplicate definitions in ZodValidatorType ([83d9053](https://github.com/kiki-core-stack/pack/commit/83d9053))
- ⚠️ Modify parameter order and types of setex method in redis controller ([8c796bc](https://github.com/kiki-core-stack/pack/commit/8c796bc))

### 🏡 Chore

- Upgrade dependencies ([bb7b139](https://github.com/kiki-core-stack/pack/commit/bb7b139))
- Upgrade dependencies ([efac7e6](https://github.com/kiki-core-stack/pack/commit/efac7e6))

#### ⚠️ Breaking Changes

- ⚠️ Modify parameter order and types of setex method in redis controller ([8c796bc](https://github.com/kiki-core-stack/pack/commit/8c796bc))

### ❤️ Contributors

- kiki-kanri

## v0.43.0

[compare changes](https://github.com/kiki-core-stack/pack/compare/v0.42.2...v0.43.0)

### 🚀 Enhancements

- Add `getBuffer`, `getdel`, `getdelBuffer`, and `getex` methods to `createOperateFunctions` in redis controller ([d9f94cf](https://github.com/kiki-core-stack/pack/commit/d9f94cf))

### 💅 Refactors

- Remove && from scripts and add set -e at the top ([ea0c5af](https://github.com/kiki-core-stack/pack/commit/ea0c5af))
- Remove process import statement ([e95b0b2](https://github.com/kiki-core-stack/pack/commit/e95b0b2))
- Update `redisController` ([76790bc](https://github.com/kiki-core-stack/pack/commit/76790bc))

### 🏡 Chore

- Upgrade dependencies ([1ebe28a](https://github.com/kiki-core-stack/pack/commit/1ebe28a))
- Rename package to @kiki-core-stack/pack ([b982bc1](https://github.com/kiki-core-stack/pack/commit/b982bc1))
- Change permission value to `0o644` for `convertAndSaveImageFile` and add error log ([8c6b8ad](https://github.com/kiki-core-stack/pack/commit/8c6b8ad))
- Upgrade dependencies ([81bb06b](https://github.com/kiki-core-stack/pack/commit/81bb06b))
- Upgrade dependencies ([3d85343](https://github.com/kiki-core-stack/pack/commit/3d85343))

### 🎨 Styles

- Format and lint codes ([81d70aa](https://github.com/kiki-core-stack/pack/commit/81d70aa))
- Format and lint all files ([d461e0b](https://github.com/kiki-core-stack/pack/commit/d461e0b))
- Format codes ([f9f1194](https://github.com/kiki-core-stack/pack/commit/f9f1194))
- Format codes ([9165e67](https://github.com/kiki-core-stack/pack/commit/9165e67))

### ❤️ Contributors

- kiki-kanri

## v0.42.2

[compare changes](https://github.com/kiki-core-stack/pack/compare/v0.42.1...v0.42.2)

### 💅 Refactors

- Simplify wrapper functions by removing async/await ([2b12681](https://github.com/kiki-core-stack/pack/commit/2b12681))
- Initialize `WASMagic` instance only on first use ([968d840](https://github.com/kiki-core-stack/pack/commit/968d840))

### 🏡 Chore

- Update eslint-config and format codes ([be04868](https://github.com/kiki-core-stack/pack/commit/be04868))
- Add `eslint --fix ./package.json` command at the end of build script in package.json ([56e745a](https://github.com/kiki-core-stack/pack/commit/56e745a))
- Upgrade dependencies ([e420a90](https://github.com/kiki-core-stack/pack/commit/e420a90))
- Upgrade dependencies ([cbaab4a](https://github.com/kiki-core-stack/pack/commit/cbaab4a))

### 🎨 Styles

- Format and lint all files ([0e76832](https://github.com/kiki-core-stack/pack/commit/0e76832))

### ❤️ Contributors

- kiki-kanri

## v0.42.1

[compare changes](https://github.com/kiki-core-stack/pack/compare/v0.42.0...v0.42.1)

### 🏡 Chore

- Update CHANGELOG ([9f0d6a8](https://github.com/kiki-core-stack/pack/commit/9f0d6a8))
- Upgrade dependencies ([6f9ffb9](https://github.com/kiki-core-stack/pack/commit/6f9ffb9))
- Replace Prettier with ESLint, add related files, and update VSCode settings ([9eb90dc](https://github.com/kiki-core-stack/pack/commit/9eb90dc))
- Modify scripts in package.json ([9ec46cd](https://github.com/kiki-core-stack/pack/commit/9ec46cd))

### 🎨 Styles

- Format and lint all files ([09b479e](https://github.com/kiki-core-stack/pack/commit/09b479e))

### ❤️ Contributors

- kiki-kanri

## v0.42.0

[compare changes](https://github.com/kiki-core-stack/pack/compare/v0.41.2...v0.42.0)

### 🚀 Enhancements

- Export types from `@kikiutils/types/type-fest` ([615e2eb](https://github.com/kiki-core-stack/pack/commit/615e2eb))

### 🩹 Fixes

- Correct erroneous exports configuration in package.json ([6342003](https://github.com/kiki-core-stack/pack/commit/6342003))

### 💅 Refactors

- Remove `createRedisInstance` utils ([35a0978](https://github.com/kiki-core-stack/pack/commit/35a0978))
- Standardize schema names in model files ([94d5f63](https://github.com/kiki-core-stack/pack/commit/94d5f63))
- Set input value type when using `setReadonlyConstantToGlobalThis` ([62d6718](https://github.com/kiki-core-stack/pack/commit/62d6718))
- Replace some `Omit` type with type-fest's `Except` type ([3542723](https://github.com/kiki-core-stack/pack/commit/3542723))
- Split validation logic inside `requireTwoFactorAuthentication` ([5076894](https://github.com/kiki-core-stack/pack/commit/5076894))

### 🏡 Chore

- Modify exports configuration in package.json ([3b20f89](https://github.com/kiki-core-stack/pack/commit/3b20f89))
- Upgrade dependencies ([2ba16d4](https://github.com/kiki-core-stack/pack/commit/2ba16d4))

### ❤️ Contributors

- kiki-kanri

## v0.41.2

[compare changes](https://github.com/kiki-core-stack/pack/compare/v0.41.1...v0.41.2)

### 💅 Refactors

- Update custom Zod validation rule definition method ([725046a](https://github.com/kiki-core-stack/pack/commit/725046a))

### 🏡 Chore

- Upgrade dependencies ([fc2e05e](https://github.com/kiki-core-stack/pack/commit/fc2e05e))

### ❤️ Contributors

- kiki-kanri

## v0.41.1

[compare changes](https://github.com/kiki-core-stack/pack/compare/v0.41.0...v0.41.1)

### 🩹 Fixes

- Resolve logic error in `getAcceptedImageFileMimeType` ([c73bdbf](https://github.com/kiki-core-stack/pack/commit/c73bdbf))
- Resolve errors in create-admin script ([17da682](https://github.com/kiki-core-stack/pack/commit/17da682))

### 💅 Refactors

- Move `createOperateFunctions` from `redisController` to outer scope ([6f1b5dd](https://github.com/kiki-core-stack/pack/commit/6f1b5dd))
- **hono-backend:** Update the method for configuring `customMongooseOptions` ([1cfa4f5](https://github.com/kiki-core-stack/pack/commit/1cfa4f5))

### 🏡 Chore

- Modify package.json ([bb4aca6](https://github.com/kiki-core-stack/pack/commit/bb4aca6))
- Add fetch-and-merge script ([8dad913](https://github.com/kiki-core-stack/pack/commit/8dad913))
- Modify script permissions ([e726cff](https://github.com/kiki-core-stack/pack/commit/e726cff))
- Upgrade dependencies ([c29165d](https://github.com/kiki-core-stack/pack/commit/c29165d))

### ❤️ Contributors

- kiki-kanri

## v0.41.0

[compare changes](https://github.com/kiki-core-stack/pack/compare/v0.40.0...v0.41.0)

### 🚀 Enhancements

- Add `inputOptions` parameter to `convertAndSaveImageFile` ([9783a6b](https://github.com/kiki-core-stack/pack/commit/9783a6b))

### 💅 Refactors

- Rename `isAcceptedImageFile` to `getAcceptedImageFileMimeType` and enhance functionality ([35cdefb](https://github.com/kiki-core-stack/pack/commit/35cdefb))
- Rename `validateImageFile` to `validateImageFileMimeTypeAndSize` and enhance functionality ([a413b66](https://github.com/kiki-core-stack/pack/commit/a413b66))

### ❤️ Contributors

- kiki-kanri

## v0.40.0

[compare changes](https://github.com/kiki-core-stack/pack/compare/v0.39.1...v0.40.0)

### 🚀 Enhancements

- Export all from log.ts in models/admin/index.ts ([6593143](https://github.com/kiki-core-stack/pack/commit/6593143))

### 💅 Refactors

- Change `commonMongooseSchemas` to `mongooseRefSchemas` ([e1fb49f](https://github.com/kiki-core-stack/pack/commit/e1fb49f))

### ❤️ Contributors

- kiki-kanri

## v0.39.1

[compare changes](https://github.com/kiki-core-stack/pack/compare/v0.39.0...v0.39.1)

### 🩹 Fixes

- Resolve error in password field of admin schema ([acbcbcc](https://github.com/kiki-core-stack/pack/commit/acbcbcc))

### ❤️ Contributors

- kiki-kanri

## v0.39.0

[compare changes](https://github.com/kiki-core-stack/pack/compare/v0.38.2...v0.39.0)

### 💅 Refactors

- Modify the way mongoose schemas are defined ([a6724cd](https://github.com/kiki-core-stack/pack/commit/a6724cd))
- ⚠️ Remove main export file for models entry point ([2058ee4](https://github.com/kiki-core-stack/pack/commit/2058ee4))

### 🏡 Chore

- Move `@kikiutils/classes` to dependencies ([560d481](https://github.com/kiki-core-stack/pack/commit/560d481))
- Upgrade dependencies ([cf73b42](https://github.com/kiki-core-stack/pack/commit/cf73b42))
- Modify build-and-publish.sh ([cdd5db4](https://github.com/kiki-core-stack/pack/commit/cdd5db4))

#### ⚠️ Breaking Changes

- ⚠️ Remove main export file for models entry point ([2058ee4](https://github.com/kiki-core-stack/pack/commit/2058ee4))

### ❤️ Contributors

- kiki-kanri

## v0.38.2

[compare changes](https://github.com/kiki-core-stack/pack/compare/v0.38.1...v0.38.2)

### 💅 Refactors

- Make data field in API response optional ([69bc2d8](https://github.com/kiki-core-stack/pack/commit/69bc2d8))
- Migrate two-factor authentication related global utilities ([7c45119](https://github.com/kiki-core-stack/pack/commit/7c45119))

### ❤️ Contributors

- kiki-kanri

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
