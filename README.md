# YDCL AEO Fabric Library — Fabric Division Update

## Start
Extract the ZIP, then open index.html in Chrome or Edge. JavaScript is embedded, so the HTML works without a separate app.js. app.js is supplied as a readable source copy; when modifying code, keep the embedded copy in index.html in sync.

## Enter records
1. Add fabric: choose Men’s or Women’s, then enter fabric name, content and USD/yd price.
2. Link style: enter style number and select a fabric. Division, content and price are automatically inherited.
3. Multiple styles can use the same fabric. No independent division selection is permitted on a style link.
4. Editing a fabric’s division updates its linked styles. Duplicate fabric names are prevented within the same division. The same name can exist separately in Men’s and Women’s.
5. Filter the fabric master by division, including fabrics with no linked styles.

## Existing records and backups
Export a JSON backup before updating. The existing browser storage key is retained. Version 1 browser records and backups are automatically migrated to version 2. Division is inferred from existing style links. If a fabric previously served both divisions, it is split into two division-specific records preserving all links. Fabrics with no style links show Unassigned; edit each and choose its correct division before linking styles. Version 2 backups cannot be restored in the old application.

Data remains in the current browser/site only, with no team synchronization. Export JSON backups regularly. CSV is an Excel-readable reference export, not a restorable backup. Restoring JSON replaces current records after confirmation. Do not upload real price data or backups to a public GitHub repository.

## GitHub Pages
Upload index.html, app.js, README.md and .nojekyll to your repository root, replacing the old versions. In Settings > Pages, use Deploy from a branch, main, /(root). No build command, dependencies or environment variables are required. After deployment, refresh the website. Export existing records first and restore the JSON backup if you change browser/site address.

This ZIP has not been pushed to GitHub or deployed.

## Validation
Chrome UI verified: legacy data loading, required fabric division, saving Women’s fabric, inherited style division/content/price, and persistence after reload. Automated checks covered mixed-division legacy migration, unassigned fabrics and mismatched style division rejection. JavaScript syntax passed. Edge was not separately tested.

## Sorting
Each data column has a small sort button in its header. Click once for ascending order and again for descending. The active column shows an up or down arrow. Fabric master supports Division, Fabric name, Fabric content, Price and Linked styles; Style lookup supports Division, Style number, Fabric name, Fabric content and Price. Actions is not sortable. The standalone sorting dropdown has been replaced. Sorting applies to visible filtered rows and does not alter records. Prices sort numerically and style numbers sort naturally.
