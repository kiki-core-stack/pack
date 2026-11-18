# auth 設計

登入、工作階段、雙重驗證、passkey、QR Code 登入、高危操作驗證與裝置管理。不使用 JWT。

## 範圍

- 包含：密碼登入、passkey 登入、外部身分登入的入口、TOTP、救援碼、QR Code 登入、高危操作驗證、一次性驗證碼、未登入的重設密碼、工作階段列表與踢除、防暴力破解、驗證事件紀錄。
- 不包含：
  - 註冊、第三方登入的串接（OAuth 流程、帳號綁定）、驗證碼與重設密碼連結的寄送管道、新裝置通知信（各專案自行實作，通知可接 `onEvent`）。
  - 機器憑證（endpoint token、晶片 token）與 Open API key。它們不是登入身分，只以 scope 接上 IP 存取政策。

## 名詞

- scope：一個入口（`PlatformScope`：`System`、`AdminManagement`，下游從 1000 起新增）。平台設定與 IP 存取政策共用同一個 enum；`System` 代表全系統。
- realm：一種可登入的身分（`admin`、`agent`、`user`…）。一個 realm 對應一個帳號 model、一個 scope、一組入口網域、一組設定。pack 不定義 realm 的清單，名稱只是字串。
- principal：realm 內的一個帳號，以 `(realm, principalId)` 識別。
- 因子（`authFactors`）：密碼、passkey、TOTP、救援碼、驗證碼（`code`，realm 寄出的一次性驗證碼）、外部身分（`external`，由後端以其他方式驗證的身分，例如 OAuth）。外部身分只會是登入的第一步，不能作為使用者提出的證明。
- 第二因子：passkey、TOTP、救援碼（`authSecondFactors`）。救援碼只是備援：「已綁定第二因子」只看 passkey 與 TOTP。

## 設定分三處

| 位置 | 內容 | 變更方式 |
| --- | --- | --- |
| 程式（`defineAuthRealm`） | 這個 realm 的 model、scope、網域與能力 | 改程式、重新部署 |
| 平台設定（依 scope） | 營運政策：強制雙重驗證、工作階段期限、同時登入上限、QR 登入開關與核准是否需驗證 | 總後台即時調整 |
| 個別帳號（`AuthPrincipalSetting`） | 該帳號是否被強制、本人是否開啟、已綁定的因子 | 本人或有管理權限者 |

### realm 定義

新增一種身分只需要：`PlatformScope` 加一個成員與含 `auth` 區塊的平台設定、這一份 realm 設定、各後端的路由轉接檔。

```ts
export const adminAuthRealm = defineAuthRealm<AdminDocument>({
    name: 'admin',
    scope: PlatformScope.AdminManagement,
    model: AdminModel,
    displayName: 'Example Admin',
    cookieName: '__Host-admin-session',
    origins: checkAndGetEnvValue('ADMIN_AUTH_ORIGINS'), // 例如 https://admin.example.com
    webauthn: {},
    findPrincipalByIdentifier: (account) => AdminModel.findOne({ account }),
    getPrincipalDisplayName: (admin) => admin.account,
    isPrincipalActive: (admin) => admin.enabled,
    onSessionsRevoked: async (principalId, sessionIds) => {}, // 選用；例如通知 ws.io-server 斷線
    onEvent: async (event) => {}, // 選用；例如寄送新裝置登入或因子變更通知
});
```

| 選項 | 說明 |
| --- | --- |
| `name` | Redis key 與資料的命名空間；小寫英數與 `-`，各 realm 不可重複 |
| `scope` | 平台設定含 `auth` 區塊的 scope（`AuthPlatformScope`）；同時是 IP 存取政策的 scope |
| `model` | 帳號 model，需有 `findById`、`exists`、`updateOne`（mongoose model 皆符合） |
| `displayName` | 顯示給使用者的名稱：驗證器 App 中的發行者（TOTP issuer）與 passkey 提示中的網站名稱（WebAuthn RP name） |
| `cookieName` | 必須以 `__Host-` 開頭，否則啟動時報錯 |
| `cookieSameSite` | 選填，預設 `strict` |
| `origins` | 允許的來源；陣列或以逗號分隔的字串 |
| `webauthn` | 選填，`{ rpId? }`；有填（可為空物件）才支援 passkey |
| `findPrincipalByIdentifier` | 以登入用的帳號字串（已去除前後空白）找出帳號；不需檢查是否啟用 |
| `getPrincipalDisplayName` | 顯示在驗證器 App 與 passkey 提示中的帳號名稱 |
| `isPrincipalActive` | 帳號是否可登入（例如 `enabled`） |
| `newPasswordSchema` | 選填，變更與重設密碼時新密碼的規則；預設 `strongPasswordSchema` |
| `verifyPassword` | 選填，驗證密碼；預設呼叫帳號文件的 `verifyPassword` |
| `setPassword` | 選填，寫入新密碼並回傳是否寫入；只在儲存的密碼仍是帳號載入時的那一個時寫入。預設以 `model.updateOne` 帶此條件寫入，由 model 的雜湊欄位處理雜湊 |
| `hasPassword` | 選填，帳號是否已設定密碼；預設看帳號文件的 `password`，有自訂 `verifyPassword` 時一律視為有 |
| `passwordChange` | 選填，本人變更密碼的方式：`currentPassword`（預設）或 `verification`，見「密碼」 |
| `messenger` | 選填，`{ send, getDestinationHint? }`；把驗證碼與重設密碼的 token 寄給帳號的通道，有填才支援這兩項，見「寄送通道與一次性驗證碼」 |
| `onSessionsRevoked` | 選填，工作階段被踢除後呼叫；失敗只記錄錯誤 |
| `onEvent` | 選填，每筆驗證事件寫入後呼叫；失敗只記錄錯誤，不影響原本的操作 |

- `origins`：用於寫入類請求的 `Origin` 檢查與 WebAuthn 驗證。各環境不同，由環境變數提供；每項去除前後空白，啟動時驗證每項都是合法的 origin 且至少有一項。
- `webauthn.rpId`：只有一個 origin 時預設為該 origin 的網域（各入口網域固定且身分互不相通）；有多個 origin 時必須明確指定，否則啟動時報錯，避免調整 origin 順序時意外改變。`rpId` 定下後不可更改，否則已綁定的 passkey 全部作廢。
- TOTP 與救援碼一律支援；QR Code 登入由平台設定開關。
- cookie 一律 `__Host-` 前綴、`HttpOnly`、`Secure`、`Path=/`、不設 `Domain`；有效期為絕對上限（受限工作階段為 15 分鐘）。設定 cookie 的回應帶 `Cache-Control: no-store`。
- `cookieSameSite`：前端以 SSR 判斷登入狀態的 realm（例如一般前台）設為 `lax`，否則從外部連結進入時第一個頁面請求不帶 cookie；使用 `lax` 的 realm，GET 路由不得有寫入行為。
- `getAuthRealm(name)` 以名稱取得已定義的 realm（例如 ws.io 的連線驗證）；`realm.getConfig()` 回傳目前的 auth 政策（平台設定，本機快取）。

