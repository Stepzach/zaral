# Zara Lake website

## Use the website

Upload `index.html`, `styles.css`, `app.js` and `favicon.svg` together to the existing web host. Keep these filenames. No build step is needed. The existing canonical domain and image URLs are preserved.

To preview locally, run `python3 -m http.server 8000` from this folder and open `http://localhost:8000`. Images and Google Fonts require an internet connection.

## Connect one Google Sheet with four tabs

`Zara-Lake-Content.xlsx` contains the four tabs below. Import it into Google Sheets, or import its tabs into the existing content spreadsheet. The testimonials, songs and image URLs come from the supplied website. The Gigs tab has an inactive starter row, not real dates: copy the current live gig rows into this tab before replacing the old feed.

Publish each of the four tabs as CSV. Paste each tab's complete published CSV URL into the matching `CONTENT_FEEDS` setting near the top of `app.js`. Use the published CSV URL, not an edit or sharing URL. Each URL must identify its own tab (normally with a distinct `gid` parameter). All four tabs can belong to the same Google Sheet. Publishing makes the selected content publicly readable; include website content only.

| Tab | Required column headers | Optional column headers |
| --- | --- | --- |
| Gigs | `date`, `venue` | `location`, `time`, `description`, `link`, `visible` |
| Testimonials | `quote`, `name` | `location`, `order`, `visible` |
| Setlist | `song`, `artist` | `order`, `visible` |
| Gallery | `image_url`, `alt` | `order`, `visible` |

Keep the headers in row 1. Add one item per row. Use `TRUE` to show an item and `FALSE` to hide it; blank visibility also means visible. Lower `order` numbers appear first; ties keep sheet order. Enter dates as real dates displayed in `yyyy-mm-dd` format, and times as the text you want visitors to see (for example `8–10 pm`). Upcoming gigs are sorted by date and filtered using today's date in London.

Gallery URLs must be direct, public HTTP(S) image URLs, such as the existing ImageKit URLs. A private Drive sharing link is not a direct image URL. Write a useful image description in `alt`. Every visible testimonial needs a quote and name, and every visible song needs a song title.

Blank feed settings keep the existing page content. A valid, published, header-only tab (or a tab with all rows hidden) hides its section. A failed or malformed feed keeps the saved content and displays a short status note. Gigs show an unavailable message if their feed fails. A blank or invalid gig date is skipped. Published Sheet updates can take time to propagate; the website requests the feeds on page load.

## Social media and bookings

Add Zara's verified full URLs to `INSTAGRAM_URL` and `TIKTOK_URL` in `app.js`. They are deliberately blank because the supplied files did not include them. Their cards show “Coming soon” until configured. The existing SoundCloud URL is already linked.

`BOOKING_FORM_URL` is optional. Leave it blank to use `hello@zaralakemusic.com`, or add a published booking-form URL. The large hero and header buttons lead to the booking section; its enquiry button opens the form or starts an email.

## Changes

- Peach, lavender, sage and soft yellow accents, with dark text for readability.
- Retro Spicy Rice wordmark inspired by the supplied lettering reference.
- Arched photos, soft corners and scrapbook-style framing.
- Larger booking buttons, including a persistent mobile header action.
- Prominent Instagram, TikTok and SoundCloud cards and hero links.
- Independent CSV loaders for all four content sections and a dynamic gallery lightbox.
- Existing mobile navigation, reduced-motion preference and keyboard focus styles retained.

## Verification and remaining setup

JavaScript syntax, internal navigation targets and the feed parsing/rendering logic were checked. Tests covered CSV quotes/newlines, invalid dates, link safety, row visibility/order, independent section loading, empty tabs, failed-feed fallback and gallery lightbox data. The content workbook was rendered and checked across all four tabs.

Full visual and interactive browser QA could not run in the editing environment because it has no browser executable. Before publishing, review desktop and mobile layouts, external photos/fonts, menu behaviour, keyboard interaction, the lightbox and the four live CSV feeds in a browser.

The live Google Sheet has not yet been created: Google Drive was installed during the session, but the spreadsheet import action was not exposed. Refresh the connection/session to finish that step. The existing gigs endpoint is preserved and was not changed or independently verified. No live website deployment has been made.
