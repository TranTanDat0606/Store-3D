import { useEffect } from 'react'

/**
 * Per-page `<title>` (Plan 4 T3).
 *
 * Format: `<Page title> | Store 3D` — brand suffix casing taken verbatim from
 * the static default in `client/index.html` (`Store 3D - Mô hình in 3D`);
 * the static title stays as-is for the initial HTML load.
 *
 * No unmount restore on purpose: in this SPA every route renders a page that
 * sets its own title, so restoring the pre-mount value would only reintroduce
 * stale titles (the old page's title) during route transitions.
 */
export function useDocumentTitle(title: string): void {
  useEffect(() => {
    document.title = title ? `${title} | Store 3D` : 'Store 3D - Mô hình in 3D'
  }, [title])
}
