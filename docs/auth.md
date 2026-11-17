# auth 設計

登入、工作階段、雙重驗證、passkey、QR Code 登入、高危操作驗證與裝置管理。不使用 JWT；不考慮舊版資料與 API 的相容。

> 狀態：設計定案、尚未實作。實作完成後刪除本行與最後的「實作順序」一節，其餘內容留存為正式文件。

## 範圍

- 包含：密碼登入、passkey 登入、TOTP、救援碼、QR Code 登入、高危操作驗證、工作階段列表與踢除、防暴力破解、驗證事件紀錄。
- 不包含：
  - 忘記密碼、註冊、第三方登入、新裝置通知信（各專案自行實作）。
  - 機器憑證（endpoint token、晶片 token）與 Open API key。它們不是登入身分，只以 scope 接上 IP 存取政策。

## 名詞

- scope：一個入口（`PlatformScope`：`System`、`AdminManagement`，下游從 1000 起新增）。平台設定與 IP 存取政策共用同一個 enum；`System` 代表全系統。
- realm：一種可登入的身分（`admin`、`agent`、`user`…）。一個 realm 對應一個帳號 model、一個 scope、一個入口網域、一組設定。pack 不定義 realm 的清單，名稱只是字串。
- principal：realm 內的一個帳號，以 `(realm, principalId)` 識別。
- 因子：密碼、passkey、TOTP、救援碼。
- 第二因子：passkey、TOTP、救援碼。

## 設定分三處

| 位置 | 內容 | 變更方式 |
| --- | --- | --- |
| 程式（`defineAuthRealm`） | 這個 realm 的 model、scope、網域與能力 | 改程式、重新部署 |
| 平台設定（依 scope） | 營運政策：強制雙重驗證、工作階段期限、同時登入上限、核准 QR 是否需驗證 | 總後台即時調整 |
| 個別帳號（`AuthPrincipalSetting`） | 該帳號是否被強制、本人是否開啟、已綁定的因子 | 本人或有管理權限者 |

### realm 定義

新增一種身分只需要：`PlatformScope` 加一個成員與其平台設定、這一份 realm 設定、各後端的路由轉接檔。

```ts
export const adminAuth = defineAuthRealm({
    name: 'admin',
    scope: PlatformScope.AdminManagement,
    model: AdminModel,
    cookieName: '__Host-admin-session',
    cookieSameSite: 'strict',
    origins: checkAndGetEnvValue('ADMIN_AUTH_ORIGINS'), // 例如 https://admin.example.com
    webauthn: { rpName: 'Example Admin' },
    findPrincipalByIdentifier: (identifier) => AdminModel.findOne({ account: identifier }),
    isPrincipalActive: (admin) => admin.enabled,
    onSessionsRevoked: async (principalId, sessionIds) => {}, // 例如通知 ws.io-server 斷線
    onEvent: async (event) => {}, // 選用；例如寄送新裝置登入或因子變更通知
});
```

- `origins`：允許的來源，用於寫入類請求的 `Origin` 檢查與 WebAuthn 驗證。各環境不同，由環境變數提供；可為陣列或以逗號分隔的字串（每項去除前後空白），啟動時驗證每項都是合法的 origin。
- `webauthn`：有填才支援 passkey。
  - `rpName`：顯示在 passkey 提示中的名稱，寫在程式內即可。
  - `rpId`：選填。只有一個 origin 時預設為該 origin 的網域（各入口網域固定且身分互不相通）；有多個 origin 時必須明確指定，否則啟動時報錯，避免調整 origin 順序時意外改變。
  - `rpId` 定下後不可更改，否則已綁定的 passkey 全部作廢。
- TOTP 與救援碼一律支援；QR Code 登入由平台設定開關。
- `onEvent`：每筆驗證事件寫入後呼叫，供各專案自行實作通知；失敗只記錄錯誤，不影響原本的操作。
- cookie 一律 `__Host-` 前綴、`HttpOnly`、`Secure`、不設 `Domain`；有效期為工作階段絕對上限的剩餘時間。
- `cookieSameSite` 預設 `strict`。前端以 SSR 判斷登入狀態的 realm（例如一般前台）設為 `lax`，否則從外部連結進入時第一個頁面請求不帶 cookie；使用 `lax` 的 realm，GET 路由不得有寫入行為。

### 平台設定

每個 realm 的 scope 在平台設定中有 `auth` 區塊：