### 平台設定

每個 realm 的 scope 在平台設定中有 `auth` 區塊（`platformAuthConfigSchema`）。預設值為 `defaultManagementPlatformAuthConfig`（後台類）與 `defaultUserPlatformAuthConfig`（前台使用者），下游新增 scope 時沿用：

| 欄位 | 說明 | 範圍 | 後台類預設 | 前台使用者預設 |
| --- | --- | --- | --- | --- |
| `session.idleTimeoutSeconds` | 閒置逾時；有活動即順延 | 60 秒～1 年，不可超過絕對上限 | 4 小時 | 30 天 |
| `session.absoluteTimeoutSeconds` | 絕對上限；不順延 | 300 秒～1 年 | 3 天 | 60 天 |
| `maxSessions` | 同時登入上限；`null` 為不限制，超過時踢掉最久未活動者 | 1～100 或 `null` | `null` | `null` |
| `twoFactorRequired` | 是否強制所有帳號使用雙重驗證 | | `false` | `false` |
| `qrCodeLoginEnabled` | 是否開放 QR Code 登入；發現濫用時可即時關閉 | | `false` | `false` |
| `qrCodeLoginApprovalRequiresVerification` | 核准 QR 登入前是否先做高危驗證 | | `true` | `false` |

期限以「目前的設定」對工作階段記錄的建立時間與最後活動時間計算：調低立即生效；調高時，既有工作階段要到下次順延才套用新的閒置逾時；工作階段記錄上次寫入時採用的閒置逾時，順延門檻取它與目前設定較小者計算，確保調高後仍會在原本的存活時間內順延。

### 雙重驗證的判斷

三者任一成立即需要雙重驗證：

1. 平台設定 `twoFactorRequired`：所有帳號都需要，本人與管理者都無法關閉。
2. 帳號被強制（`twoFactorEnforced`）：該帳號需要，本人無法關閉。
3. 本人開啟（`twoFactorEnabled`）：需要，本人可關閉（需先通過高危驗證）。只有在已綁定 passkey 或 TOTP 時才能開啟。未被強制時綁定 passkey 或 TOTP 不會自動開啟，是否開啟由本人決定；在前兩層成立期間綁定則一併開啟，之後平台或帳號取消強制時仍維持雙重驗證，不會在本人不知情下退回只需密碼。

- 需要雙重驗證但尚未綁定任何第二因子：登入後只發「受限工作階段」，只能呼叫標記為允許受限工作階段的路由（綁定因子與安全性總覽），綁定完成後換發正常工作階段。受限工作階段固定 15 分鐘到期，不順延、不套用平台設定的期限。受限工作階段免高危驗證綁定因子的前提是「帳號還沒有任何第二因子」：帳號一旦綁定了第一個第二因子（例如本人在另一個受限工作階段完成設定），其餘受限工作階段在下一次請求時即被踢除（`authenticate` 對受限工作階段檢查帳號是否已有第二因子），同時送出的綁定也會在寫入時被拒（`sessionInvalid`），必須重新登入並通過第二步。
- 前兩層成立時不可移除最後一個 passkey 或 TOTP（`twoFactorEnforced` 錯誤）；其餘情況移除最後一個時，自動關閉 `twoFactorEnabled` 並作廢救援碼。「移除後是否還有其他第二因子」的判斷與寫入經過 `mutateAuthPrincipalSetting`（見「MongoDB」），並行移除不同因子時不會各自以為還有別的因子而全部移除。
- 取消帳號強制時，若已綁定第二因子則把 `twoFactorEnabled` 設為開啟：已綁定的因子保留並維持啟用，退回第 3 層由本人決定。
- 有管理權限者可重設帳號的雙重驗證（清除 TOTP、passkey、救援碼、關閉 `twoFactorEnabled` 並踢除全部工作階段），用於裝置遺失；一律留下事件紀錄。帳號仍屬強制範圍時，下次登入會進入受限工作階段重新綁定。
- TOTP 密鑰不定期輪替；更換密鑰的方式只有本人移除後重新綁定，或由有管理權限者重設。每個帳號最多一組 TOTP。
- 帳號可以沒有密碼（例如以外部身分註冊）。有這種帳號的 realm 必須提供寄送通道（`messenger`）：沒有密碼、沒有第二因子、realm 又沒有寄送通道的帳號，無法通過任何高危操作驗證，也就無法設定密碼或綁定因子。
- 已接受的取捨：雙重驗證被重設後、本人重新登入前，知道密碼的人可以搶先在受限工作階段綁定因子（沒有 email 等其他管道可確認本人）。重設應只在確認本人身分後執行。

## 儲存

### Redis

工作階段與所有短期狀態。key 前綴為 `<projectRedisKeyPrefix>:auth:<realm>:`。Redis 資料遺失的後果是全部重新登入。全部以單一指令完成（同一個 tick 內送出的指令由 Bun 合併為一次往返），不使用 Lua。

不得淘汰沒有 TTL 的 key：世代計數被淘汰會歸零，尚未清除的已踢除工作階段會重新有效。Redis 使用 `noeviction` 或 `volatile-*`；Dragonfly 沒有 `maxmemory-policy`，必須保持 `cache_mode` 關閉（開啟時會淘汰任何 key）。

| key | 內容 | TTL |
| --- | --- | --- |
| `session:<principalId>:<sessionId>` | 工作階段 | 閒置逾時（不超過絕對上限的剩餘時間） |
| `session-generation:<principalId>` | 世代計數；全部踢除時加一 | 無 |
| `principal-sessions:<principalId>:<generation>` | 該世代的 `sessionId` 集合，供列表與清除使用 | 絕對上限；每次加入成員時重設 |
| `principal-active:<principalId>` | 「已確認帳號啟用」的標記 | 60 秒 |
| `challenge:<type>:<sha256(id)>` | 一次性挑戰 | 5 分鐘（`verificationGrant` 為 2 分鐘、`totpSetup` 為 10 分鐘） |
| `code:<purpose>:<sha256(subject)>` | 一次性驗證碼的雜湊 | 5 分鐘 |
| `qr-code-login:<sha256(qrToken)>`、`qr-code-login-decision:<sha256(qrToken)>` | QR 登入的請求與決定 | 2 分鐘 |
| `attempts:<kind>:<sha256(key)>` | 嘗試次數 | 依限流規則 |

