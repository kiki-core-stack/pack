# @kiki-core-stack/pack

kiki-core-stack（KCS）各 repo 共用的程式碼：資料模型、常數與型別、錯誤碼、多語系、權限、zod 擴充、儲存與外部服務 provider，以及 Hono 後端的共用元件。各 repo 以 git commit 版本依賴（`@kcs-project/pack`），不發布到 npm。

- 使用方式與共用約定：[docs/kcs/pack.md](./docs/kcs/pack.md)。
- 登入、工作階段與驗證身分：[docs/kcs/auth.md](./docs/kcs/auth.md)。

下游 repo 以 `fetch-and-merge.sh` 合併本專案；自己的說明寫在 `docs/<專案名>/`，不修改上游的 docs，以免合併衝突。
