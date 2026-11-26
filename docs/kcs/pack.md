# pack 架構與約定

## 使用方式

- 直接 import 原始碼，不經 build；只 import 用到的檔案，例如 `@kcs-project/pack/schemas/admin`，沒有總入口。
- `package.json` 的 `exports` 由 `scripts/sync-package-exports.ts` 產生（pre-commit hook 會自動執行）：
  - `./*` 對應 `./src/*.ts`；目錄的 `index.ts` 以目錄路徑匯出。
  - 路徑中有 `_internal(s)`、`internal(s)` 段的模組與 `.d.ts` 不對外。
  - 路徑中有 `types` 段或檔名為 `types` 的模組只匯出型別，且不得含執行期程式碼。
- 第一次 clone 後執行 `scripts/install-git-hooks.sh` 啟用 hook。
- `peerDependencies` 只在用到對應模組時才需要安裝（例如 `models` 需要 mongoose、`providers/email` 需要 nodemailer、`libs/auth` 需要 `@simplewebauthn/server`）。

### 前端可用與僅限後端

- 前後端都可用：`constants`、`types`、`libs/permission`、`i18n`、`libs/zod`（`backend/` 除外）、`libs/file/public`、`schemas`、`utils/error`。
- 僅限前端：`libs/api-client`（需 axios）、`libs/auth/passkey/browser`（瀏覽器 API）。`libs/zod` 與 `schemas` 會 import mongoose（`z.objectId`），前端使用時需安裝 mongoose（例如透過 `@kikiutils/mongoose`）。
- 僅限後端（Bun）：`connections`、`models`、`stores`、`storages`、`providers`、`init`、`redis-scripts`、`hono-backend`、`libs/zod/backend`、`utils/image`（sharp），以及其餘依賴資料庫、Redis 或檔案儲存的 `libs`。
- 開發工具：`libs/codegen` 由前端的產生腳本在 dev 時使用。

## 目錄

- constants/：`projectRedisKeyPrefix` 下游需換成自己的前綴；WS.IO 事件名稱的 Rust 版本由 `scripts/generate-rust-ws.io-event-names.ts` 產生到同層 pack-rs 的 `src/constants/ws_io_event_names/`（pack 與 pack-rs 要 clone 在同一個目錄下）。
- libs/：
  - platform/：平台設定在本機快取並以 Redis 版本號同步，寫入後呼叫 `clearPlatformConfigCache`。
  - storages/files/：S3 檔案儲存，`getFileStorage('public' | 'private')` 對應 bucket `<PROJECT_NAME>-<ENVIRONMENT>-<visibility>`；第一次使用時才建立，用不到檔案的服務不需要這些設定。
  - file/：公開檔案以內容的 SHA-256 去重，存在 public bucket 的 `files/<hash>.<ext>`，由 gateway 以同一個 path 提供；`file/public` 的 key 與 path 規則前後端共用。
- init/：下游任務接在 `tasks/index.ts` 清單的下游區段，檔案放在自己的目錄。
- hono-backend/：
  - setups/mongoose-model-extensions/：`index` 加上要用的檔案各自 import 才會啟用。
  - types/：下游以 `declare module` 擴充 `CookieSessionData`。

## 約定

### API 回應

- 成功：`{ success: true, data? }`；失敗：`{ success: false, errorCode, errorData?, message, requestId? }`。
- 失敗的 `message` 是依請求 `Accept-Language` 翻好的訊息，可直接顯示；程式判斷一律用 `errorCode`。
- 前端 API 層不拋錯：攔截器以 `toApiClientFailureResponse` 把失敗轉為回應，HTTP 錯誤保留後端的 envelope（內容不是 envelope 時為 `internalServerError`），連線失敗、取消等合成 status 0 的同格式回應（`ClientApiErrorCode`），訊息由呼叫端以 `getMessage` 從 pack 的 `apiClientErrors` 取得。

### 錯誤碼

- 以 `defineApiErrors({ code: { status, errorData? } }, catalogs, (m) => m.apiErrors.xxx)` 定義；訊息取自定義錯誤那一層 catalog 的同名 key（預設語系也作為 route docs 的說明），`errorData` 是 zod schema。
- `throwApiError(definition, { errorData, message, cause })`：`message`、`cause` 只寫進 log，不回傳。
- 錯誤碼在所有命名空間中必須唯一（`listApiErrorCodes` 檢查）；`auth`、`common` 保留給 pack。
- route docs 以 `apiDocs.responses(dataSchema?, ...errors)` 撰寫；每個錯誤在 OpenAPI 文件中是共用的 component `<Code>ApiError`，無 data 的成功回應為 `ApiSuccessResponse`，產生的前端型別因此每個錯誤只有一個。

### 多語系