挑戰 ID 與 `qrToken` 本身是秘密，Redis 只以其雜湊作為 key；限流的 key 與驗證碼的對象可能含用戶端輸入的字串，同樣雜湊後使用。

工作階段：

- token 格式為 `<principalId>.<sessionId>.<secret>`；`secret` 為 256 位元亂數，Redis 只存其 SHA-256，以固定時間比對。`sessionId` 可出現在列表與紀錄中，不具登入能力。token 中的 `principalId` 來自用戶端，組成 key 前必須驗證格式。
- 內容：`secret` 雜湊、建立時的世代計數、建立時間、最後活動時間、IP、User-Agent、登入用的因子、是否受限、核准來源（QR 登入時為核准者的 `sessionId`）、上次寫入時採用的閒置逾時。除最後活動時間與採用的閒置逾時外，建立後不再變動。
- User-Agent 存原始字串，超過 512 個字元即截斷（事件紀錄與 QR 登入請求亦同）；裝置與瀏覽器名稱在顯示時由前端解析。
- 建立：世代計數必須在驗證任何因子之前讀取，最後以該世代寫入工作階段並加入該世代的集合。兩步登入時，世代在驗證第一步之前讀取並存進 `secondFactor` 挑戰，第二步使用挑戰裡的世代。驗證期間若發生全部踢除（例如同時變更密碼），新工作階段的世代已過期而無效。
- 順延：以 `SET … XX EX <ttl>`（存在才寫入）更新最後活動時間與 TTL，已被踢除的工作階段不會被寫回。受限工作階段不順延。
- 踢除單一工作階段：刪除該 key、呼叫 `onSessionsRevoked`，再從集合移除。登出即踢除目前的工作階段並清除 cookie。
- 全部踢除（`revokeAllAuthSessions`）：世代計數加一（單一原子指令）。世代與目前計數不符的工作階段一律無效，不會漏掉同時建立中的工作階段。接著讀出上一個世代的集合、刪除其中所有工作階段與集合本身，並呼叫 `onSessionsRevoked`。
- 踢除其他全部（`revokeOtherAuthSessions`）：讀出「目前工作階段所屬世代」的集合，以一個 `DEL` 刪除自己以外的工作階段、呼叫 `onSessionsRevoked`，再從集合移除這些 ID。不升世代、不換發，目前的工作階段與綁在它上面的長連線都不受影響。事件類型為 `OtherSessionsRevoked`，`count` 是實際刪除的筆數。
  - 目前的工作階段不在該集合內（所屬世代已被全部踢除）即回 `sessionInvalid`；對象限定在所屬世代，不會動到之後世代的工作階段。
  - 讀出集合之後才建立的工作階段不在對象內。帳號疑似遭盜用時應變更密碼（全部踢除），而不是踢除其他全部。
  - `onSessionsRevoked` 收到的是踢除的對象，可能包含已過期或已被別的請求刪除的 ID。
- 變更與踢除分屬資料庫與 Redis，無法一起提交。變更密碼與重設雙重驗證以 `revokeAllAuthSessionsAround` 在變更前後各全部踢除一次：先踢除，踢除失敗時變更不會發生；變更後再踢除，清掉兩次踢除之間以舊憑證登入的工作階段。變更後的那次踢除失敗時，只有這段期間以舊憑證登入的工作階段會留下。
- 本人變更密碼（`changeAuthPassword`）：全部踢除，目前裝置也要重新登入，只記錄 `PasswordChanged`；重設密碼（`resetAuthPassword`）同樣全部踢除，記錄 `PasswordReset`。`AllSessionsRevoked` 只用於管理端的全部踢除。
- 換發（受限工作階段換發正常工作階段）有兩個條件，都不成立就回 `sessionInvalid`：
  - 以「成功刪除來源工作階段」作為放行條件：來源已被單獨踢除時不會被換發。
  - 綁定來源工作階段的世代，不採用「當下最新的世代」：新工作階段沿用來源的世代。換發期間發生全部踢除時，新工作階段的世代已過期，自然無效。
- 密碼登入先以帳號找出 ID、讀取世代，再重新載入帳號取得用來驗證的密碼雜湊；世代早於雜湊讀取，變更密碼並全部踢除後，舊密碼就無法取得新世代的工作階段。
- 設定期限一律使用以秒為單位的指令（`EX`、`EXPIRE`）；Dragonfly 的 `PEXPIRE` 搭配 `NX` 曾有不支援的紀錄。
- 列出：讀取目前世代的集合與其工作階段（最近活動者在前），順便移除已過期的成員；建立工作階段時也做同樣的清理。
- 以登入路由（密碼、外部身分、第二因子、passkey、QR 領取）登入時若已持有有效工作階段：新工作階段建立後踢除原本的那一個。
- 超過 `maxSessions` 時於建立後踢除排在上限之後的工作階段（最久未活動者）。並行的登入都依同一個固定排序決定踢除對象且不排除自己，只會留下排序在前的；自己被排到上限之後的那次登入回 `sessionInvalid`，不會互相踢除而全部失效。
- 不綁定 IP；IP 與裝置只供顯示與紀錄。
- 不定期輪替 token，只在登入時發新 token；受限工作階段換發正常工作階段時也換新。

一次性挑戰：一筆帶 TTL 的紀錄，ID 為 256 位元亂數，只能成功使用一次，且都綁定帳號（未登入的 passkey 登入除外）。

| 類型 | 用途 | 消耗方式 |
| --- | --- | --- |
| `secondFactor` | 第一步（密碼或外部身分）通過後、等待第二因子的登入中途狀態；記錄帳號、世代與第一步的因子 | 先讀取，驗證通過後才刪除，以「刪除成功」（`DEL` 回傳 1）作為唯一的放行條件 |
| `webauthn` | WebAuthn challenge；記錄用途（`registration`、`login`、`secondFactor`、`verification`）與綁定的帳號，`registration` 另綁定開始綁定的工作階段 | 讀取即刪除（`GETDEL`），驗證失敗也不可重用 |
| `totpSetup` | 待確認的 TOTP 密鑰（已加密）；綁定帳號與開始綁定的工作階段 | 確認成功後刪除（同樣以刪除成功放行） |
| `verificationGrant` | 高危操作驗證通過後的一次性憑據 | 讀取即刪除 |
| `passwordReset` | 未登入的重設密碼：ID 就是寄給帳號的 token；記錄帳號與建立時的世代 | 讀取即刪除 |

`secondFactor` 與 `totpSetup` 驗證失敗不消耗挑戰，可在有效期與限流範圍內重試，不必重新輸入密碼或重新掃描。

