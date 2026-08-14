# Submission checklist

## Before recording

- [ ] Run `npm run seed` and see the successful seed message.
- [ ] Run `npm run verify` and confirm at least 18 nodes and 26 relationships.
- [ ] Run `npm start` and test Food, Housing, Work, and Wellbeing routes.
- [ ] Test category cards, the area dropdown, service-detail panel, menu, and light/dark theme.
- [ ] Confirm the unavailable-state message by temporarily stopping the database only if practical; do not change committed code.

## GitHub

- [ ] Confirm `.env` is not staged: `git status` must not show it.
- [ ] Push source code, `README.md`, `render.yaml`, and this checklist to GitHub.
- [ ] Add two UI screenshots to `docs/screenshots/` and embed them in the README.

## Hosted demo

- [ ] Create a new Render service from the GitHub repository, or use `render.yaml` as a Blueprint.
- [ ] Set `COGNODB_URI`, `COGNODB_USERNAME`, and `COGNODB_PASSWORD` as host environment variables.
- [ ] Open the deployed URL and test one referral route.

## Screen recording (60-90 seconds)

1. State the problem: local help is connected, but ordinary directories hide trusted referral paths.
2. Select Food support and explain the graph-powered referral route.
3. Filter available services by category and area, then open one service-detail panel.
4. Briefly show `src/queries.js` and point out the parameterised multi-hop Cypher traversal.
5. Mention CognoDB, the seed script, graceful error handling, and that credentials are environment-only.

## Email

- [ ] Send the GitHub URL, hosted demo URL, and recording URL to `hr@wexa.ai`.
- [ ] Subject: `CognoDB Assignment 2 - Your Name`.
