/// <reference path="../pb_data/types.d.ts" />
// PocketBase starts every app with an open `users` collection: anyone may sign up.
// Nobody signs in to this app (an install is known by its key, pb_hooks/receipts.pb.js),
// so close it.
migrate((app) => {
  const users = app.findCollectionByNameOrId("users");
  users.createRule = null;
  app.save(users);
}, (app) => {
  const users = app.findCollectionByNameOrId("users");
  users.createRule = "";
  app.save(users);
});
