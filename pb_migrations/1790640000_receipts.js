/// <reference path="../pb_data/types.d.ts" />
/*
 * Receipts: the screenshot someone sends from ABA when they end a block early,
 * and the reply the developer writes back to it.
 *
 * Nobody signs in. Each install of ABA makes a 256-bit random key once, keeps it
 * in the Keychain, and sends it in the X-ABA-Install header. Anyone may send a
 * receipt; an install can read back only receipts sent with its own key, and
 * never another's. The key is stored in a hidden field, so no response carries
 * it — and since PocketBase ignores hidden fields in a non-superuser's request
 * body, pb_hooks/receipts.pb.js copies it there from the header. The verdict
 * and the reply are written by the developer in the dashboard (updateRule null:
 * superusers only) and can't be set by the sender.
 *
 * These three operations — create, list and view — are everything anyone but the
 * developer can do here.
 */
migrate((app) => {
  const own = "@request.headers.x_aba_install != '' && install = @request.headers.x_aba_install";

  const receipts = new Collection({
    type: "base",
    name: "receipts",
    createRule: "@request.headers.x_aba_install != '' && " +
      "@request.body.verdict:isset = false && @request.body.reply:isset = false",
    listRule: own,
    viewRule: own,
    updateRule: null,
    deleteRule: null,
    fields: [
      // The install's secret: base64url of 32 random bytes is 43 characters.
      { name: "install", type: "text", required: true, hidden: true, min: 43, max: 64, pattern: "^[A-Za-z0-9_-]+$" },
      // Not secret: the install's plain identifier, so receipts from one phone
      // group together for whoever reviews them.
      { name: "device", type: "text", required: true, min: 36, max: 36, pattern: "^[0-9A-F-]+$" },
      // The receipt's own id from the app. Unique, so a retried upload is
      // refused as a duplicate rather than stored twice.
      { name: "proof", type: "text", required: true, min: 36, max: 36, pattern: "^[0-9A-F-]+$" },
      // Re-encoded as JPEG by the app, at most 1400px on the long side: never
      // served without a file token.
      { name: "image", type: "file", required: true, maxSelect: 1, maxSize: 3145728, mimeTypes: ["image/jpeg"], protected: true },
      { name: "charity", type: "text", required: true, max: 80 },
      { name: "amount", type: "number", required: true, onlyInt: true, min: 1, max: 1000000 },
      { name: "currency", type: "text", required: true, min: 3, max: 3, pattern: "^[A-Z]{3}$" },
      // What was ended: a timer, routine or limit, by the app's id for it.
      { name: "block", type: "text", required: true, min: 36, max: 36, pattern: "^[0-9A-F-]+$" },
      { name: "captured", type: "date", required: true },
      { name: "app", type: "text", max: 40 },
      { name: "verdict", type: "select", values: ["accepted", "flagged"], maxSelect: 1 },
      { name: "reply", type: "text", max: 1000 },
      { name: "created", type: "autodate", onCreate: true, onUpdate: false },
      { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
    ],
    indexes: [
      "CREATE UNIQUE INDEX `idx_receipts_proof` ON `receipts` (`proof`)",
      "CREATE INDEX `idx_receipts_install` ON `receipts` (`install`)",
      "CREATE INDEX `idx_receipts_device` ON `receipts` (`device`)",
    ],
  });

  app.save(receipts);
}, (app) => {
  app.delete(app.findCollectionByNameOrId("receipts"));
});