### MongoDB

| collection | 內容 |
| --- | --- |
| `auth.principal_settings` | 每個 `(realm, principalId)` 一筆：`twoFactorEnabled`、`twoFactorEnforced`、`revision`（變更因子與開關時的版本號）、TOTP（加密的密鑰、確認時間、上次使用的時間步）、救援碼（雜湊、使用時間）、WebAuthn user handle、passkey 陣列（`credentialId`、公鑰、計數器、transports、AAGUID、裝置類型、名稱、建立與最後使用時間） |
| `auth.events` | 驗證事件紀錄：`realm`、`principalId`、類型（`AuthEventType`）、使用的因子、IP、User-Agent、`sessionId`、操作者（`actorRealm`、`actorPrincipalId`，本人操作時與帳號相同）、附加資料、建立時間 |

- 帳號設定在第一次需要時才建立（開始綁定 passkey、確認 TOTP、設定強制），建立時一律產生 WebAuthn user handle；不存在視為全部預設值。
- unique index：`(realm, principalId)`、WebAuthn user handle、`passkeys.credentialId`。後者是 partial index（`passkeys.credentialId` 存在才涵蓋），否則沒有 passkey 的文件會以 null 互相衝突。
- 變更「有哪些因子、是否開啟或被強制」（綁定與移除 TOTP／passkey、重新產生救援碼、開關、強制、重設）一律經過 `mutateAuthPrincipalSetting`：讀取設定、依讀到的內容檢查前置條件並決定更新，再以文件的 `revision` 作為條件寫入並加一；期間被其他請求改過就以最新的設定重新判斷。「不可移除最後一個第二因子」「最多 10 把 passkey」「尚未有 TOTP 才綁定」等條件因此在並行請求下仍成立。
- 登入時的寫入不影響上述判斷，各自使用帶條件的單次更新，更新未命中即視為驗證失敗，避免同一個憑證並行通過兩次：
  - TOTP 的「上次使用的時間步」：目前值小於新值、且密鑰仍是剛驗證的那一個才更新。
  - 救援碼：尚未使用才標記為已使用。
  - passkey 計數器：新舊值皆為 0 時不檢查（同步型 passkey 的計數器恆為 0）；任一非 0 時，新值必須大於舊值。以舊值作為更新條件。
- 帳號 model 不需要新增欄位；需求只有密碼欄位（Argon2，帳號文件提供 `verifyPassword`，或以 realm 的 `verifyPassword`／`setPassword` 取代）與 `isPrincipalActive` 能判斷的狀態。
- 帳號被刪除時呼叫 `deleteAuthPrincipalData(realm, principalId)`：踢除全部工作階段並刪除帳號設定（事件紀錄保留）。
- TOTP 密鑰以 AES-256-GCM 加密後儲存（`encryptAuthSecret`），並以 `totp:<realm>:<principalId>` 作為附加資料綁定擁有者。金鑰來自環境變數 `AUTH_SECRET_ENCRYPTION_KEYS`，格式與 `COOKIE_SESSION_KEYS` 相同：
  - 以逗號分隔、每項去除前後空白；每項為至少 32 bytes 的任意字串（不可含逗號，例如 `openssl rand -base64 32`），以 HKDF-SHA256 衍生為 AES-256 金鑰。定義 realm 時讀取，缺少或過短即拋錯，後端無法啟動。
  - 第一把用於加密，其餘只用於解密。輪替時把新金鑰加在最前面，舊金鑰保留到資料都已改用新金鑰後再移除。
  - 密文格式為 `v1.<金鑰識別碼>.<iv>.<authTag>.<data>`；金鑰識別碼由金鑰本身衍生（短指紋），解密時直接選對應的金鑰，並可查出仍使用舊金鑰的資料筆數。
  - 驗證成功時若密文不是用第一把金鑰加密，順便改用第一把重新加密。
  - 找不到對應金鑰時該 TOTP 視為無法驗證，使用者改用 passkey 或救援碼，或由有管理權限者重設。
- 事件紀錄寫入失敗只記錄錯誤，不讓原本的操作失敗。
- 登入成功與失敗記在 `auth.events`；`AdminLog` 與 `AdminLogType` 繼續記錄管理員的業務操作。

## 每次請求的驗證

`HonoAuth.authenticate(ctx, meta)` 依序：

1. 從 cookie 取 token，一次 Redis 往返讀取工作階段、世代計數與「已確認啟用」標記；比對 `secret` 與世代，並以平台設定（本機快取）檢查閒置逾時與絕對上限。
2. 標記不存在時查一次 MongoDB，確認帳號存在且 `isPrincipalActive`：通過則寫回標記，不通過則全部踢除。所有 worker 與機器共用標記，同一帳號大約每 60 秒查一次（標記過期的瞬間可能有多個請求同時查詢）。受限工作階段另查帳號設定：帳號已有第二因子時踢除該工作階段（見「雙重驗證的判斷」）。token 無效時清除 cookie。
3. 所有寫入類請求（GET、HEAD、OPTIONS 以外，包含登入等不需登入的路由）檢查 `Origin` 標頭屬於 realm 的 `origins`，缺少或不符即拒絕（`originNotAllowed`）。同主網域的其他入口屬於 same-site，`SameSite` 擋不住；`hono/csrf` 只檢查表單類的 content type、不檢查 JSON，因此不使用。
4. 以 `(scope, principalId)` 檢查 IP 存取政策（未登入時只以 scope）。
5. 沒有有效工作階段時：`noLoginRequired` 的路由放行，否則回 `unauthorized`（沒帶 token）或 `sessionInvalid`。
6. 設定 `ctx.authSession`。受限工作階段只放行 `allowRestrictedSession` 的路由（`noLoginRequired` 的路由也放行），否則回 `secondFactorSetupRequired`。
7. 路由 meta 有 `verification` 時消耗高危操作驗證的憑據（見「高危操作驗證」）。
8. 以上都通過後才順延：距離上次順延超過門檻才寫回最後活動時間與 TTL，門檻為「5 分鐘」與「閒置逾時的四分之一」較小者（閒置逾時取目前設定與上次寫入時採用的值較小者）。被拒絕的請求不順延。

路由 meta（`AuthRouteMeta`，各後端併入自己的 route meta）：`noLoginRequired`、`allowRestrictedSession`、`verification`（操作名稱，或由 `ctx` 產生帶目標 ID 的名稱）。

WebSocket 握手是 GET，不在第 3 步的範圍內；ws.io-server 必須在握手時自行檢查 `Origin`。

### 踢除的時機

不依賴 mongoose hook（`updateOne`、批次更新等路徑不會觸發）。

