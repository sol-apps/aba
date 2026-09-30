/// <reference path="../pb_data/types.d.ts" />
/*
 * receipts.pb.js — who a receipt belongs to, and how many one install may send.
 *
 * The collection's rules decide who may send and read (pb_migrations). This
 * does the two things rules can't:
 *
 *   1. Files the receipt under the sender's install key. The key lives in a
 *      hidden field so no response carries it, and PocketBase ignores hidden
 *      fields in a non-superuser's request body — so it's taken from the
 *      X-ABA-Install header here, the same header the list rule checks.
 *   2. Caps how much one install may send: a leaked key or a runaway retry
 *      loop fills a day's allowance, not the disk. Twenty a day is far past
 *      anyone ending blocks honestly.
 */
onRecordCreateRequest((e) => {
  if (e.hasSuperuserAuth()) {
    e.next();
    return;
  }
  // Header names arrive normalised: lower case, dashes as underscores.
  const install = e.requestInfo().headers["x_aba_install"] || "";
  if (!/^[A-Za-z0-9_-]{43,64}$/.test(install)) {
    throw new BadRequestError("A receipt needs its install key.");
  }
  e.record.set("install", install);

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().replace("T", " ");
  const sent = e.app.countRecords("receipts",
    $dbx.exp("install = {:install} AND created > {:since}", { install: install, since: since }));
  if (sent >= 20) {
    throw new ApiError(429, "Too many receipts from this install today.");
  }
  e.next();
}, "receipts");
