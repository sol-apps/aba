/// <reference path="../pb_data/types.d.ts" />
/*
 * cleanup.pb.js — receipts are kept for 24 hours, then deleted.
 *
 * The owner decided on 2026-10-01: a receipt is on the server for a day, which
 * is long enough to read it and reply. One nobody reviewed in that time counts
 * as accepted — the unlock already happened, and deleting it is the same
 * outcome as accepting it, so nothing is written first. Deleting the record
 * deletes its screenshot with it.
 *
 * ABA keeps its own copy of every receipt and of any verdict or reply it read
 * back, so a receipt disappearing here changes nothing on the phone; the list
 * just stops returning it.
 *
 * Runs hourly, so a receipt lives between 24 and 25 hours.
 */
cronAdd("receipts-cleanup", "0 * * * *", () => {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().replace("T", " ");
  let deleted = 0;
  // In pages, so a backlog never loads every record at once.
  for (;;) {
    const old = $app.findRecordsByFilter("receipts", "created < {:cutoff}", "created", 200, 0,
      { cutoff: cutoff });
    if (old.length === 0) break;
    for (const record of old) {
      $app.delete(record);
      deleted++;
    }
  }
  if (deleted > 0) {
    console.log("[receipts] deleted " + deleted + " older than 24 hours");
  }
});
