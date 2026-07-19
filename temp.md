# Authentication 架構最終審查

> 暫時性工程設計結論。範圍包含 Password、Passkey/WebAuthn、TOTP、Step-up、QR 跨裝置登入、Session 與權限快取；不考慮舊版相容或既有登入狀態。

## 結論

現有 `authentication-session` 核心可保留，但不能繼續把新的登入方式直接接到 Session 或各自建立一套 route 狀態。最終應明確拆成：

1. **Authenticator/Credential**：長期憑證資料，存 MongoDB／主要資料庫。
2. **Authentication Transaction**：短期、一次性的登入／重新驗證／憑證綁定流程，存 Redis。
3. **Authentication Session Transfer**：已登入裝置授權新裝置建立 Session；QR 只是 token 的傳遞介面。
4. **Authentication Session**：只保存已完成認證後的 Session，不驗 Password、Passkey 或 TOTP。
5. **Authorization**：權限與權限快取，和 Authentication 完全分離。

目前不需要另架獨立 Auth Service。Pack 提供通用狀態機、Redis 原子操作與 Hono adapter，各 Backend 提供 principal、credential、policy、route、audit。只有未來需要集中管理 credential、policy、簽發金鑰，或多個獨立服務共同簽發同一認證域且要求嚴格一致性時，才值得集中成 Auth Service；單純多個 Backend 共用 Redis 並不足以構成另架服務的理由。

## Pack 最終邊界

### 應由 Pack 提供

- 使用明確 `AuthenticationSessionPrincipalType` union 的 Authentication Session Store／Manager。
- Session token、touch、rotate、list、revoke、revokeAll 與 Hono Cookie adapter。
- `AuthenticationTransactionStore`：短 TTL、一次性 challenge、factor completion、ready／consume 狀態。
- `AuthenticationSessionTransfer`：create、info、approve、consume、cancel。
- `StepUpGrantStore`：短 TTL、綁定 Session／principal／purpose／audience 的重新驗證結果。
- 通用 `AuthenticationContext` 與最小 Credential schema/type builders。
- Redis Lua：只處理需要線性化的狀態轉移、challenge consume、transfer consume 與 Session 建立。
- 通用 `AuthenticationContext`、transaction／transfer types、runtime validation。
- Kick-only service 使用的 Manager API；不得要求 token HMAC key。

### 應留在各 Backend

- Admin／User／Agent 等 principal model 與 enabled/revision 驗證。
- Password Argon2 驗證。
- WebAuthn RP ID、allowed origins、credential 查詢與成熟 WebAuthn 套件的驗證。
- TOTP secret、演算法、驗證窗口、enrollment/recovery policy。
- 風控、所需 factor／assurance policy、rate limit 維度。
- Routes、API response、UI、登入紀錄、通知與產品文案。

Pack 不應 import Admin/User/Agent model，也不應出現 `adminQrCodeLogin`、`totpVerified` 等身分或方法專用欄位。

## Principal 與 Redis 隔離

Principal type 保持明確 union，不做 factory generic 或任意字串擴充：

```ts
type AuthenticationSessionPrincipalType = 'admin';
```

Core Stack 保持：

```ts
export type AuthenticationSessionPrincipalType = 'admin';
```

Sync 到 Strayit 後只擴充中央 union：

```ts
export type AuthenticationSessionPrincipalType = 'admin' | 'agent' | 'user';
```

Session、Transaction、Transfer 與 Step-up 全部引用同一 union，因此新增身分不需改核心流程。

Redis key 維持每個產品 Pack 固定 application prefix，再加 `ENVIRONMENT` 作環境隔離；不增加每個 Store 可自由指定的 `keyPrefix`／`authenticationDomain`。Core Stack 與 Strayit 即使使用同一 Redis DB，也必須各自保留不同產品 prefix。

## Authentication Transaction

Password、Passkey、TOTP、Recovery Code 不應各自直接建立 Session。統一流程為：

```text
begin -> verify method(s) -> ready -> consume/finalize
                              \-> expired/cancelled
```

Transaction 至少保存：