| 欄位 | 說明 | 後台類預設 | 前台使用者預設 |
| --- | --- | --- | --- |
| `session.idleTimeoutSeconds` | 閒置逾時；有活動即順延 | 4 小時 | 30 天 |
| `session.absoluteTimeoutSeconds` | 絕對上限；不順延 | 3 天 | 60 天 |
| `maxSessions` | 同時登入上限；`null` 為不限制，超過時踢掉最久未活動者 | `null` | `null` |
| `twoFactorRequired` | 是否強制所有帳號使用雙重驗證 | `false` | `false` |
| `qrCodeLoginEnabled` | 是否開放 QR Code 登入；發現濫用時可即時關閉 | `false` | `false` |
| `qrCodeLoginApprovalRequiresVerification` | 核准 QR 登入前是否先做高危驗證 | `true` | `false` |

期限以「目前的設定」對工作階段記錄的建立時間與最後活動時間計算：調低立即生效；調高時，既有工作階段要到下次順延才套用新的閒置逾時。

### 雙重驗證的判斷

依序判斷，上層成立就不看下層：

1. 平台設定 `twoFactorRequired`：所有帳號都需要，本人與管理者都無法關閉。
2. 帳號被強制（`twoFactorEnforced`）：該帳號需要，本人無法關閉。
3. 本人開啟（`twoFactorEnabled`）：需要，本人可關閉（需先通過高危驗證）。只有在已綁定至少一個第二因子時才能為開啟；移除最後一個第二因子時自動關閉。綁定 passkey 或 TOTP 不會自動開啟，是否開啟由本人決定。

- 前兩層成立但尚未綁定任何第二因子：登入後只發「受限工作階段」，只能呼叫綁定因子的 API，綁定完成後換發正常工作階段。受限工作階段固定 15 分鐘到期，不順延、不套用平台設定的期限。
- 上層取消強制時不自動關閉：已綁定的因子保留，退回第 3 層由本人決定。
- 有管理權限者可重設帳號的雙重驗證（清除 TOTP、passkey、救援碼並踢除全部工作階段），用於裝置遺失；一律留下事件紀錄。帳號仍屬強制範圍時，下次登入會進入受限工作階段重新綁定。
- TOTP 密鑰不定期輪替；更換密鑰的方式只有本人移除後重新綁定，或由有管理權限者重設。
- 不允許只有 passkey、沒有密碼的帳號。
- 已接受的取捨：雙重驗證被重設後、本人重新登入前，知道密碼的人可以搶先在受限工作階段綁定因子（沒有 email 等其他管道可確認本人）。重設應只在確認本人身分後執行。

## 儲存

### Redis

工作階段與所有短期狀態。key 前綴為 `<projectRedisKeyPrefix>:auth:<realm>:`。Redis 資料遺失的後果是全部重新登入。全部以單一指令或 pipeline 完成，不使用 Lua。

不得淘汰沒有 TTL 的 key：世代計數被淘汰會歸零，尚未清除的已踢除工作階段會重新有效。Redis 使用 `noeviction` 或 `volatile-*`；Dragonfly 沒有 `maxmemory-policy`，必須保持 `cache_mode` 關閉（開啟時會淘汰任何 key）。

| key | 內容 | TTL |
| --- | --- | --- |
| `session:<principalId>:<sessionId>` | 工作階段 | 閒置逾時（不超過絕對上限的剩餘時間） |
| `session-generation:<principalId>` | 世代計數；全部踢除時加一 | 無 |
| `principal-sessions:<principalId>:<generation>` | 該世代的 `sessionId` 集合，供列表與清除使用 | 絕對上限；每次加入成員時重設 |
| `principal-active:<principalId>` | 「已確認帳號啟用」的標記 | 60 秒 |
| `challenge:<type>:<id>` | 一次性挑戰 | 5 分鐘（`verificationGrant` 為 2 分鐘、`totpSetup` 為 10 分鐘） |
| `qr-code-login:<id>`、`qr-code-login-approval:<id>` | QR 登入的請求與核准 | 2 分鐘 |
| `attempts:<kind>:<key>` | 嘗試次數 | 依限流規則 |

工作階段：

