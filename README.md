# @kiki-core-stack/pack

kiki-core-stack（KCS）各 repo 共用的程式碼：資料模型、常數與型別、錯誤碼、多語系、權限、zod 擴充、儲存與外部服務 provider，以及 Hono 後端的共用元件。各 repo 以 git commit 版本依賴（`@kcs-project/pack`），不發布到 npm。

## 使用方式

- 直接 import 原始碼，不經 build；只 import 用到的檔案，例如 `@kcs-project/pack/schemas/admin`，沒有總入口。
- `package.json` 的 `exports` 由 `scripts/sync-package-exports.ts` 產生（pre-commit hook 會自動執行，exports 有變動時需 stage 後再 commit）：
  - `./*` 對應 `./src/*.ts`；目錄的 `index.ts` 以目錄路徑匯出。
  - `_internals`、`internal(s)` 路徑與 `.d.ts` 不對外。
  - `types` 底下的模組只匯出型別，且不得含執行期程式碼。
- 第一次 clone 後執行 `scripts/install-git-hooks.sh` 啟用 hook。
- `peerDependencies` 只在用到對應模組時才需要安裝（例如 `models` 需要 mongoose、`providers/email` 需要 nodemailer）。

### 前端可用與僅限後端

- 前後端都可用：`constants`、`types`、`libs/permission`、`libs/i18n`、`libs/zod`（`backend/` 除外）、`schemas`。`libs/zod` 與 `schemas` 會 import mongoose（`z.objectId`），前端使用時需安裝 mongoose（例如透過 `@kikiutils/mongoose`）。
- 僅限後端（Bun）：`connections`、`models`、`stores`、`storages`、`providers`、`init`、`redis-scripts`、`hono-backend`、`libs/zod/backend`，以及其餘依賴資料庫、Redis 或檔案系統的 `libs`。
- 開發工具：`libs/codegen` 由前端的產生腳本在 dev 時使用。

## 目錄

- constants/：enum、對照表與固定值。
  - `*ToLabelMap`：enum 值的顯示名稱（`LocalizedMessages`），前後端共用。
  - i18n.ts：`supportedLocales`（第一個為預設語系）。
  - index.ts：`CommonStatus`、`projectRedisKeyPrefix`（下游需換成自己的前綴）。
  - ws.io-event-names.ts：WS.IO 事件名稱（`scripts/generate-rust-ws.io-event-names.ts` 產生 Rust 版本）。
- types/：共用型別。
  - api.ts：API 回應格式（envelope）、`ClientApiErrorCode`、驗證 issue、`CommonApiErrorDataMap`。
  - data/：前端看到的資料型別（`TableRowData`、各資源的 `*Data`）。
  - i18n.ts：`Locale`、`LocalizedMessages`。
  - permission.ts：權限樹、catalog、`PermissionRequirement`。
- schemas/：zod schema。
  - api.ts：`validationFailed`、`duplicateKey` 的 errorData schema（對應型別由此推導）。
  - admin.ts：`adminPasswordSchema`（密碼政策）、管理員日誌 metadata。
  - email.ts、sms.ts：各服務商的 config schema 與 `create*ProviderInputSchema`（以 `code` 區分，config 錯誤會標在 `config.*`）。
- libs/：
  - zod/：`z` 加上專案擴充（`objectId`、`strictIsoDateString`、`enumWithMeta`、`blankToUndefined`、`i18nIssue` 等）；`backend/` 另含檔案上傳的擴充。
  - i18n.ts：`resolveLocale(acceptLanguage)`。
  - permission.ts：`definePermissions`、`hasPermission`、`expandPermissionRequirements`。
  - codegen/：前端產生檔的產生函式（見下方「codegen」）。
  - authentication-session/：登入 session 與 QR Code 登入（Redis）。
  - 其餘：email／sms 發送排程、job outbox、檔案與圖片、redis lock、mongoose 擴充、密碼雜湊等。