- pack 提供的操作（變更密碼、重設密碼、重設雙重驗證、管理端踢除、帳號停用的兜底）在函式內直接踢除。本人變更密碼時全部踢除，目前裝置也要重新登入。
- 各專案自行變更密碼或停用帳號的地方（例如管理端編輯帳號），只寫入密碼時直接呼叫 `resetAuthPassword(realm, principalId, newPassword, context)`；密碼與其他欄位一起寫入時以 `revokeAllAuthSessionsAround(realm, principalId, change)` 包住寫入，停用帳號呼叫 `revokeAllAuthSessions(realm, principalId)`；刪除帳號呼叫 `deleteAuthPrincipalData(realm, principalId)`。
- 帳號停用另有第 2 步兜底，最長延遲約 60 秒。

## 錯誤

流程中可預期的失敗一律拋出 `AuthError`（`code` 為 `AuthErrorCode`），`setupHonoAppErrorHandling` 依 `code` 對應到 API 錯誤：`forbidden`、`unauthorized` 對應 `common` 命名空間，其餘對應 `auth` 命名空間的同名錯誤（`hono-backend/api-errors/auth.ts`）。

- `verificationRequired` 的 `errorData` 為 `{ operation, factors }`：要驗證的操作名稱，與帳號可用來驗證的因子（沒有任何第二因子時為驗證碼與密碼中可用者）。用戶端據此顯示驗證畫面，取得一次性憑據後以 `X-Auth-Verification` 標頭（常數 `authVerificationHeaderName`）重送原請求。
- 需要憑據的路由先確認其他前置條件（目前密碼、QR 請求仍有效、管理對象存在且可管理）再消耗憑據，這些條件不成立時不會白白用掉憑據。
- `verificationCodeUnavailable`：realm 沒有寄送通道，或這個帳號不能使用驗證碼（已有第二因子、沒有可用的收件位址）。
- 帳號不存在、密碼錯誤、帳號停用一律為 `invalidCredentials`，回應不透露帳號是否存在。

## 流程

登入的第二步與高危操作驗證共用同一個「驗證因子」函式（`verifyAuthFactor`），差別只在通過後發工作階段或發一次性憑據。

- 可用的因子：passkey、TOTP、救援碼；帳號沒有任何第二因子時，高危操作驗證改用密碼（帳號有密碼時）或驗證碼（realm 有寄送通道時），登入第二步不接受這兩者。
- 一律先確認限流、再驗證因子（見「防暴力破解」）。
- 所有登入路徑（密碼、外部身分、第二因子、passkey、QR 領取）在發出工作階段前都要確認 `isPrincipalActive` 與 IP 存取政策。
- 以 passkey 驗證時必須確認三件事：憑證屬於挑戰所綁定的帳號、有回傳 user handle 時與該帳號一致、挑戰記錄的用途與目前的操作相符。

### 登入

- 密碼：限流計數 → 找出帳號 → 讀取世代 → 驗證密碼 → 需要雙重驗證時：已綁定第二因子則回傳 `secondFactor` 挑戰與可用因子（`state: 'secondFactorRequired'`），尚未綁定則發受限工作階段；否則直接發工作階段。帳號不存在或沒有密碼時以 dummy hash 維持相同耗時。
- 外部身分（`loginWithAuthExternalIdentity`，Hono 為 `HonoAuth.loginWithExternalIdentity(ctx, principalId)`）：後端已用其他方式確認對方就是該帳號（例如 OAuth）時呼叫，取代「驗證密碼」這一步；之後與密碼登入相同，需要雙重驗證時照樣回傳 `secondFactor` 挑戰或發受限工作階段。帳號不存在或停用回 `invalidCredentials`。OAuth 流程、帳號的綁定與建立由各專案實作。
- 第二因子：以挑戰加上 TOTP、passkey 或救援碼完成登入；passkey 的選項以挑戰 ID 取得。新工作階段記錄的因子為 `[<第一步的因子>, <第二因子>]`，第一步的因子為 `password` 或 `external`。
- passkey：使用 discoverable credential，不需先輸入帳號；以回傳的 user handle 找到帳號；要求使用者驗證（UV），通過即視同已滿足雙重驗證。
- 登入成功後處理 `maxSessions`、寫入事件紀錄；回應 `{ state: 'completed', restricted }` 並設定 cookie。

### 寄送通道與一次性驗證碼

realm 有填 `messenger` 才支援「未登入的重設密碼」與「以驗證碼通過高危操作驗證」。pack 負責產生、儲存、限流與驗證，寄送管道（email、簡訊、通訊軟體…）與訊息內容由 realm 的 `messenger.send(principal, message)` 決定；它回傳是否寄出，帳號沒有可用的收件位址時回傳 false。`messenger.getDestinationHint` 選填，回傳顯示給使用者的遮罩後收件位址。

`message`（`AuthMessage`）有兩種：

| `purpose` | 內容 | 用法 |
| --- | --- | --- |
| `verification` | `code`：六位數驗證碼 | 使用者在驗證畫面輸入 |
| `passwordReset` | `token`：256 位元的一次性 token；`origin`：發起請求的前端來源 | realm 以 `origin` 組出前端重設密碼頁的連結，token 建議放在 fragment（`#` 之後），避免進入伺服器存取紀錄 |

pack 內建的流程中，驗證碼只用在已登入的高危操作驗證：六位數靠限流才安全，未登入的重設密碼沒有工作階段可以綁定，對大量帳號同時嘗試時擋不住，因此改用猜不到的 token。

一次性驗證碼（`libs/auth/code.ts` 的 `createAuthCode`／`verifyAuthCode`）：

- 六位數字、有效 5 分鐘，Redis 只存雜湊。同一個 `(用途, 對象)` 只有最新的一組有效。
- 驗證先計數再比對，通過後以「刪除成功」放行，同一組只能成功一次。猜測次數以 `(用途, 對象)` 計數，通過後歸零，超過門檻即作廢目前的驗證碼；寄出新的一組不會歸零，否則任何人都能靠重新寄送換取更多次猜測。
- 寄送以 `(用途, 對象)` 限流（見「防暴力破解」）。
- 以任意字串為對象：高危操作驗證的對象是帳號；各專案可直接用在還沒有帳號的情境（例如註冊時驗證收件位址，對象為收件位址本身、用途自訂），寄送由呼叫端自己處理。

驗證碼證明的是「能收到這個帳號的訊息」，強度不等同第二因子：帳號一旦綁定 passkey 或 TOTP，高危操作驗證就不再接受驗證碼。

### 密碼