- token 格式為 `<principalId>.<sessionId>.<secret>`；`secret` 為 256 位元亂數，Redis 只存其 SHA-256，以固定時間比對。`sessionId` 可出現在列表與紀錄中，不具登入能力。token 中的 `principalId` 來自用戶端，組成 key 前必須驗證格式。
- 內容：`secret` 雜湊、建立時的世代計數、建立時間、最後活動時間、IP、User-Agent、登入用的因子、是否受限、核准來源（QR 登入時為核准者的 `sessionId`）。除最後活動時間外，建立後不再變動。
- User-Agent 存原始字串，超過 512 個字元即截斷（事件紀錄亦同）；裝置與瀏覽器名稱在顯示時由前端解析。
- 建立：世代計數必須在驗證任何因子之前讀取，最後以該世代寫入工作階段並加入該世代的集合。兩步登入時，世代在驗證密碼前讀取並存進 `secondFactor` 挑戰，第二步使用挑戰裡的世代。驗證期間若發生全部踢除（例如同時變更密碼），新工作階段的世代已過期而無效。
- 順延：以 `SET … XX EX <ttl>`（存在才寫入）更新最後活動時間與 TTL，已被踢除的工作階段不會被寫回。受限工作階段不順延。
- 踢除單一工作階段：刪除該 key 並從集合移除。登出即踢除目前的工作階段並清除 cookie。
- 全部踢除：世代計數加一（單一原子指令）。世代與目前計數不符的工作階段一律無效，不會漏掉同時建立中的工作階段。接著必須讀出上一個世代的集合、刪除其中所有工作階段與集合本身，並呼叫 `onSessionsRevoked`。
- 踢除其他全部：全部踢除後為目前裝置換發新工作階段（與本人變更密碼相同）。
- 設定期限一律使用以秒為單位的指令（`EX`、`EXPIRE`）；Dragonfly 的 `PEXPIRE` 搭配 `NX` 曾有不支援的紀錄。
- 列出：讀取目前世代的集合與其工作階段，順便移除已過期的成員；登入時也做同樣的清理。
- 已持有有效工作階段時再次登入：新工作階段建立後踢除原本的那一個。
- 超過 `maxSessions` 時於登入後由應用程式踢除最久未活動者（極短時間內可能超出一個）。
- 不綁定 IP；IP 與裝置只供顯示與紀錄。
- 不定期輪替 token，只在登入時發新 token；受限工作階段換發正常工作階段時也換新。

一次性挑戰：一筆帶 TTL 的紀錄，只能成功使用一次，且都綁定帳號（未登入的 passkey 登入除外）。

| 類型 | 用途 | 消耗方式 |
| --- | --- | --- |
| `secondFactor` | 密碼通過後、等待第二因子的登入中途狀態；記錄帳號與世代 | 先讀取，驗證通過後才刪除，以「刪除成功」（`DEL` 回傳 1）作為唯一的放行條件 |
| `webauthn` | WebAuthn challenge；記錄用途（註冊、登入、第二因子、高危驗證）與綁定的帳號 | 讀取即刪除（`GETDEL`） |
| `totpSetup` | 待確認的 TOTP 密鑰（已加密） | 確認成功後刪除 |
| `verificationGrant` | 高危操作驗證通過後的一次性憑據 | 讀取即刪除 |

`secondFactor` 驗證失敗不消耗挑戰，可在有效期與限流範圍內重試，不必重新輸入密碼。

### MongoDB

| collection | 內容 |
| --- | --- |
| `auth.principal_settings` | 每個 `(realm, principalId)` 一筆：`twoFactorEnabled`、`twoFactorEnforced`、TOTP（加密的密鑰、確認時間、上次使用的時間步）、救援碼（雜湊、使用時間）、WebAuthn user handle、passkey 陣列（`credentialId`、公鑰、計數器、transports、AAGUID、備份狀態、名稱、最後使用時間） |
| `auth.events` | 驗證事件紀錄：`realm`、`principalId`、類型、IP、User-Agent、`sessionId`、操作者（`actorRealm`、`actorPrincipalId`，本人操作時與帳號相同）、附加資料 |

- 帳號設定在第一次需要時才建立，建立時一律產生 WebAuthn user handle；不存在視為全部預設值。
- unique index：`(realm, principalId)`、WebAuthn user handle、`passkeys.credentialId`。後者必須是 partial index（只涵蓋有 passkey 的文件），否則沒有 passkey 的文件會以 null 互相衝突；實作時需實測空陣列也被排除，不成立則改為獨立的 passkey collection。
- 以下寫入都使用帶條件的單次更新，更新未命中即視為驗證失敗，避免同一個憑證並行通過兩次：
  - TOTP 的「上次使用的時間步」：目前值小於新值才更新。
  - 救援碼：尚未使用才標記為已使用。
  - passkey 計數器：新舊值皆為 0 時不檢查（同步型 passkey 的計數器恆為 0）；任一非 0 時，新值必須大於舊值。
