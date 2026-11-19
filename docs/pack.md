# pack 架構與約定

kiki-core-stack（KCS）各 repo 共用的程式碼：資料模型、常數與型別、錯誤碼、多語系、權限、zod 擴充、儲存與外部服務 provider，以及 Hono 後端的共用元件。各 repo 以 git commit 版本依賴（`@kcs-project/pack`），不發布到 npm。

## 使用方式

- 直接 import 原始碼，不經 build；只 import 用到的檔案，例如 `@kcs-project/pack/schemas/admin`，沒有總入口。
- `package.json` 的 `exports` 由 `scripts/sync-package-exports.ts` 產生（pre-commit hook 會自動執行，exports 有變動時需 stage 後再 commit）：
  - `./*` 對應 `./src/*.ts`；目錄的 `index.ts` 以目錄路徑匯出。
  - 路徑中有 `_internal(s)`、`internal(s)` 段的模組與 `.d.ts` 不對外。
  - 路徑中有 `types` 段或檔名為 `types` 的模組只匯出型別，且不得含執行期程式碼。
- 第一次 clone 後執行 `scripts/install-git-hooks.sh` 啟用 hook。
- `peerDependencies` 只在用到對應模組時才需要安裝（例如 `models` 需要 mongoose、`providers/email` 需要 nodemailer、`libs/auth` 需要 `@simplewebauthn/server`）。

### 前端可用與僅限後端

- 前後端都可用：`constants`、`types`、`libs/permission`、`libs/i18n`、`libs/zod`（`backend/` 除外）、`schemas`。
- 僅限前端：`libs/api-client`（需 axios）、`libs/auth/passkey/browser`（瀏覽器 API）。`libs/zod` 與 `schemas` 會 import mongoose（`z.objectId`），前端使用時需安裝 mongoose（例如透過 `@kikiutils/mongoose`）。
- 僅限後端（Bun）：`connections`、`models`、`stores`、`storages`、`providers`、`init`、`redis-scripts`、`hono-backend`、`libs/zod/backend`，以及其餘依賴資料庫、Redis 或檔案系統的 `libs`。
- 開發工具：`libs/codegen` 由前端的產生腳本在 dev 時使用。

## 目錄

- constants/：enum、對照表與固定值。`*ToLabelMap` 是 enum 值的顯示名稱，前後端共用；`supportedLocales` 的第一個為預設語系；`projectRedisKeyPrefix` 下游需換成自己的前綴；WS.IO 事件名稱的 Rust 版本由 `scripts/generate-rust-ws.io-event-names.ts` 產生。
- types/：共用型別；`data/` 為前端看到的資料型別。
- schemas/：zod schema；errorData 等型別由 schema 推導。
- libs/：
  - zod/：`z` 加上專案擴充；`backend/` 另含檔案上傳的擴充。
  - codegen/：前端產生檔的產生函式（見下方「codegen」）；`templates/openapi-client/` 為 API client 的模板、generator 設定與固定的 generator 版本。
  - auth/：見下方「auth」。
  - api-client/：前端 API 呼叫；產生的 API 類別以 `XxxApi.use()` 取得實例。
  - platform/：平台設定（本機快取並以 Redis 版本號同步，寫入後呼叫 `clearPlatformConfigCache`）與 IP 存取政策。
  - 其餘：電子郵件／簡訊發送排程、job outbox、檔案與圖片、redis lock、mongoose 擴充、密碼雜湊等。
- models/：mongoose model。
- stores/、storages/：快取。`storages` 是底層實例（LRU、Redis），`stores` 是建立在其上的各領域 keyed store。
- connections/：Redis 連線。
- providers/：電子郵件、簡訊服務商的實作。
- redis-scripts/：Lua 腳本與其載入。
- init/：系統初始化（`initializeSystem`）與每次初始化都會執行的任務（`tasks/index.ts`）；下游任務接在清單的下游區段，檔案放在自己的目錄。
- hono-backend/：Hono 後端共用元件。
  - api-errors/：pack 定義的錯誤碼，命名空間 `auth`、`common`。
  - libs/：`auth/`（`createHonoAuth`）與 `api/`（錯誤定義、驗證、route docs）。
  - middlewares/：`locale()`、`cookieSession()`。
  - setups/：錯誤處理（`setupHonoAppErrorHandling`）；`mongoose-model-extensions/` 為 model 的擴充 statics 與 methods，`index` 加上要用的檔案各自 import 才會啟用。
  - types/：下游以 `declare module` 擴充 `CookieSessionData`。

## 約定

### API 回應

- 成功：`{ success: true, data? }`；失敗：`{ success: false, errorCode, errorData?, message, requestId? }`。
- 失敗的 `message` 是依請求 `Accept-Language` 翻好的訊息，可直接顯示；程式判斷一律用 `errorCode`。
- 前端 API 層不拋錯：攔截器以 `toApiClientFailureResponse` 把失敗轉為回應，HTTP 錯誤保留後端的 envelope（內容不是 envelope 時為 `internalServerError`），連線失敗、取消等合成 status 0 的同格式回應（`ClientApiErrorCode`）。

### 錯誤碼

