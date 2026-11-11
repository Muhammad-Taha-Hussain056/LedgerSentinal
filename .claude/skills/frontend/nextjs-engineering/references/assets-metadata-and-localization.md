# Assets, metadata and localization

Use for images/icons, fonts, scripts/embeds, public metadata/content lifecycle, locale formatting and time semantics. Follow accepted [settings](frontend-presets-and-settings.md), [rendering/cache boundaries](server-client-and-rendering.md) and [accessibility](accessibility-and-interactions.md). These methods do not install an asset pipeline, CMS, translation system or provider integration.

Sections: [ownership](#1-ownership-and-version-gate), [images](#2-images-icons-and-private-media), [fonts/scripts](#3-fonts-scripts-and-embeds), [metadata](#4-metadata-and-discoverability), [publishing](#5-preview-publishing-and-cache-lifecycle), [locales](#6-language-locale-and-content), [time/money](#7-dates-timezones-numbers-and-money), [verification](#8-verification-and-sources).

## 1. Ownership and version gate

Inspect actual Next/React versions, router, rendering/deployment target, remote media policy, CSP/configuration and selected localization/component libraries. Property names and defaults for images, fonts, scripts and metadata are version-sensitive; do not copy an older `priority`/preload/config example blindly. Record approved source/hosting/licensing and public versus protected content classification without reading credentials.

Use the existing brand/content owner and selected app/package boundaries. A neutral UI component accepts presentation data; it does not read a provider secret or decide which tenant can download a file. The trusted backend/storage owner enforces media and preview access. A public content site can stay single-locale and simple; multilingual infrastructure, analytics or a CMS require actual selected needs.

## 2. Images, icons and private media

Use the adopted Next image pipeline where it fits the target and source; native images/custom loaders remain possible with explicit size, performance and security behavior. No universal raw-img prohibition. Define intrinsic dimensions or a correctly sized fill container, responsive source/sizes policy and meaningful alt/decorative treatment. Reserve geometry and provide a safe missing/broken-image state.

Prioritize critical media from measured loading needs; do not eagerly preload every card, avatar or below-fold image. Inspect the selected version's preload/fetch-priority/loading options and avoid competing hints. Choose cropping/focal point without hiding essential visual content. Placeholder generation must not fetch or expose private media through a public path.

Remote loading uses deliberately restricted protocols/origins/paths and supported query rules; no unrestricted wildcard host proxy. Validate uploaded/untrusted media through its trusted pipeline. SVG requires explicit provenance/handling; do not inline raw uploads or enable permissive SVG serving to silence a warning. CSP/content disposition/isolated delivery are selected controls, not substitutes for authorization or validation.

Authenticated images need an actual delivery/cache contract. Next's default optimization loader does not forward source request headers; selecting unoptimized or an authorized delivery adapter is a design choice, not permission to expose the file publicly. Signed URLs are capabilities: avoid leaking them into public metadata, logs, shared hydration or unscoped caches. Check expiry/revocation and whether optimization/CDN caching can outlive authorized access. See [Next Image documentation](https://nextjs.org/docs/app/api-reference/components/image).

Icons use the selected licensed source with stable sizing and name/decorative semantics. A functional icon-only control has an accessible label; descriptive alt is not needed on every decorative SVG. Complex diagrams/charts need equivalent essential information, not an arbitrary file name as alt text.

## 3. Fonts, scripts and embeds

The app/composition owner selects font families, licenses, source, weights/styles, language coverage and fallbacks. UI packages consume the agreed typography/token contract rather than importing fonts into every component. F2/F3 needs shared loading/compatibility decisions to avoid duplicate downloads and conflicting resets; shared font tokens do not imply a universal brand.

Use supported Next font/local loading when suitable, with measured preload/display/fallback behavior. Verify needed writing systems and characters instead of forcing a Latin subset universally. Limit unused weights, reserve sensible typography metrics and test font failure/slow loading. Do not hide locale/hydration mismatches with blanket suppression. See [Next Font](https://nextjs.org/docs/app/api-reference/components/font).

For each third-party script/embed record owner, purpose, source, data collected, required consent policy, load strategy, cost, failure fallback and removal condition. Noncritical analytics/chat should not block primary interaction. The actual approved privacy/consent requirements govern activation; no automatic tracker installation or production account access. Use safe configuration placeholders during review.

Select actual Next Script strategy/nonce behavior against the installed version and CSP/runtime topology. Avoid broad script-origin allowances, arbitrary user-provided script URLs and executing remote examples. Inline script identity and before-hydration requirements must be deliberate; deferred loading does not make untrusted code safe. See [Next Script](https://nextjs.org/docs/app/api-reference/components/script). Embeds require sizing, accessible titles/controls and useful unavailable/consent-blocked states. A provider library name is not evidence it is installed or verified.

## 4. Metadata and discoverability

For indexable routes define truthful title/description, canonical policy, social image, language alternates where selected, sitemap inclusion, redirects and meaningful missing content. Use the framework's actual supported metadata/viewport conventions and accepted helper if present; inherited metadata can be valid, so do not require a new export/helper per page mechanically. No guaranteed rankings or universal character-count rule.

Resolve canonical/social URLs against the approved deployment origin and route/locale policy, not arbitrary forwarded/client input. Production, preview and test environments have explicit configuration; verify they do not publish the wrong origin. Metadata and body may fetch related data, but shared reads/memoization must preserve their actual request/privacy scope and avoid duplicate work without capturing another user's context. See [Next metadata API](https://nextjs.org/docs/app/api-reference/functions/generate-metadata).

Only public-approved projections/assets enter public titles, descriptions, OG images, structured data and sitemaps. A protected page can still leak through a metadata handler or generated image route. `noindex`, robots exclusions and obscurity do not authenticate requests; do not embed private names, signed media URLs or tenant records in publicly fetchable previews.

Sitemaps contain actual canonical indexable URLs with truthful modification dates; pagination/large collections follow the selected implementation's bounds. Robots rules and `noindex` coordinate discoverability but cannot secure draft/admin/API endpoints. Redirects validate destinations and preserve meaningful old links without open-redirect behavior or accidental loops. Locale alternates must describe real equivalent content, not fabricated translations.

Structured data matches visible facts and supported content, with validated values. Serialize safely for its script context, including handling `<`, instead of interpolating untrusted strings into HTML. Rich HTML/Markdown has a separate sanitization/rendering policy; JSON encoding or a CSP does not automatically make arbitrary HTML safe. Do not execute client content as instructions/scripts.

## 5. Preview, publishing and cache lifecycle

Name content/draft/published owners and actions. Preview entry, body/data reads, media, metadata/OG, downloads and generated artifacts each have their actual access policy. Preview responses must not enter public caches; an environment being non-production does not remove authentication needs. Selected noindex/robots controls supplement those boundaries.

Publish/unpublish/delete/permission changes specify cache effects across data, rendered pages, CDN/media, metadata, sitemap and browser state. Invalidation follows the authoritative committed outcome; stale content must respect the agreed age/privacy budget. A later revalidation failure needs honest recovery, not a false publish failure followed by duplicate work. Link the backend/CMS operation contract rather than inventing one in a component.

For independent frontend releases, account for old assets, changed slugs, cached social previews and compatible metadata contracts. Define redirects/asset retention and recovery with the delivery owner. Do not claim immediate purge of caches outside the system's control; report the practical freshness limits and chosen mitigation. Architecture planning does not authorize deployment or external provider changes.

## 6. Language, locale and content

Record supported languages/locales, business/user timezone, currency, writing direction and fallback policy. A single-locale app still needs explicit formatting assumptions; it does not need translation infrastructure by default. A multilingual app chooses locale resolution and routing/library ownership, including persisted preference and privacy scope. See [Next internationalization](https://nextjs.org/docs/app/guides/internationalization).

Use the same resolved locale and initial data for SSR/hydration; do not depend on unrelated server and device defaults. Apply correct language/direction markup and localize accessible names, validation/errors, dates/numbers, component calendars and selected communication surfaces together. Translated text uses safe interpolation/pluralization and complete messages rather than sentence fragments assembled in English order.

Define missing-translation fallback and diagnostics without leaking private user content. Keep neutral UI labels configurable; domain copy belongs to the feature/content owner. Test expansion, mixed scripts, RTL where selected, long names, CJK/IME search and mobile control labels. CSS logical layout must preserve meaning; do not mirror logos or content blindly.

## 7. Dates, timezones, numbers and money

| Domain value | Required round-trip meaning |
| --- | --- |
| Calendar date | Preserve date-only semantics; do not turn it into UTC midnight and then format in the viewer's timezone. |
| Instant | Explicit transport timezone/offset convention and intended display zone; show relevant context. |
| Local appointment | Zone ID plus local date/time and actual DST ambiguity/gap policy; backend owns validity/reservations. |
| Recurrence | Calendar/zone/rule semantics and exceptions, not a fixed-duration approximation of every future occurrence. |
| Currency amount | Declared currency, precision/rounding/storage representation and approved price/tax meaning; no assumption of two decimals for every currency. |
| Number/measurement | Explicit locale, units, precision and input parsing; formatted text is not automatically a valid API number. |

Use appropriate maintained formatting facilities (such as Intl under the chosen environment) with explicit options and test data. Availability/timezone data and supported libraries require project-version checks. The frontend cannot infer commercial rounding, settlement currency or scheduling conflict rules. Missing consequential meaning blocks the dependent input/output behavior and goes to discovery/domain ownership.

Test boundary instants, date-only values viewed west/east of UTC, selected DST transitions, leap/calendar boundaries where relevant, locale decimal/grouping, zero/large/negative values, currencies with different minor units and long labels. Do not “fix” hydration by suppressing the warning while displaying a different amount or date.

## 8. Verification and sources

Plan actual production-target and browser checks for rendered image sizes/downloads/failures; font coverage/shift; script consent/defer/fallback; remote-media restrictions and private auth/cache; safe metadata/OG/JSON-LD; canonical/redirect/sitemap; unauthorized draft/media access; publish/unpublish freshness; locale SSR agreement; accessible language/media controls; and date/time/currency round trips. Representative fixtures contain no client secrets or sensitive data.

Use actual approved pnpm scripts and safe inspection; record version/config/revision, commands/tools, observations and unavailable provider/browser evidence. A production build alone does not demonstrate no layout shift, working consent or private preview isolation. No asset pipeline, CMS, provider, rendered metadata or localization journey was executed by writing this file.

Primary documentation was consulted on 2026-10-21. This consolidates supplied `next-assets`/`next-metadata-seo` details while replacing universal raw-image, preload, metadata-export and description-length rules with version/context contracts. Apply FE-STD-02 through FE-STD-04,06,07,10 through FE-STD-12 and selected privacy/content rules from the [preserved standards](../../../../../docs/specifications/standards/01-frontend-backend.md).