- 語系只在 `i18n/locales.ts` 的 `localeDefinitions` 定義一次（`code`、BCP 47 `language`、`name`）；`defaultLocale`、`resolveLocale` 與 `Locale` 型別都由它衍生，前端 i18n 的 `locales` 也由它產生。每層的 catalog 都必須涵蓋所有語系，所以每個專案都支援全部語系，pack 新增語系時所有下游都要補翻譯。
- 訊息放在定義它的那一層，每層每個語系一個 catalog：pack 的在 `i18n/messages/<locale>.ts`，各後端與前端在自己的 repo。型別由 `en` 推導（`PackMessages = typeof en`），enum 是否寫齊在 `en.ts` 內以 `satisfies Record<Enum, string>` 檢查，其他語系 `satisfies` 該型別；漏翻或多餘的 key 都是型別錯誤（前端寫死在元件裡的文字不在此限）。
- 前端只載入目前語系 catalog 中會顯示的段落（`enums`、`apiClientErrors`）當 vue-i18n 訊息；API 錯誤與驗證訊息由後端依請求語系翻好。enum 顯示名稱是 `enums.<constants 檔名>.<enum>`（`constants/index.ts` 為 `common`），以 enum 值為 key（`$t(`enums.common.status.${status}`)`）。訊息只用 `{name}` 插值，不用 vue-i18n 其他特殊字元（`@ $ |`）。
- 後端以 `(catalogs, select)` 傳入訊息：`defineApiErrors`、`z.i18nIssue`、`throwFieldValidationError`；其他需要各語系同一段內容時用 `selectLocaleCatalogs`，選到單一訊息即為 `LocalizedMessage`。
- 後端把 `localeDetector()` 掛成第一個 app middleware，之後以 `ctx.var.locale` 取得語系；錯誤處理與 `apiValidator` 會自動使用。
- 驗證訊息依序取：自訂規則的 `i18nIssue`、`validation.common` 的 pack 措辭、zod 內建語系。自訂規則用 `z.i18nIssue(catalogs, (m) => ...)`。
- 新增語系：pack 在 `localeDefinitions` 加一筆、加 `messages/<code>.ts`，並在 `packLocaleCatalogs` 與 zod 語系對照（`hono-backend/libs/api/_internals/validation.ts`）各加一筆；各後端加 catalog 檔；前端加語系檔與 UI 框架的語系對照，並重跑 codegen。除了前端語系檔與 codegen，漏做都是型別錯誤。

### auth

設計與流程見 [auth.md](./auth.md)。

- 每種可登入的身分以 `defineAuthRealm` 定義為一個 realm（帳號 model、scope、cookie、origin、密碼金鑰支援），營運政策放在該 scope 平台設定的 `auth` 區塊。
- 工作階段存在 Redis（不使用 JWT），以 `__Host-` cookie 攜帶；帳號的雙重驗證設定與安全性紀錄存在 `auth.principal_settings`、`auth.events`。
- 後端以 `createHonoAuth(realm, { getClientIp })` 取得 `authenticate`（掛在 route middleware）與路由處理函式，各路由檔只轉接；流程中的失敗拋出 `AuthError`，由 `setupHonoAppErrorHandling` 對應到 `auth` 錯誤碼。

### 依判別值變化的欄位

服務商的 `config`（依 `code`）、平台設定的 `config`（依 `scope`）、日誌的 `metadata` 與 job 的 `payload`（依 `type`）以 `z.discriminatedMap(判別欄位, 值欄位, { 判別值: schema })` 定義為 `*Variants`；型別（`*ByCode`、`*Variant` 等）由其 `schemas` 推導。

- 輸入本身帶判別值（例如服務商表單的 `code`）：`variants.inputSchema(shape)` 產生 discriminated union，交給 `apiValidator`。
- 判別值已知（存在資料上、路由參數、job 類型）：`variants.parse(key, value)` 或 `safeParse` 只驗證值。
- 兩者的錯誤都標在 `<值欄位>.*`（例如 `config.apiUrl`），前端可直接對應表單欄位。

### 權限

- 各後端用 `definePermissions` 定義自己的權限樹：群組 `{ children }`、權限 `{ requires? }`，key 為點號路徑（`admin.account.create`）。
- 名稱放在定義權限那一層的 catalog（`permissions: { admin: PermissionMessages<typeof adminPermissionCatalog> }`），漏翻或殘留的 key 是型別錯誤；開發用路由回傳各語系的名稱，codegen 產生前端用的 vue-i18n 訊息（名稱含 `@ $ | { }` 時直接報錯），前端以 `$t(`permissions.admin['${key}']`)` 顯示。
- `requires` 可寫同層的動作名稱（`'list'`）或其他節點的完整 key（`'admin.role.list'`）；定義時會檢查，並展開成含間接依賴的 `requirements`。
- `hasPermission` 前後端共用；需求可寫 key、`group.*` 或 `!` 排除。
- 身分組只存具體的 key，儲存前以 `expandPermissionRequirements` 補上依賴。

### enum 數值

可被下游擴充的 enum 中，1000 以下保留給上游，下游從 1000 開始。下游值放在檔案內以 `eslint-disable` 標註的區段，手動插入；不要整檔 `eslint --fix`（排序規則會把下游值重排進上游區段）。