- 帳號 model 不需要新增欄位；需求只有密碼欄位（Argon2）與 `isPrincipalActive` 能判斷的狀態。
- TOTP 密鑰以 AES-256-GCM 加密後儲存，金鑰來自環境變數 `AUTH_SECRET_ENCRYPTION_KEYS`，格式與 `COOKIE_SESSION_KEYS` 相同：
  - 以逗號分隔、每項去除前後空白；每項為至少 32 bytes 的任意字串（不可含逗號，例如 `openssl rand -base64 32`），以 HKDF-SHA256 衍生為 AES-256 金鑰。
  - 第一把用於加密，其餘只用於解密。輪替時把新金鑰加在最前面，舊金鑰保留到資料都已改用新金鑰後再移除。
  - 密文帶有金鑰識別碼（由金鑰本身衍生的短指紋），解密時直接選對應的金鑰，並可查出仍使用舊金鑰的資料筆數。
  - 驗證成功時若密文不是用第一把金鑰加密，順便改用第一把重新加密。
  - 找不到對應金鑰時該 TOTP 視為無法驗證，使用者改用 passkey 或救援碼，或由有管理權限者重設。
- 事件紀錄寫入失敗只記錄錯誤，不讓原本的操作失敗。
- `AdminLogType` 的 `LoginSuccess`／`LoginFailure` 移除，改記在 `auth.events`；`AdminLog` 與 `AdminLogType` 保留，繼續記錄管理員的業務操作。

## 每次請求的驗證

1. 從 cookie 取 token，一次 Redis 往返讀取工作階段、世代計數與「已確認啟用」標記；比對 `secret` 與世代。
2. 以平台設定（本機快取）檢查閒置逾時與絕對上限。
3. 標記不存在時查一次 MongoDB，確認帳號存在且 `isPrincipalActive`：通過則寫回標記，不通過則全部踢除。所有 worker 與機器共用標記，同一帳號大約每 60 秒查一次（標記過期的瞬間可能有多個請求同時查詢）。
4. 所有寫入類請求（GET、HEAD、OPTIONS 以外）檢查 `Origin` 標頭屬於 realm 的 `origins`，缺少或不符即拒絕。同主網域的其他入口屬於 same-site，`SameSite` 擋不住；`hono/csrf` 只檢查表單類的 content type、不檢查 JSON，因此不使用。
5. 以 `(scope, principalId)` 檢查 IP 存取政策。
6. 受限工作階段只放行標記為「綁定因子」的路由。
7. 以上都通過後才順延：距離上次順延超過門檻才寫回最後活動時間與 TTL，門檻為「5 分鐘」與「閒置逾時的四分之一」較小者。被拒絕的請求不順延。

WebSocket 握手是 GET，不在第 4 步的範圍內；ws.io-server 必須在握手時自行檢查 `Origin`。

### 踢除的時機

不依賴 mongoose hook（`updateOne`、批次更新等路徑不會觸發）。

- pack 提供的操作（變更密碼、重設雙重驗證、管理端踢除）在函式內直接踢除。本人變更密碼時，全部踢除後為目前裝置換發新工作階段。
- 各專案自行變更密碼或停用帳號的地方（例如忘記密碼），必須呼叫 `realm.revokeAllSessions(principalId)`。
- 帳號停用另有第 3 步兜底，最長延遲約 60 秒。

## 流程

登入的第二步與高危操作驗證共用同一個「驗證因子」函式，差別只在通過後發工作階段或發一次性憑據。

- 可用的因子：passkey、TOTP、救援碼；帳號沒有任何第二因子時，高危操作驗證改用密碼。
- 一律先確認限流、再驗證因子（見「防暴力破解」）。
- 所有登入路徑（密碼、第二因子、passkey、QR 領取）在發出工作階段前都要確認 `isPrincipalActive`。
- 以 passkey 驗證時必須確認三件事：憑證屬於挑戰所綁定的帳號、回傳的 user handle 與該帳號一致、挑戰記錄的用途與目前的操作相符。

### 登入