- 以 `defineApiErrors({ code: { message, status, errorData? } })` 定義；`message` 是各語系訊息（也作為 route docs 的說明），`errorData` 是 zod schema。
- `throwApiError(definition, { errorData, message, cause })`：`message`、`cause` 只寫進 log，不回傳。
- 錯誤碼在所有命名空間中必須唯一（`listApiErrorCodes` 檢查）；`auth`、`common` 保留給 pack。
- route docs 以 `apiDocs.responses(dataSchema?, ...errors)` 撰寫；每個錯誤在 OpenAPI 文件中是共用的 component `<Code>ApiError`，無 data 的成功回應為 `ApiSuccessResponse`，產生的前端型別因此每個錯誤只有一個。

### 多語系

- 支援的語系由 `supportedLocales` 決定；`LocalizedMessages` 要求每個語系都有訊息，新增語系時漏翻會是型別錯誤。
- 後端把 `locale()` 掛成第一個 app middleware，之後以 `ctx.var.locale` 取得語系；錯誤處理與 `apiValidator` 會自動使用。
- 驗證訊息依序取：自訂規則的 `i18nIssue`、常見情況的專案措辭、zod 內建語系。schema 上不要寫死 `error` 訊息（會蓋過依請求的翻譯），自訂規則改用 `z.i18nIssue({...})`。
- 文字跟著定義走：pack 的 enum 名稱放 pack，各後端的權限名稱放各後端的權限定義；前端 i18n 只放介面文字。

### auth

設計與流程見 [auth.md](./auth.md)。

- 每種可登入的身分以 `defineAuthRealm` 定義為一個 realm（帳號 model、scope、cookie、origin、密碼金鑰支援），營運政策放在該 scope 平台設定的 `auth` 區塊。
- 工作階段存在 Redis（不使用 JWT），以 `__Host-` cookie 攜帶；帳號的雙重驗證設定與安全性紀錄存在 `auth.principal_settings`、`auth.events`。
- 後端以 `createHonoAuth(realm, { getClientIp })` 取得 `authenticate`（掛在 route middleware）與路由處理函式，各路由檔只轉接；流程中的失敗拋出 `AuthError`，由 `setupHonoAppErrorHandling` 對應到 `auth` 錯誤碼。
- 各專案自行重設密碼時呼叫 `resetAuthPassword`（或以 `revokeAllAuthSessionsAround` 包住寫入），停用帳號時呼叫 `revokeAllAuthSessions`，刪除帳號時呼叫 `deleteAuthPrincipalData`（見 auth.md「踢除的時機」）。
- 環境變數 `AUTH_SECRET_ENCRYPTION_KEYS`：加密 TOTP 密鑰的金鑰。

### 依判別值變化的欄位

服務商的 `config`（依 `code`）、平台設定的 `config`（依 `scope`）、日誌的 `metadata` 與 job 的 `payload`（依 `type`）以 `z.discriminatedMap(判別欄位, 值欄位, { 判別值: schema })` 定義為 `*Variants`；型別（`*ByCode`、`*Variant` 等）由其 `schemas` 推導。

- 輸入本身帶判別值（例如服務商表單的 `code`）：`variants.inputSchema(shape)` 產生 discriminated union，交給 `apiValidator`。
- 判別值已知（存在資料上、路由參數、job 類型）：`variants.parse(key, value)` 或 `safeParse` 只驗證值。
- 兩者的錯誤都標在 `<值欄位>.*`（例如 `config.apiUrl`），前端可直接對應表單欄位。

### 權限

- 各後端用 `definePermissions` 定義自己的權限樹：群組 `{ label, children }`、權限 `{ label, requires? }`，key 為點號路徑（`admin.account.create`）。
- `requires` 可寫同層的動作名稱（`'list'`）或其他節點的完整 key（`'admin.role.list'`）；定義時會檢查，並展開成含間接依賴的 `requirements`。
- `hasPermission` 前後端共用；需求可寫 key、`group.*` 或 `!` 排除。
- 身分組只存具體的 key，儲存前以 `expandPermissionRequirements` 補上依賴。

### codegen

前端的產生腳本打後端的開發用路由產生檔案：

| 函式 | 後端路由 | 產生內容 |
| --- | --- | --- |
| `generateApiErrorCodeFile` | `GET /api/public/api-error-code/list` | 錯誤碼清單與 `ApiErrorCode` 型別 |
| `generateManagementPermissionFile` | `GET /api/<type>/<type>/permission/list` | 群組、key、型別、各語系名稱、依賴表 |
| `generateOpenApiClient` | `GET /docs/openapi.json` | typescript-axios 的 API client：類別繼承 `OpenApiClientBase`，每個呼叫的型別為成功與文件列出錯誤的 `ApiClientPromise`；另產生只匯出 API 類別的 `api-classes.ts`（供 auto-import 等使用）；需在專案安裝 `@openapitools/openapi-generator-cli` 與 Java |

### enum 數值

可被下游擴充的 enum 中，1000 以下保留給上游，下游從 1000 開始。下游值放在檔案內以 `eslint-disable` 標註的區段，手動插入；不要整檔 `eslint --fix`（排序規則會把下游值重排進上游區段）。

## 開發

- pnpm：`pnpm run typecheck`、`pnpm run lint`（含 Lua 的 stylua 檢查）、`pnpm run test`。
