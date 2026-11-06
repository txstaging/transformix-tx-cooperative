# TX Cooperative Platform | منصة التعاونيات الذكية من Transformix

Standalone Next.js App Router project restored from `TX_Cooperative_Landing_Page_AR.html`.

```powershell
npm install
npm run dev
```

Production: `npm run build`, then `npm start`. Type check: `npm run typecheck`.

The homepage retains the original content, section order, imagery, CSS colors, typography, layout, and interactive content. Navbar destinations are real Next.js pages that reuse the same original sections. Click the original logo/brand to return home.

## Source

- `lib/original-document.json`: the original document structure and text, plus the route/section mapping.
- `lib/original-model.js`: the original tab, feature, FAQ and dropdown content/state.
- `components/original-site.tsx`: renders the source structure as React elements, handles interactions and Next.js links.
- `app/globals.css`: original CSS with locally hosted original fonts and a mobile navigation control.
- `public/images/`: original extracted image files, unchanged.
- `public/fonts/`: original font families and weights, with their font licenses.

The page is rendered by Next.js/React, including server-rendered initial content. It does not embed the old HTML in an iframe or execute the original custom browser renderer.

Forms preserve their original layouts and fields. They prepare/download or copy an enquiry draft locally; they are not connected to email, CRM, payments, account, or product backend services.

Each folder contains all its own source, dependencies and assets and can be moved or deployed independently.

The supplied Cooperative HTML omitted four referenced images. Recreated illustrations are provided in `public/assets/hero.webp`, `governance.webp`, `member.webp`, and `ai.webp`, using the original Cairo font and navy/teal palette. Editable SVG sources are alongside them. These are illustrative recreations, not the missing original image files; the original image positions and surrounding text are preserved.

## Verification

Verified on 2026-11-06: production build passed; Chrome checks passed for 8 pages, navigation, mobile menus, original tabs/dropdowns/FAQs, and valid enquiry preparation. Original homepage text and heading order matched the reference. Font families, weights, sizes, colors, and element geometry matched at a 1440px viewport (layout tolerance: 1px). No broken images or browser errors were found.

The comparison renders the supplied HTML with the recreated assets available; the missing original bitmap images cannot be verified against their replacements.
