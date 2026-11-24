# shoaib.dev: portfolio

My personal portfolio site: hand-written HTML, CSS and vanilla JavaScript, with no frameworks and no build step. It's hosted on AWS.

**Live:** <https://d3r8nll5h7sqin.cloudfront.net/>

## Features

- **Interactive hero:** a canvas particle field that follows your cursor and bursts when you click, plus a typewriter line that cycles through roles.
- **Scroll effects:** sections reveal as you scroll, a progress bar fills along the top, the experience timeline lights up, and the stat counters animate.
- **Projects:** cards that tilt in 3D with a glare effect, filter chips, and buttons that pull toward the cursor.
- **Skills:** hover over a skill to see where I used it, or click one to jump to that job.
- **A working terminal:** try `help`, `whoami`, `projects`, `open acl` or `sudo hire shoaib`. Tab autocompletes, and ↑/↓ cycles through history.
- **Command menu:** press `⌘K` / `Ctrl K` or `/`.
- **Playable projects:**
  - [`/projects/acl/`](projects/acl/): a router ACL simulator (standard and extended lists, first match wins, implicit deny).
  - [`/projects/playfair/`](projects/playfair/): a Playfair cipher you can step through on a live key square.
  - [`/projects/pizza-bot/`](projects/pizza-bot/): a case study of my Amazon Lex chatbot, with a Cognito sign-in demo.
- **Easter eggs:** try the Konami code. 🍕
- **Accessible:** everything works with the keyboard, the content is readable without JavaScript, and animations turn off for people who prefer reduced motion.

## Layout

```
index.html              home page
css/style.css           all styles (dark theme, playgrounds)
js/main.js              home page interactions
projects/acl/           ACL simulator page + acl.js
projects/playfair/      Playfair cipher page + playfair.js
projects/pizza-bot/     pizza bot case study + Cognito landing pages
404.html                custom not-found page
deploy.sh               sync to S3 + invalidate CloudFront
```

## Hosting

- **Amazon S3:** a private bucket holds the files.
- **Amazon CloudFront:** serves the site over HTTPS and reads the bucket through Origin Access Control. It also serves `404.html` for missing pages.
- **Deploying:** `./deploy.sh` syncs the folder to S3 and clears the CloudFront cache. It needs AWS CLI credentials with access to the bucket and distribution.

To run it locally, serve the folder from its root, because pages use root-relative paths like `/css/style.css`:

```bash
python3 -m http.server 8000
```

## Related repos

- [acl-simulator](https://github.com/shoaibsr7/acl-simulator): the Java version of the ACL simulator
- [playfair-cipher](https://github.com/shoaibsr7/playfair-cipher): the Java version of the Playfair cipher
- [FinalProject_CloudComputing](https://github.com/shoaibsr7/FinalProject_CloudComputing): the pizza bot (Lex, Lambda, Cognito)
