# Frontend

The frontend is built in React and deployed with Cloudflare "Workers and Pages".

## Admin section

If the `isAdmin` field for a user profile is set to `true` in the Firestore database, they will have access to the Admin tab.

In the Admin tab there are two sections:

* Projects, where projects can be added and deleted, analyses for them enabled and disabled, and detection counts read. The detection counts expose the raw data within the Firestore database, which varies between analyses.
* Users, where user display name, admin status and access to projects can be adjusted. Note: new users are not added here but instead by logging into the app with their Google Account.
