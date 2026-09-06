# Remember Me Login

## Will a user be auto logged in if they return within the 30-day window?

Yes. Here's how the feature works end-to-end:

1. **Login with "Remember me" checked** — the login form ([login.ejs](../source/views/login.ejs)) has an `app_remember_me` checkbox. When checked and login succeeds, `authController.login()` calls `issueRememberMeToken(res, user)`.

2. **Token generation and storage** — `issueRememberMeToken()` (in [helpers.js](../source/utils/helpers.js)) generates a random 32-byte token, hashes it with bcrypt, and saves the hash plus a 30-day expiry (`remember_token_hash`, `remember_token_expires`) on the `User` document ([User.js](../source/models/User.js)). The raw token is never stored, only its hash — same principle as password storage.

3. **Cookie set on the browser** — the raw token (paired with the `user_id`) is set as an `httpOnly`, `sameSite=lax` cookie named `remember_me`, with `maxAge` matching the 30-day expiry, and `secure` enabled in production. Being `httpOnly` means client-side JavaScript can't read it, reducing XSS exposure.

4. **Auto login on future requests** — `checkUserLoggedIn()` (the auth middleware in [helpers.js](../source/utils/helpers.js), used for every protected route in [app.js](../source/app.js)) first checks for an active session. If there isn't one (e.g. session expired or browser was closed), it looks for the `remember_me` cookie instead:
   - Parses out the `user_id` and `token`.
   - Looks up the user and checks `remember_token_expires` hasn't passed.
   - Compares the token against `remember_token_hash` with `bcrypt.compare()`.
   - If it matches, the session is silently re-established (`req.session.session_user_id`, `session_user_system_id`) and the request proceeds — no login form shown.

5. **Token rotation (sliding window)** — every time the cookie is successfully used to auto login, `issueRememberMeToken()` is called again, generating a brand new token/hash and resetting the expiry to another 30 days from now. This means:
   - As long as the user returns at least once every 30 days, they stay logged in indefinitely.
   - Each cookie value is single-use in practice — if an old cookie is replayed after rotation, it will no longer match the latest stored hash.

6. **Expiry / invalidation** —
   - If the user doesn't return within 30 days, `remember_token_expires` is in the past and the cookie is rejected, clearing it and redirecting to `/login`.
   - Any error during validation (bad cookie format, DB error, no match) also clears the cookie and redirects to `/login`.
   - On `logout()`, `clearRememberMeToken()` wipes `remember_token_hash`/`remember_token_expires` on the user and clears the cookie, so a stolen cookie can't be used after the user explicitly logs out.

**In short:** checking "Remember me" persists a hashed, rotating token as an httpOnly cookie. Returning within 30 days of the last use silently restores the session and refreshes the 30-day window; going longer than that (or logging out) requires signing in again.