- 本人變更密碼（`changeAuthPassword`）依 realm 的 `passwordChange` 分兩種：
  - `currentPassword`（預設）：必須輸入目前密碼，帳號有第二因子時另需高危操作驗證（`auth.changePassword`）。新密碼只在儲存的密碼仍是剛驗證的那一個時寫入，不會覆寫期間被重設的密碼。
  - `verification`：只需高危操作驗證，不輸入目前密碼。
  - 帳號還沒有密碼時不論設定一律只需高危操作驗證，也就是「設定密碼」。安全性總覽的 `hasPassword` 與 `passwordChangeRequiresCurrentPassword` 讓前端決定表單。
- 未登入的重設密碼（realm 有寄送通道時，否則回 `forbidden`）：
  1. 請求（`requestAuthPasswordReset`）：以帳號字串找出帳號，存在且啟用就建立 `passwordReset` 挑戰，把它的 ID 作為 token 交給 `messenger.send`。不論帳號是否存在、是否寄出都回成功，也不等待寄送完成，回應與耗時不透露帳號是否存在。`origin` 取自請求的 `Origin` 標頭（已通過 realm 的來源檢查）。
  2. 完成（`completeAuthPasswordReset`）：只帶 token 與新密碼，不帶帳號。token 讀取即刪除；無效、過期、帳號不存在或停用、寄出後帳號的工作階段曾被全部踢除一律回 `challengeExpired`。接著以該帳號檢查 IP 存取政策（未登入的請求原本只以 scope 檢查），被限制 IP 的帳號只能從允許的 IP 重設，否則回 `forbidden`，該 token 也已用掉。通過後重設密碼並踢除全部工作階段。
  - 重設後不發出工作階段：之後照常登入，有第二因子的帳號仍要通過第二步，只拿到收件管道的人無法藉此直接登入。
  - 同一個帳號可以同時有多個尚未使用的 token，各自在 5 分鐘後過期。token 綁定建立時的工作階段世代：密碼一經變更或重設（或其他全部踢除），之前寄出的 token 全部失效。
- `resetAuthPassword(realm, principalId, newPassword, context)`：不比對目前密碼直接寫入並踢除全部工作階段，記錄 `PasswordReset`；未登入的重設密碼與各專案只寫入密碼的重設（例如管理端）共用。
- 所有寫入都以 `revokeAllAuthSessionsAround` 在前後各踢除一次（見「Redis」）。
- 已接受的取捨：他人可對某個帳號反覆請求重設，用完該帳號的寄送額度（15 分鐘 5 次），使本人在這段時間內收不到新的連結，並收到數封信。

### TOTP 與救援碼

- TOTP 自行實作（RFC 6238）：SHA-1、6 位數、30 秒、只接受目前與前一個時間步（兩步都比對，不以耗時洩漏命中哪一步）、160 位元密鑰。密鑰在綁定完成後不再回傳給用戶端。記錄上次通過的時間步，同一步或更早的驗證碼一律拒絕；因此登入後緊接著做高危驗證時，同一組驗證碼不能再用，需等下一組。
- 綁定分兩步：產生密鑰與 `otpauth://` URI（issuer 為 realm 的 `displayName`、帳號名稱為 `getPrincipalDisplayName`；密鑰加密後暫存在 `totpSetup` 挑戰）→ 輸入一次驗證碼確認後才寫入帳號設定，並記錄該時間步。
- 救援碼：10 組、一次性、每組為 80 位元亂數（16 個 base32 字元，以 `XXXX-XXXX-XXXX-XXXX` 顯示），以 SHA-256 雜湊後儲存；比對前去除分隔符號與空白並轉大寫。第一次綁定 passkey 或 TOTP 時產生並隨綁定結果回傳（明文只回傳這一次），可重新產生（舊的全部作廢）。

### passkey

- 使用 `@simplewebauthn/server`（前端 `@simplewebauthn/browser`）。
- 註冊：`residentKey: required`、`userVerification: required`、`attestation: none`，排除已綁定的憑證；每個帳號上限 10 把，可命名（最長 64 字）與改名。
- user handle 為每個 `(realm, principalId)` 一組的隨機值，不直接使用 `principalId`。
- 驗證時設定 `requireUserVerification: true`，並比對 `rpId`、`origins`、計數器（規則見「MongoDB」）。

### QR Code 登入

平台設定 `qrCodeLoginEnabled` 關閉時，建立、查詢、核准、拒絕與領取一律拒絕（`qrCodeLoginDisabled`）。

1. 未登入裝置建立請求，取得 `qrToken`、`pollSecret`（只留在該裝置）與有效秒數；請求記錄該裝置的 IP 與 User-Agent，有效 2 分鐘。QR Code 的內容是前端核准頁的網址，`qrToken` 放在網址的 fragment（`#` 之後），避免進入伺服器存取紀錄。
2. 已登入裝置開啟核准頁，以 `qrToken` 查詢，看到對方的 IP、裝置資訊、建立時間與核准前是否需要高危驗證。
3. 已登入裝置按下確認（平台設定要求時需先通過高危驗證）或拒絕，寫入決定（含核准者的 `principalId`、`sessionId` 與登入因子）；以「不存在才寫入」（`SET … NX`）保證只有第一個決定生效。受限工作階段不可核准或拒絕。
4. 未登入裝置以 `qrToken` 與 `pollSecret` 輪詢，結果為 `pending`、`rejected` 或 `completed`。領取的順序固定為：
   1. 比對 `pollSecret` 的雜湊；沒有決定時回 `pending`。
   2. 以決定中的帳號讀取世代計數。
   3. 以 `GETDEL` 取出決定（只有一個輪詢請求能領取）並刪除請求；拒絕時回 `rejected`。
   4. 確認核准者的工作階段仍在目前世代且未受限、帳號 `isPrincipalActive`，並以領取裝置的 IP 檢查 IP 存取政策。
   5. 以第 2 步讀到的世代發出新工作階段，處理 `maxSessions`。

- 新工作階段繼承核准者的登入因子並記錄核准來源；核准者之後被踢除時，不連帶踢除它核准的工作階段。
- 只拿到 `qrToken`（例如拍到螢幕）無法取得工作階段；只有 `pollSecret` 的持有者能領取。

### 高危操作驗證