- models/：mongoose model。
- stores/、storages/：快取。`storages` 是底層實例（LRU、Redis），`stores` 是建立在其上的各領域 keyed store。
- connections/：Redis 連線。
- providers/：email、sms 服務商的實作。
- redis-scripts/：Lua 腳本與其載入。
- init/：後端啟動時的初始化（`initializeSystemStartup`），含建立預設管理員、平台設定等任務；下游任務接在標註處。
- hono-backend/：Hono 後端共用元件。
  - api-errors/：pack 定義的錯誤碼，命名空間 `auth`、`common`。
  - libs/api/：`defineApiErrors`、`throwApiError`、`listApiErrorCodes`、`apiValidator`、`apiErrorResponses`（route docs）、`createApiSuccessResponseData`。
  - middlewares/：`locale()`、`cookieSession()`。
  - setups/：`setupHonoAppErrorHandling`；`mongoose-model-extensions/` 為 model 的擴充 statics 與 methods（`index` 加上要用的檔案各自 import 啟用，例如 `findByRouteIdOrThrowNotFoundError`、`assertUpdateIfNotModified`）。
  - types/：錯誤定義、cookie session 的型別（下游以 `declare module` 擴充 `CookieSessionData`）。

## 約定

### API 回應

- 成功：`{ success: true, data? }`；失敗：`{ success: false, errorCode, errorData?, message, requestId? }`。
- 失敗的 `message` 是依請求 `Accept-Language` 翻好的訊息，可直接顯示；程式判斷一律用 `errorCode`。
- 前端 API 層不拋錯：連線失敗、取消等由前端合成同格式的回應（`ClientApiErrorCode`）。

### 錯誤碼

- 以 `defineApiErrors({ code: { message, status, errorData? } })` 定義；`message` 是各語系訊息（也作為 route docs 的說明），`errorData` 是 zod schema。
- `throwApiError(definition, { errorData, message, cause })`：`message`、`cause` 只寫進 log，不回傳。
- 錯誤碼在所有命名空間中必須唯一（`listApiErrorCodes` 檢查）；`auth`、`common` 保留給 pack。

### 多語系

- 支援的語系由 `supportedLocales` 決定；`LocalizedMessages` 要求每個語系都有訊息，新增語系時漏翻會是型別錯誤。
- 後端把 `locale()` 掛成第一個 app middleware，之後以 `ctx.var.locale` 取得語系；錯誤處理與 `apiValidator` 會自動使用。
- 驗證訊息依序取：自訂規則的 `i18nIssue`、常見情況的專案措辭、zod 內建語系。schema 上不要寫死 `error` 訊息（會蓋過依請求的翻譯），自訂規則改用 `z.i18nIssue({...})`。
- 文字跟著定義走：pack 的 enum 名稱放 pack，各後端的權限名稱放各後端的權限定義；前端 i18n 只放介面文字。

### 權限

- 各後端用 `definePermissions` 定義自己的權限樹：群組 `{ label, children }`、權限 `{ label, requires? }`，key 為點號路徑（`admin.account.create`）。
- `requires` 可寫同層的動作名稱（`'list'`）或其他節點的完整 key（`'admin.role.list'`）；定義時會檢查，並展開成含間接依賴的 `requirements`。
- `hasPermission` 前後端共用；需求可寫 key、`group.*` 或 `!` 排除。
- 身分組只存具體的 key，儲存前以 `expandPermissionRequirements` 補上依賴。

### codegen

前端在 dev 啟動時打後端的開發用路由產生檔案：

| 函式 | 後端路由 | 產生內容 |
| --- | --- | --- |
| `generateApiErrorCodeFile` | `GET /api/public/api-error-code/list` | 錯誤碼清單與 `ApiErrorCode` 型別 |
| `generateManagementPermissionFile` | `GET /api/<type>/<type>/permission/list` | 群組、key、型別、各語系名稱、依賴表 |

### enum 數值

可被下游擴充的 enum 中，1000 以下保留給上游，下游從 1000 開始。下游值放在檔案內以 `eslint-disable` 標註的區段，手動插入；不要整檔 `eslint --fix`（排序規則會把下游值重排進上游區段）。

## 開發

- pnpm：`pnpm run typecheck`、`pnpm run lint`（含 Lua 的 stylua 檢查）、`pnpm run test`。
