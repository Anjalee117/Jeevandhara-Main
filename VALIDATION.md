# Build validation

Verified on October 8, 2026 against the production build.

- `npm run build`: passed; all application routes generated.
- `npm run typecheck`: passed.
- Dependency install/audit: zero known vulnerabilities after applying patched PostCSS override.
- `npm test`: 36 passed, 0 failed, across Chromium desktop and a 390 × 844 mobile viewport.

The automated suite covers landing entry, typed voice intent routing, saved farm/context changes, scheme search/filter/eligibility/explanations, crop image upload/preview/analysis/action creation, changing sensor simulation and alert acknowledgement, persisted action completion history, notification navigation/read state, Kannada label persistence, market comparison and recommendation, and all routes without runtime errors or horizontal overflow.

Dashboard screenshots were also inspected. The tests run real browser interactions against the production server. Mobile coverage emulates a mobile viewport in Chromium; it does not certify every physical device or browser.

Actual microphone recording and third-party browser transcription require manual testing with microphone permission in a supported browser. Intent classification and typed-question routing were tested. All agricultural intelligence remains clearly labeled demo data; no real crop diagnosis, scheme validation, weather feed or IoT hardware integration is claimed.

Full localization verification: all 14 dashboard routes checked in Hindi and Kannada on desktop and mobile. Dynamic result checks cover scheme eligibility, crop analysis, market recommendations, threat acknowledgement, action explanations and localized knowledge search. The farmer name, uploaded filenames, original question transcripts and hardware identifiers are preserved.
