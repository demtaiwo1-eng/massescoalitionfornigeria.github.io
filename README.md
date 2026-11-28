# Masses Coalition of Nigeria — public website deployment

This repository publishes the MCN static frontend through GitHub Pages.

- **Live website:** https://demtaiwo1-eng.github.io/massescoalitionfornigeria.github.io/
- **Newsroom:** https://demtaiwo1-eng.github.io/massescoalitionfornigeria.github.io/newsroom/sign-in/
- **Explore News:** https://demtaiwo1-eng.github.io/massescoalitionfornigeria.github.io/source-desk/
- **API health:** https://mcn-newsroom-api.onrender.com/health
- **Application source and complete client handover guide:** https://github.com/demtaiwo1-eng/massescoalitionfornigeria/blob/main/README.md

## Deployment and browser QA

The website is built from the `main` branch of `demtaiwo1-eng/massescoalitionfornigeria` and published with GitHub Pages.

After a successful Pages deployment, the **Selenium external URL browser test** workflow installs Chromium and ChromeDriver, opens the live site and runs the configured browser smoke test. It can also be run manually from the Actions tab.

## Homepage news presentation

The homepage now displays all 35 collected news stories in its Explore News section, with images, headlines, summaries, categories, publication dates and links to the original articles. Publisher-specific branding has been removed from the MCN presentation. The stories remain distinct from original MCN newsroom publications and require independent editorial review before being represented as MCN reporting.

## Platform notes

- The public frontend is static; newsroom features depend on the separate Render API and Neon PostgreSQL database.
- The custom domain `www.massescoalitionfornigeria.com` remains pending DNS and verification.
- The source repository's README documents navigation, roles, Administrator controls, advanced access, hosting configuration, Android packaging requirements, pricing and known limitations.


News briefing images and article links remain connected to their respective original publication pages.

The homepage and Explore News page display the available featured images for all 35 collected stories.