- 路由以 meta 的 `verification` 標記所需的操作名稱；handler 內依條件決定時呼叫 `HonoAuth.assertVerification(ctx, operation)`。
- 用戶端先收到 `verificationRequired`，以「驗證因子」函式驗證（passkey、TOTP、救援碼；沒有任何第二因子時用密碼或驗證碼），passkey 的選項與驗證碼的寄送另有路由。
- 通過後取得 `verificationGrant`：綁定帳號、`sessionId` 與操作名稱、一次性、有效 2 分鐘，沒有放行期。操作名稱可帶目標 ID（例如 `deleteProject:<id>`），讓憑據只對該目標有效。用戶端以 `X-Auth-Verification` 標頭帶上，讀取即刪除並比對，不符即回 `verificationRequired`。
- 內建需要驗證的操作（`authVerificationOperations`）：
  - `auth.addFactor`：新增 passkey 或 TOTP（受限工作階段的首次綁定除外）。
  - `auth.removeFactor`、`auth.disableTwoFactor`、`auth.regenerateRecoveryCodes`：移除因子、關閉雙重驗證、重新產生救援碼。
  - `auth.changePassword`：變更密碼（何時需要見「密碼」）。
  - `auth.approveQrCodeLogin`：核准 QR 登入（依平台設定）。
  - `auth.manageTwoFactor`：管理端的重設雙重驗證與取消 `twoFactorEnforced`；操作者需先在自己的 realm 通過高危驗證（設定強制不需要）。

### 工作階段管理

- 本人：列出自己的工作階段（裝置、IP、建立與最後活動時間、登入因子、是否為目前裝置、核准來源）、踢除指定一個（踢除目前裝置時一併清除 cookie）、踢除其他全部。驗證事件的列表由各後端自己的路由提供（見「模組配置」）。
- 管理：查看指定帳號的安全性總覽、列出與踢除其工作階段（指定一個或全部）、設定或取消 `twoFactorEnforced`、重設雙重驗證。操作者不限於總後台管理員，也可以是其他 realm 或同一 realm 的帳號（例如商戶管理自己的子帳號）；pack 只提供操作本身並記錄操作者，「誰可以管理誰」由各後端的路由以權限與資料範圍判斷。
- 任何踢除都會呼叫 realm 的 `onSessionsRevoked`。

### 防暴力破解

以 Redis 計數並設定過期時間。不論部署環境是否另有 nginx 等外層限流都啟用；外層按 IP 的流量限制可另外設定，但無法取代按帳號的計數。

一律先計數、再驗證：先把計數加一（`INCR`，並以 `EXPIRE … NX` 設定期限），超過門檻直接拒絕，不進行驗證；驗證成功才清除計數。不可寫成「先讀計數、失敗才加一」，否則並行送出的大量猜測都會通過次數檢查。

| 對象 | 計數維度（`authRateLimits`） | 門檻 |
| --- | --- | --- |
| 密碼登入 | 「輸入的帳號加 IP」（`passwordByIdentifierAndIp`） | 5 次／15 分鐘 |
| 密碼登入 | 「輸入的帳號」（`passwordByIdentifier`） | 20 次／15 分鐘 |
| 第二因子（登入第二步、高危驗證） | 帳號（`secondFactorByPrincipal`） | 5 次／15 分鐘 |
| 目前密碼（變更密碼、沒有第二因子時以密碼做高危驗證） | 帳號（`currentPasswordByPrincipal`） | 5 次／15 分鐘 |
| 驗證碼的猜測（含沒有第二因子時以驗證碼做高危驗證） | 「用途加對象」（`codeBySubject`） | 5 次／15 分鐘 |
| 寄送驗證碼 | 「用途加對象」（`codeSendBySubject`） | 5 次／15 分鐘 |
| 寄送重設密碼的 token | 帳號（`passwordResetSendByPrincipal`） | 5 次／15 分鐘 |
| 確認 TOTP 綁定 | 帳號（`totpSetupByPrincipal`） | 5 次／15 分鐘 |
| 未登入即可建立的紀錄（QR 登入請求、passkey 登入的挑戰、重設密碼的請求） | IP（`unauthenticatedChallengeByIp`） | 30 次／分鐘 |

- 輸入的帳號字串先正規化（去除前後空白、限制長度、轉小寫）再作為計數的 key，不論帳號是否存在都計數，回應不因帳號存在與否而不同。
- 密碼分兩個維度，讓單一來源的錯誤嘗試先被自己的門檻擋下。密碼登入成功只清除「帳號加 IP」的計數。
- 每種驗證用途各有自己的計數：通過其中一種只清除該種的計數，例如輸入正確的目前密碼不會重設第二因子的猜測次數。
- 第二因子只按帳號計數：能走到這一步的人已經知道密碼，且六位數驗證碼必須靠限流才安全。
- IP 一律取自後端既有的可信代理設定（`createHonoAuth` 的 `getClientIp`）。
- 超過門檻回 `tooManyAttempts`（429）。能對應到帳號時，每個計數期間第一次被擋下寫入一筆 `RateLimited` 事件（之後被擋下的請求不再重複寫）；密碼登入輸入的帳號不存在時不寫。
- 已接受的取捨：按帳號的門檻可被他人用來暫時鎖住該帳號的密碼登入（最長 15 分鐘）；passkey 登入不受影響。

## 模組配置

| 位置 | 內容 |
| --- | --- |
| `constants/auth.ts` | `AuthEventType`、`authFactors`、`authSecondFactors`、`authVerificationOperations`、`authVerificationHeaderName` 與顯示名稱對照 |
| `libs/auth/` | `defineAuthRealm`（`realm.ts`）、工作階段（`session.ts`）、挑戰、登入、因子驗證、TOTP、救援碼、passkey、QR 登入、高危驗證（`verification.ts`）、一次性驗證碼（`code.ts`）、帳號設定與其唯一的變更入口（`principal-setting.ts`）、雙重驗證與因子的操作（`two-factor.ts`）、變更與重設密碼（`password.ts`）、刪除帳號時的清除（`principal.ts`）、限流、IP 存取、事件紀錄、`AuthError`、秘密加密 |
| `models/auth/` | `AuthPrincipalSetting`、`AuthEvent` |
| `hono-backend/libs/auth/` | `createHonoAuth(realm, { getClientIp })`（`index.ts`）；路由處理函式依群組放在 `routes/`（`login.ts`、`password-reset.ts`、`qr-code-login.ts`、`security.ts`、`verification.ts`、`management.ts`） |
| `hono-backend/types/auth.ts` | `AuthRouteMeta`、`AuthRouteDefinition`、`ctx.authSession` |
| `hono-backend/api-errors/auth.ts` | 驗證相關錯誤碼 |
| `types/auth.ts`、`types/data/auth.ts`、`schemas/api.ts` | 工作階段、事件與寄送訊息（`AuthMessage`）的型別、前端看到的資料型別、`verificationRequired` 的 errorData schema |

`createHonoAuth` 回傳：

