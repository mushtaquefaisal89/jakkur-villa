# Jakkur Villa website

A fast, static showcase website for Jakkur Villa. No build step and no server code, so it runs anywhere.

## What's inside

| Path | What it is |
|---|---|
| `index.html` | The full one-page site (20 sections) |
| `privacy.html`, `terms.html`, `disclaimer.html`, `404.html` | Legal and error pages |
| `css/styles.css` | Design system: colours, fonts, layout, animations |
| `js/main.js` | Animations, level explorer, gallery and lightbox, EMI calculator, booking and brochure forms |
| `images/` | 43 real property photos from the brochure: full size (`name.jpg`) + mobile size (`name-sm.jpg`) |
| `brochure/jakkur-villa-brochure.pdf` | The brochure offered for download |
| `serve.ps1` | Local preview server (Windows, no install needed) |
| `vercel.json`, `robots.txt`, `sitemap.xml` | Hosting and SEO files |

## Preview on this computer

```powershell
powershell -ExecutionPolicy Bypass -File serve.ps1
```
Then open http://localhost:5500

## Settings (top of `js/main.js`)

| Setting | What to do |
|---|---|
| `web3formsKey` | Booking emails. Go to https://web3forms.com, enter jakkurvilla@gmail.com, copy the access key and paste it here. Until then, bookings open WhatsApp with all details filled in for the visitor to send. |
| `tourUrl` | Paste a Matterport or Kuula link to switch on the 360° tour button. |
| `plausibleDomain` | Optional analytics; loads only if the visitor accepts cookies. |

## Go live free on Vercel or Netlify

- **Netlify (easiest):** open https://app.netlify.com/drop and drag the whole `jakkur-villa` folder onto the page.
- **Vercel:** create a project, upload this folder (or connect a GitHub repo) and deploy. No build command, output folder is the root.
- Then add your domain in the host's settings and replace `https://www.example.com` in `index.html`, `robots.txt` and `sitemap.xml`.

## Still to fill in (shown on the site with a dashed gold underline)

Plot size, khata, approvals, RERA, completion year, possession, furniture, maintenance, Bhartiya City and airport travel times, nearby schools and hospitals.
Search `tbc` in `index.html` to find each one.

## Not included yet

Owner admin page and a saved leads database need a backend (e.g. Supabase). Bookings currently arrive by email (Web3Forms) or WhatsApp.
