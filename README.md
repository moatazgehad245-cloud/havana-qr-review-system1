# HAVANA QR Customer Review System

A mobile-first customer review page plus a protected manager dashboard, styled around Havana's burgundy, charcoal, cream, and gold palette.

## Project contents

- `index.html` — public customer review page; this is the URL encoded into the customer QR.
- `admin.html` — manager dashboard and email/password login.
- `style.css` — responsive branding and layout.
- `client.js` — validates the review and inserts it into Supabase.
- `admin.js` — Supabase authentication, admin authorization, stats, and review list.
- `config.js` — public Supabase URL and anon key placeholders.
- `schema.sql` — database tables and row-level security policies.

## Important: configure the backend before handing this to a client

A static HTML page alone cannot safely provide a real private manager account or store reviews across devices. This project uses Supabase Auth + PostgreSQL with Row Level Security (RLS).

### 1. Create Supabase project

1. Create a project at https://supabase.com.
2. In **Project Settings → API**, copy the **Project URL** and the **anon/public key**.
3. Put them into `config.js`:
   - `SUPABASE_URL`: your project URL
   - `SUPABASE_ANON_KEY`: your anon/public key
4. Never use the `service_role` key in any browser-side file.

### 2. Create tables and security policies

1. Open **SQL Editor** in the Supabase dashboard.
2. Paste and run all of `schema.sql`.
3. Confirm both tables exist: `reviews` and `admin_users`.

### 3. Create the manager account

1. In Supabase, open **Authentication → Users → Add user**.
2. Create the manager's email/password account. Use a strong unique password.
3. Copy the new user's UUID.
4. In the SQL Editor, run this query after replacing the UUID:

```sql
insert into public.admin_users (user_id)
values ('PASTE-MANAGER-USER-UUID-HERE');
```

Only users listed in `admin_users` can read review records. Creating an Auth account by itself does not grant manager access. To add a second manager, create another Auth user and insert that user's UUID too.

### 4. Test before publishing

- Open `index.html` through a local web server or hosted HTTPS site (not a `file://` URL).
- Submit a test review.
- Open `admin.html`, sign in with the authorized manager account, and verify the review appears.
- Test an ordinary/non-admin account: it must not be able to read the reviews.
- Check Supabase Auth settings and use a strong manager password. Never share the manager login with customers.

### 5. Publish the website

Upload the project files to a static HTTPS host such as Netlify, Cloudflare Pages, or GitHub Pages. Upload all files into the same published directory.

Example:
- Customer page: `https://YOUR-DOMAIN.example/index.html`
- Manager page: `https://YOUR-DOMAIN.example/admin.html`

Create a QR code from the **public customer URL only**. Do not encode `admin.html` in the restaurant's public QR.

### 6. Current scope / production notes

Included: customer star ratings, optional favorite category, optional comment, visit type, public insert, authenticated manager login, admin authorization check, review table, total count, average rating, and count of 4–5 star reviews.

Before a high-volume public launch, consider CAPTCHA/rate limiting to reduce spam, backups/retention, a privacy notice, and custom-domain testing. This implementation does not collect customer names, phone numbers, or email addresses. Reviews are displayed only in the manager dashboard.