| 成員 | 說明 |
| --- | --- |
| `authenticate(ctx, meta)` | 每次請求的驗證（見上方），由後端的 route middleware 呼叫 |
| `assertVerification(ctx, operation)` | 消耗 `X-Auth-Verification` 標頭的一次性憑據 |
| `loginWithExternalIdentity(ctx, principalId)` | 以外部驗證的身分登入：設定 cookie 並回傳登入結果（`AuthLoginResultData`），由各專案自己的路由呼叫 |
| `routes` | 本人使用的路由處理函式，分為 `login`、`passwordReset`、`qrCodeLogin`、`security`、`verification` 五組，另有 `logout`（見下表） |
| `createManagementRoutes({ getActor, assertActorVerification, getTargetPrincipalId? })` | 管理他人帳號的路由處理函式；`getTargetPrincipalId` 預設取路由參數 `id` 並確認存在，可改為以權限與資料範圍篩選 |
| `realm` | 傳入的 realm |

每個處理函式都是 `AuthRouteDefinition`（`{ handlers, meta }`）；各後端的路由檔只轉接 handlers 並把 meta 併入自己的 route meta，不自行實作流程。

`routes`：

| 名稱 | 用途 | meta |
| --- | --- | --- |
| `login.password` | 密碼登入（`account`、`password`） | `noLoginRequired` |
| `login.secondFactor` | 登入第二步（`challengeId`、`proof`） | `noLoginRequired` |
| `login.getSecondFactorPasskeyOptions` | 登入第二步的 passkey 選項 | `noLoginRequired` |
| `login.getPasskeyOptions` | passkey 登入的選項（按 IP 限流） | `noLoginRequired` |
| `login.passkey` | passkey 登入 | `noLoginRequired` |
| `logout` | 登出並清除 cookie | `noLoginRequired` |
| `passwordReset.request` | 請求重設密碼（`account`）；一律回成功 | `noLoginRequired` |
| `passwordReset.complete` | 以收到的 token 重設密碼（`token`、`newPassword`） | `noLoginRequired` |
| `qrCodeLogin.create` | 建立 QR 登入請求 | `noLoginRequired` |
| `qrCodeLogin.poll` | 輪詢並領取 | `noLoginRequired` |
| `qrCodeLogin.getInfo` | 已登入裝置查詢請求方資訊 | |
| `qrCodeLogin.approve` | 核准（依平台設定要求高危驗證） | |
| `qrCodeLogin.reject` | 拒絕 | |
| `verification.getPasskeyOptions` | 高危驗證的 passkey 選項 | |
| `verification.sendCode` | 寄出高危驗證用的驗證碼，回傳遮罩後的收件位址（只有沒有第二因子的帳號可用） | |
| `verification.create` | 高危驗證，回傳一次性憑據（`operation`、`proof`） | |
| `security.getOverview` | 安全性總覽（因子、雙重驗證狀態、剩餘救援碼、是否已有密碼、變更密碼是否需要目前密碼、是否支援 passkey 與 QR 登入） | `allowRestrictedSession` |
| `security.getPasskeyRegistrationOptions` | 綁定 passkey 的選項（需 `auth.addFactor`，受限工作階段除外） | `allowRestrictedSession` |
| `security.registerPasskey` | 綁定 passkey；受限工作階段換發正常工作階段 | `allowRestrictedSession` |
| `security.renamePasskey` | passkey 改名（路由參數 `id`：credential ID） | |
| `security.removePasskey` | 移除 passkey（路由參數 `id`） | `verification: auth.removeFactor` |
| `security.startTotpSetup` | 開始綁定 TOTP（需 `auth.addFactor`，受限工作階段除外） | `allowRestrictedSession` |
| `security.confirmTotpSetup` | 確認 TOTP 綁定；受限工作階段換發正常工作階段 | `allowRestrictedSession` |
| `security.removeTotp` | 移除 TOTP | `verification: auth.removeFactor` |
| `security.regenerateRecoveryCodes` | 重新產生救援碼 | `verification: auth.regenerateRecoveryCodes` |
| `security.setTwoFactorEnabled` | 本人開啟或關閉雙重驗證（關閉需 `auth.disableTwoFactor`） | |
| `security.changePassword` | 變更或設定密碼並踢除全部工作階段，含目前裝置（`currentPassword?`、`newPassword`；見「密碼」） | |
| `security.listSessions` | 列出自己的工作階段 | |
| `security.revokeSession` | 踢除指定工作階段（路由參數 `id`） | |
| `security.revokeOtherSessions` | 踢除其他全部，目前的工作階段不變 | |

驗證事件的列表不由 pack 提供路由：各後端以自己的分頁與過濾機制查詢 `AuthEventModel`，並一律強制加上 `realm` 與 `principalId` 的條件。

`createManagementRoutes` 的處理函式（操作者的登入與權限由後端自己的 middleware 檢查）。對象可以是操作者本人：全部踢除與重設雙重驗證會連同操作者目前的工作階段一起登出：

| 名稱 | 用途 |
| --- | --- |
| `getSecurityOverview` | 帳號的安全性總覽 |
| `listSessions` | 列出帳號的工作階段 |
| `revokeSession` | 踢除指定工作階段（路由參數 `sessionId`） |
| `revokeAllSessions` | 踢除全部工作階段 |
| `setTwoFactorEnforced` | 設定或取消強制雙重驗證（`{ enforced }`；取消需操作者的 `auth.manageTwoFactor`） |
| `resetTwoFactor` | 重設雙重驗證（需操作者的 `auth.manageTwoFactor`） |

- ws.io 的連線驗證：ws.io-server 把 cookie 的 token 與來源 IP 交給後端的內部路由，後端以 `getAuthRealm(name)` 取得 realm 後呼叫 `authenticateAuthConnection(realm, token, { ip })`（`libs/auth/access.ts`）。它與 HTTP 的 `authenticate` 共用 `authenticateAuthSession`（secret、世代、期限、帳號啟用、受限工作階段是否仍需要），另外拒絕受限工作階段並檢查 IP 存取政策，但不順延工作階段。ws.io-server 在握手時驗證一次，連線期間定期重新驗證，收到 4xx 即斷線；握手時的 `Origin` 檢查由 ws.io-server 自行處理。
- 踢除時的即時斷線：realm 的 `onSessionsRevoked` 發出 `WsIoEventNames.ToServer.AuthSessionsRevoked`（realm 名稱、帳號、工作階段 ID），ws.io-server 中斷綁在這些工作階段上的連線；斷線前是否通知前端、前端如何提示由下游實作。踢除其他裝置時，目前的工作階段不在清單內，它的連線不受影響。通知失敗只記錄錯誤，正確性由定期重新驗證保證。
- 前端頁面（登入、安全性設定、裝置管理、QR 核准頁 `/auth/qr-code-login/`）在 admin-frontend 實作，其他前端自行複製調整。