- purpose：sign-in、step-up、authenticator-binding、recovery 等。
- principal type／ID（辨識後）；產品與環境隔離由 Redis key 的固定 prefix 隱含保證。
- principal authentication revision。
- audience／target context。
- server policy 要求的 capabilities／assurance。
- server 已驗證的 method evidence references。
- expiresAt、attempt state、terminal state。

規則：

- Required/completed methods 與 assurance 只能由伺服器更新，不能接受 Client 宣告。
- Challenge 必須高熵、短效、綁 transaction/purpose/audience，且只能原子消費一次。
- 單次 factor 驗證失敗只增加 attempt／rate-limit 狀態；達到 policy 上限後才將整個 Transaction 標記為 failed。expired、failed、consumed、cancelled 都是終局狀態。
- Redis、authoritative DB 或 limiter 無法使用時，驗證與 Session issuance 必須 fail closed。
- Redis 不保存 Password、TOTP secret、WebAuthn private material 或可重放 assertion。

Transaction 不是任意 JSON workflow engine。Pack 只接受明確、經 runtime validation 的狀態與 evidence references；factor verifier 與 policy evaluator 仍由 Backend 掌握。

`AuthenticationContext` 本次直接納入 Session，但只能保存通用結果，例如：

```ts
interface AuthenticationContext {
    authenticatedAt: number;
    assuranceReferences: string[];
    methodReferences: string[];
    policyRevision?: string;
}
```

Backend policy 負責解讀其意義；不能用「完成兩種 method」直接推定 MFA/AAL。該 Context 是 Session 建立時的不可變快照，不代表目前仍滿足所有敏感操作；Step-up 必須重新依現行 policy 判斷，必要時比較 `policyRevision`。

## Passkey / WebAuthn

Passkey 是獨立 Authenticator，不應塞進 principal 主 schema 的一堆 optional 欄位。Credential 至少需保存：

- credential ID
- public key
- user handle／principal binding
- sign count
- transports
- backup eligibility／backup state
- createdAt、lastUsedAt、display metadata、disabled/revoked state

Registration 與 authentication challenge 必須：

- 由伺服器產生足夠熵的隨機值。
- 短效、一次性、綁 transaction、ceremony type、RP ID、allowed origin，以及適用時的 principal／credential。
- 驗證 `type`、challenge、origin、RP ID hash、signature、UP／UV policy。
- Credential counter 以 DB conditional update 處理；counter 倒退是風險訊號，不應一律鎖帳，且需容許 synced passkey counter 為 0 的現況。

不要自行實作 WebAuthn cryptography；Pack 最多提供 challenge/transaction storage contract，Backend 使用成熟套件驗證。

Passkey 本身可能是 passwordless 或具 user verification 的 multi-factor authenticator；不能硬編為「Passkey 通過後仍必須 TOTP」。是否需要額外 factor 由 policy 決定。

產品的 QR Session Transfer 也不能與 FIDO Passkey Cross-Device Authentication 混為一談；後者屬 WebAuthn／CTAP 平台流程。