- 密碼：讀取世代 → 驗證密碼 → 需要第二因子時回傳 `secondFactor` 挑戰與可用因子，否則直接發工作階段。帳號不存在、密碼錯誤、帳號停用回同一個錯誤，並以 dummy hash 維持相同耗時。
- 第二因子：以挑戰加上 TOTP、passkey 或救援碼完成登入。
- passkey：使用 discoverable credential，不需先輸入帳號；以回傳的 user handle 找到帳號；要求使用者驗證（UV），通過即視同已滿足雙重驗證。
- 登入成功後處理 `maxSessions`、寫入事件紀錄。

### TOTP 與救援碼

- TOTP 自行實作（RFC 6238）：SHA-1、6 位數、30 秒、只接受目前與前一個時間步、160 位元密鑰。密鑰在綁定完成後不再回傳給用戶端。記錄上次通過的時間步，同一步或更早的驗證碼一律拒絕；因此登入後緊接著做高危驗證時，同一組驗證碼不能再用，需等下一組。
- 綁定分兩步：產生密鑰與 `otpauth://` URI（密鑰暫存在 `totpSetup` 挑戰）→ 輸入一次驗證碼確認後才寫入帳號設定，並記錄該時間步。
- 救援碼：10 組、一次性、每組為 80 位元亂數（16 個 base32 字元）、以 SHA-256 雜湊後儲存；第一次綁定第二因子時產生，可重新產生（舊的全部作廢）。

### passkey

- 使用 `@simplewebauthn/server`（前端 `@simplewebauthn/browser`）。
- 註冊：`residentKey: required`、`userVerification: required`、`attestation: none`；每個帳號上限 10 把，可命名。
- user handle 為每個 `(realm, principalId)` 一組的隨機值，不直接使用 `principalId`。
- 驗證時設定 `requireUserVerification: true`，並比對 `rpId`、`origins`、計數器（規則見「MongoDB」）。

### QR Code 登入

平台設定 `qrCodeLoginEnabled` 關閉時，建立、核准與領取一律拒絕。

1. 未登入裝置建立請求，取得 `qrToken`（放進 QR 的網址）與 `pollSecret`（只留在該裝置）；請求記錄該裝置的 IP 與 User-Agent，有效 2 分鐘。
2. 已登入裝置掃描後以 `qrToken` 查詢，看到對方的 IP 與裝置資訊。
3. 已登入裝置按下確認（平台設定要求時需先通過高危驗證）或拒絕，寫入核准紀錄（含核准者的 `principalId` 與 `sessionId`）；以「不存在才寫入」（`SET … NX`）保證只有第一個決定生效。受限工作階段不可核准。
4. 未登入裝置以 `pollSecret` 輪詢。領取的順序固定為：
   1. 比對 `pollSecret` 的雜湊。
   2. 讀取世代計數。
   3. 以 `GETDEL` 取出核准紀錄。
   4. 確認核准者的工作階段仍存在且世代相符、帳號 `isPrincipalActive`，並以該裝置的 IP 檢查 IP 存取政策。
   5. 以第 2 步讀到的世代發出新工作階段，處理 `maxSessions`。

- 新工作階段繼承核准者的登入因子並記錄核准來源；核准者之後被踢除時，不連帶踢除它核准的工作階段。
- 只拿到 `qrToken`（例如拍到螢幕）無法取得工作階段；只有 `pollSecret` 的持有者能領取。

### 高危操作驗證

- 路由以 meta 標記所需的操作名稱。
- 用戶端以「驗證因子」函式驗證（passkey、TOTP、救援碼；沒有任何第二因子時用密碼）。
- 通過後取得 `verificationGrant`：綁定 `sessionId` 與操作名稱、一次性、有效 2 分鐘，沒有放行期。操作名稱可帶目標 ID（例如 `deleteProject:<id>`），讓憑據只對該目標有效。用戶端以 `X-Auth-Verification` 標頭帶上，middleware 讀取即刪除並比對。
- 內建需要驗證的操作：
  - 新增 passkey 或 TOTP（受限工作階段的首次綁定除外）。
  - 移除因子、關閉雙重驗證、重新產生救援碼。
  - 變更密碼：一律要輸入目前密碼；帳號有第二因子時另需高危驗證。
  - 核准 QR 登入（依平台設定）。
  - 管理端的重設雙重驗證與取消 `twoFactorEnforced`：操作者需先在自己的 realm 通過高危驗證。

### 工作階段管理

