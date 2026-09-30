---
solhann_app: true
slug: aba
title: ABA receipts
description: Where the ABA iPhone app sends a donation receipt when someone ends a block early, and where the developer's reply to it is written.
---

# ABA receipts

Where the ABA iPhone app sends a donation receipt when someone ends a block
early, and where the developer's reply to it is written.

**Live:** https://aba.solhann.net

A solhann.net platform app, public access, PocketBase 0.39.5. The app that
talks to it is the ABA iPhone app (its `Donation/ReceiptServer.swift`); the
identity files and `pb-auth.js` are the platform template's, unchanged.

## What it holds

One collection, `receipts`. No accounts: the platform's public mode closes
sign-up, and nobody using ABA should need one.

- **Sending.** Each install of ABA makes a 256-bit key once and keeps it in the
  Keychain. It sends every receipt with that key in the `X-ABA-Install`
  header. `pb_hooks/receipts.pb.js` files the receipt under the key (a hidden
  field: no response ever carries it, and PocketBase ignores hidden fields in
  a non-superuser's request body, so the hook copies it from the header) and
  caps an install at twenty receipts a day.
- **Reading back.** An install lists and views only the receipts sent with
  its own key. Anyone else gets an empty list, and a 404 by id.
- **Replying.** `verdict` (accepted or flagged) and `reply` are written by a
  superuser in the dashboard; the sender can't set them (create rule) or
  change anything after (update rule: superusers only). ABA reads them back
  when it next comes to the front, shows the reply once, and keeps it under
  Receipts in Settings.
- **Screenshots** are protected files: never served without a file token.
  They can show a donor's name or email.
- **Retries** are safe: `proof` (the app's id for the receipt) is unique, so a
  second upload is refused as a duplicate, which the app counts as sent.

Anonymous surface, as `spec.json` declares it: `GET /`, `create:receipts`,
`list:receipts`, `view:receipts`.

## Run it locally

`pb-dev` from this checkout serves it at http://127.0.0.1:8090. Point ABA's
Demo build at it and queue a sample receipt without going through the donation
gate:

```sh
xcrun simctl launch <udid> net.solhann.ABA.demo -aba-server http://127.0.0.1:8090 -aba-receipt
```

Reply in the dashboard at http://127.0.0.1:8090/_/ (receipts ▸ the record ▸
verdict, reply ▸ Save), then bring ABA back to the front. On production it's
https://aba.solhann.net/_/, as `admin@solhann.net` with the password prod
generated (`/etc/pocketbase/aba.superuser`, root only).

The scaffold's example `pb_hooks/main.pb.js` is gone on purpose: its
commented-out `$http.send` and `cronAdd` examples fail the lint for an app
whose spec declares neither.
