import assert from "node:assert/strict";
import { buildVietQrUrl, isPaidAppRecipient, PAID_APP_ACCOUNT } from "../src/lib/coffee-payment";

const qr = new URL(buildVietQrUrl(20000, "AIMOABC123"));
assert.equal(qr.pathname, `/image/bidv-${PAID_APP_ACCOUNT.accountNumber}-compact2.png`);
assert.equal(qr.searchParams.get("amount"), "20000");
assert.equal(qr.searchParams.get("addInfo"), "AIMOABC123");
assert.equal(qr.searchParams.get("accountName"), PAID_APP_ACCOUNT.accountName);

assert.equal(isPaidAppRecipient("BIDV", PAID_APP_ACCOUNT.accountNumber), true);
assert.equal(isPaidAppRecipient(" bidv ", ` ${PAID_APP_ACCOUNT.accountNumber} `), true);
assert.equal(isPaidAppRecipient("SeABank", PAID_APP_ACCOUNT.accountNumber), false);
assert.equal(isPaidAppRecipient("BIDV", ""), false);
assert.equal(isPaidAppRecipient("BIDV", null), false);
assert.equal(isPaidAppRecipient("BIDV", "666006668789"), false);
