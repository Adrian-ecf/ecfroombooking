# ECF Room Board — Netlify version

This is the standalone version of the room booking board. It's a static
page (`public/index.html`) plus one small server-side function
(`netlify/functions/reservations.js`) that stores bookings in Netlify Blobs
— Netlify's built-in storage. No external database needed.

## What's in this folder

```
ecf-room-board/
├─ netlify.toml                        (tells Netlify where things are)
├─ package.json                        (one dependency: @netlify/blobs)
├─ public/
│  └─ index.html                       (the whole app — page, styling, logic)
└─ netlify/
   └─ functions/
      └─ reservations.js               (reads/writes bookings)
```

## Option A — Deploy via GitHub + Netlify (no command line needed)

1. Create a new repository on GitHub and upload this whole `ecf-room-board`
   folder to it (GitHub's website lets you drag-and-drop files in if you'd
   rather not use git directly).
2. Go to [app.netlify.com](https://app.netlify.com) and sign up / log in
   (free tier is fine).
3. Click **Add new site → Import an existing project**, and connect it to
   the GitHub repo you just created.
4. Netlify should auto-detect the settings from `netlify.toml`
   (publish directory `public`, functions directory `netlify/functions`).
   Leave the build command blank and click **Deploy**.
5. Netlify will install the one dependency (`@netlify/blobs`) automatically
   during the build. No extra setup is needed for storage — Netlify Blobs
   works automatically once the site is deployed.
6. Once deployed, you'll get a URL like `your-site-name.netlify.app`. Share
   that with your team.

## Option B — Deploy via the Netlify CLI (if you're comfortable with a terminal)

1. Install Node.js if you don't already have it (nodejs.org).
2. From inside this folder, run:
   ```
   npm install -g netlify-cli
   netlify login
   netlify deploy --prod
   ```
3. Follow the prompts (create a new site, publish directory `public`).
   Netlify will pick up `netlify.toml` and the function automatically.
4. It'll print a live URL when done — share that with your team.

## Testing it locally before deploying (optional)

If you have Node.js and the Netlify CLI installed, run this from inside
the folder:
```
netlify dev
```
This runs the site and the function together on your own machine (usually
at `http://localhost:8888`) so you can try it out before going live.

## Notes

- Business hours are 8am–6pm, Monday–Friday, in 15-minute increments —
  edit the constants near the top of the `<script>` in `index.html` if
  you need to change that.
- Rooms are defined in the `GROUPS` array near the top of the same
  `<script>` block — edit names there if a room changes.
- Bookings can only be made from tomorrow onwards. That's controlled by
  `MIN_BOOKABLE` in `index.html`.
- All reservation data lives in Netlify Blobs under the store name
  `ecf-room-board`. There's no admin UI for it, but you can browse and
  edit blobs from your site's dashboard on Netlify if you ever need to.