參考：[W3C WebAuthn Level 3](https://www.w3.org/TR/webauthn-3/)、[FIDO Passkeys](https://fidoalliance.org/passkeys-2/)。

## TOTP 與 Recovery

TOTP 應是可插拔 authenticator，不在 Session schema 增加 `totpEnabled`／`totpVerified`：

- Secret 必須可取回以驗證，因此應加密保存，而不是 hash；加密金鑰與資料分離並可輪換。
- Enrollment 先保持 pending，使用一次有效 code 驗證後才正式 binding。
- 預設 time-step 30 秒；驗證窗口保持最小，由 Backend policy 設定。
- 按 principal、authenticator、IP 做 rate limit。
- 成功驗證時原子保存 `lastAcceptedTimeStep`，同一 time-step 的 code 不得成功兩次，即使並行請求也不行。
- TOTP 只完成一個 factor，不得自行建立 Session。
- TOTP 屬可被釣魚／relay 的 OTP，不應標示為 phishing-resistant。

Recovery code 應視為高風險認證旁路：高熵、逐筆 hash/HMAC 保存、單次原子 consume、rate limit。Account recovery 成功後增加 `authenticationRevision`、撤銷既有 Sessions，並產生可靠 audit／notification。Authenticator 新增、替換或移除必須先以既有方法重新驗證；是否撤銷所有 Sessions 由該事件是否代表 credential compromise／account recovery 決定，不應無條件登出所有裝置。

參考：[RFC 6238](https://www.rfc-editor.org/rfc/rfc6238.html)、[RFC 4226](https://www.rfc-editor.org/rfc/rfc4226.html)、[OWASP MFA Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Multifactor_Authentication_Cheat_Sheet.html)。

## Step-up 與敏感操作

Step-up 不應只在 Session 永久寫入 `totpVerified: true`。應產生短 TTL 的 `StepUpGrant`，至少綁定：

- current session ID
- principal
- purpose／audience／action digest
- required assurance
- verifiedAt／expiresAt

敏感操作原子消費 grant；若產品明確需要極短時間重複使用，必須由 policy 設定。重新認證或權限提升後若替換 Session，必須 rotate／換發新 token，避免 Session fixation。

更換、移除 Passkey/TOTP 或新增 recovery method 必須以既有 authenticator 重新驗證，不能只信任一個已登入的長期 Session。

`StepUpGrantStore` 本次直接建立，避免 Passkey 上線後再次改 Session／Transaction 邊界。它應重用 Authentication Transaction 的 verified result，但 grant 本身是獨立、短效、可原子消費的授權物，不得直接把長期 Session 永久標成「已完成高強度驗證」。

參考：[OWASP Authentication](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)、[OWASP Transaction Authorization](https://cheatsheetseries.owasp.org/cheatsheets/Transaction_Authorization_Cheat_Sheet.html)、[NIST SP 800-63B-4](https://pages.nist.gov/800-63-4/sp800-63b.html)。

## QR / Authentication Session Transfer

目前 `libs/admin/qr-code-login.ts` 不應保留，也不應 inline 到單一路由；confirm 與 consume 本來就共同使用，而且未來其他 Backend／principal 也會需要。

Pack 應提供身分無關的 `AuthenticationSessionTransfer`：

```text
pending -> approved -> consumed
        \-> cancelled/expired
```

要求：

- QR 只攜帶高熵 opaque request token，不攜帶 principal、credential 或 Session token。
- Transfer 綁 target request、來源 principal、source session selector/epoch/revision 與 target metadata；產品與環境隔離由固定 Redis prefix 保證。
- approve 只能一次；consume 只能一次；expired／consumed 不得重新 approve。
- target 一律取得全新 Session token，絕不複製來源 token。
- 最終 consume Script 必須重新確認 source Session／epoch/revision 仍有效，並原子完成 Transfer consume、target Session 建立與索引更新。
- Mongo principal validation 可在 Script 前執行；Script 必須再次驗 Redis source Session，消除 `list -> revoke -> create` 競態。
- 使用 Redis `TIME` 判斷短效窗口，避免多 Backend clock skew。

這部分應完整取代 Pack 的 `AdminQrCodeLoginData`、`adminQrCodeLoginData` store 與目前 JSON/tombstone 拼裝，不保留相容層。

## Session 與安全異動

現有 Session 的 selector/validator、HMAC、epoch、idle/absolute TTL、touch interval、rotate/revoke 架構可保留。

以下會使既有 Session 不再可信的異動，統一增加 `authenticationRevision` 並 revokeAll：

- Password 變更／重設
- 已洩漏／遺失 Authenticator 的撤銷或安全性重設
- Recovery 成功
- Principal 停用或高風險安全事件

在有效 reauthentication 後單純新增備援 Passkey/TOTP，不必自動撤銷全部 Sessions；但仍須可靠 audit／notification。`authenticationRevision` 只用於確實需要讓既有 Session 失效的事件，不能變成所有帳號設定修改的通用 revision。

`authorizationRevision` 必須另外存在，只處理角色／權限變更，不得與 `authenticationRevision` 合併。

不得在 Session 尚未建立時先記錄 login success。Session 建立後再以具 idempotency、retry 與監控的事件／audit pipeline 記錄；Redis 與 Mongo 無法藉一般 outbox 自動取得 exactly-once 保證，若稽核完整性是硬性要求，才需集中簽發與 durable coordinator。Audit 不記 token，只記 session selector、principal/type、method references、來源／目標 IP/UA、結果與原因。

參考：[OWASP Session Management](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)。

## 權限快取

權限快取保留，但使用：

```text
adminPermission:<principalId>:<authorizationRevision>
```

並設定 TTL。禁止 `KEYS adminPermission:*` 與全域刪除。Role／isSuperAdmin 變動時，在 Mongo transaction 內更新受影響 principal 的 `authorizationRevision`；舊請求即使晚寫入，也只會寫入舊 revision key。Session principal validation 查 DB 時應同時取得此 revision 與必要 Admin projection，放入 request context，避免 permission middleware 再查一次 Admin。Redis 故障時直接查 authoritative DB，Permission cache 不應成為登入安全的 fail-closed 單點。

## 建議檔案結構

```text
src/libs/authentication-session/
  redis-store/
  redis-transfer/

src/libs/authentication-transaction/
  redis-store/

src/hono-backend/libs/
  authentication-session.ts
  authentication-transaction.ts

src/types/
  authentication-session.ts
  authentication-transaction.ts
  authentication-session-transfer.ts
```

Authenticator persistence 不建立一個充滿 nullable 欄位的萬用 schema。本次由 Pack 提供最小 Credential builder，只統一 principal binding、method reference、label、created/last-used、disabled/revoked 等共通生命週期欄位，並由呼叫端傳入 method-specific schema 與 runtime validator。Passkey/TOTP 各自維持清楚的 credential payload；builder 不負責 cryptographic verification，也不預先猜 Recovery 欄位。

## 必要測試

- 雙 approve、雙 consume、consume vs revoke/revokeAll/revision bump。
- Challenge replay、跨 origin、跨 RP、跨 ceremony、過期與並行 consume。
- TOTP 同 time-step 並行重放、rate-limit failure。
- Passkey sign counter 並行更新與 synced credential counter=0。
- Step-up grant 跨 Session／principal／action 重放。
- Session fixation、重新認證後 token rotation。
- 不同產品固定 prefix、environment、principal type 的 Redis key 隔離。
- Redis `NOSCRIPT`、failover、timeout，以及 DB／Redis／limiter error 的 fail-closed 行為。
- Login Session 成功但 audit failure、audit 成功但 Session failure的可觀測與補償。

## 實作順序

1. Pack：保留中央 principal union 與產品固定 Redis prefix，所有新模組共用相同 key 規則。
2. Pack：新增 `AuthenticationContext`、Authentication Transaction 與 Step-up Grant。
3. Pack：新增最小 Credential schema/type builder，不實作 Recovery。
4. Pack：新增 Session Transfer 與原子 target Session issuance。
5. Pack：移除 Admin 專用 QR types/store。
6. Pack：Admin schema 新增 `authorizationRevision`，權限 cache key 版本化。
7. mabk：QR routes 改用 Pack transfer，移除 Admin helper。
8. Backend：接入 Password，並為近期 Passkey 實作預留 verifier／credential payload；TOTP 可稍後接入同一 Transaction。
9. Recovery 與 durable audit/outbox 延後；現在只保留可串接邊界，不建立未使用的流程。

## 最終判斷

不需要重寫現有 Session 核心，也不應現在另架服務。應重構的是 Session 之前的認證流程：本次直接建立通用 Transaction、Authentication Context、Step-up Grant、最小 Credential builder，以及身分無關的 Transfer；Recovery 與 durable audit pipeline 延後。最終只由通過 server policy 的結果建立、轉移或短效提升 Session。如此近期加入 Passkey、之後加入 TOTP 或同步至 Strayit 時，只新增 method adapter／credential payload／policy，或擴充中央 principal union，不再修改 Session、Redis key schema 或重做 route 競態控制。