- 本人：列出自己的工作階段（裝置、IP、最後活動時間、是否為目前裝置、是否由 QR 核准）、踢除指定一個、踢除其他全部；查看自己的驗證事件（登入成功與失敗、因子變更、踢除）。
- 管理：列出與踢除指定帳號的工作階段、設定或取消 `twoFactorEnforced`、重設雙重驗證。操作者不限於總後台管理員，也可以是其他 realm 或同一 realm 的帳號（例如商戶管理自己的子帳號）；pack 只提供操作本身並記錄操作者，「誰可以管理誰」由各後端的路由以權限與資料範圍判斷。
- 任何踢除都會呼叫 realm 的 `onSessionsRevoked`。

### 防暴力破解

以 Redis 計數並設定過期時間。不論部署環境是否另有 nginx 等外層限流都啟用；外層按 IP 的流量限制可另外設定，但無法取代按帳號的計數。

一律先計數、再驗證：先把計數加一（`INCR`，並以 `EXPIRE … NX` 設定期限），超過門檻直接拒絕，不進行驗證；驗證成功才清除計數。不可寫成「先讀計數、失敗才加一」，否則並行送出的大量猜測都會通過次數檢查。

| 對象 | 計數維度 | 門檻 |
| --- | --- | --- |
| 密碼 | 「輸入的帳號加 IP」 | 5 次／15 分鐘 |
| 密碼 | 「輸入的帳號」 | 20 次／15 分鐘 |
| 第二因子與高危驗證（TOTP、救援碼、passkey、高危驗證時的密碼） | 帳號 | 5 次／15 分鐘 |
| 未登入即可建立的紀錄（QR 登入請求、passkey 登入的挑戰） | IP | 30 次／分鐘 |

- 輸入的帳號字串先正規化（去除前後空白、轉小寫、限制長度）再作為計數的 key，不論帳號是否存在都計數，回應不因帳號存在與否而不同。
- 密碼分兩個維度，讓單一來源的錯誤嘗試先被自己的門檻擋下。
- 第二因子只按帳號計數：能走到這一步的人已經知道密碼，且六位數驗證碼必須靠限流才安全。
- IP 一律取自後端既有的可信代理設定（`getClientIp`）。
- 超過門檻回 `tooManyRequests` 並寫入事件紀錄。
- 已接受的取捨：按帳號的門檻可被他人用來暫時鎖住該帳號的密碼登入（最長 15 分鐘）；passkey 登入不受影響。

## 模組配置

| 位置 | 內容 |
| --- | --- |
| `libs/auth/` | `defineAuthRealm`、工作階段、挑戰、因子（密碼、TOTP、passkey、救援碼）、QR 登入、限流、事件紀錄 |
| `models/auth/` | `AuthPrincipalSetting`、`AuthEvent` |
| `hono-backend/libs/auth/` | `createAuthHandlers(realm)`、`createAuthManagementHandlers(realm, { resolveActor, resolveTarget })`、驗證 middleware |
| `hono-backend/api-errors/auth.ts` | 驗證相關錯誤碼 |

- 各後端的路由檔只轉接 `createAuthHandlers(realm)` 產生的處理函式，不自行實作流程。
- ws.io 的連線驗證以 realm 名稱查設定後呼叫同一個工作階段驗證；握手時的 `Origin` 檢查與斷線通知（`onSessionsRevoked`）由下游實作。
- 前端頁面（登入、安全性設定、裝置管理、QR 核准）先在 admin-frontend 實作，其他前端自行複製調整。

## 實作順序

1. scope 合併：`PlatformConfigScope` 與 `PlatformIpAccessPolicyScope` 合併為 `PlatformScope`；IP 存取政策的全域目標由 `scope: null` 改為 `PlatformScope.System`。pack、management-backend、admin-frontend 一起改。
2. pack：`libs/auth` 核心（realm、工作階段、挑戰、限流、事件紀錄）與 models、平台設定的 `auth` 區塊。
3. pack：因子（TOTP、救援碼、passkey），並實測 `@simplewebauthn/server` 14.x 在 Bun 上的相容性。
4. pack：QR Code 登入、高危操作驗證、`hono-backend/libs/auth` 的處理函式與 middleware。
5. management-backend：admin realm、路由轉接、帳號安全管理。
6. admin-frontend：登入頁、安全性設定、裝置管理、QR 核准、平台設定與帳號管理的對應介面。
7. 下游同步與 ws.io 斷線通知（另案）。
