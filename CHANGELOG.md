# Changelog

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
