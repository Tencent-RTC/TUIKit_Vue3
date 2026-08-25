/**
 * Heatmap data provider.
 *
 * Parses RUM CSV data (exported from Aegis/RUM platform) and maps ext1 values
 * to CSS selectors for rendering click heatmap badges on the page.
 *
 * Data source: ./rum-data.csv (loaded at runtime via fetch)
 * CSV format: "编号","Ext1","数量(占比)"
 * Example row: 1,"home | chat","40 (1.89%)"
 *
 * To update data: replace the rum-data.csv file with a new export from the RUM platform.
 */

export interface HeatmapDataItem {
  /** CSS selector to match the target element */
  selector: string;
  /** Aggregated click count */
  clicks: number;
  /** Event name from AEGIS_EVENTS */
  event: string;
  /** ext1 value for reference */
  ext1: string;
}

// ============================================================================
// ext1 → selector mapping registry
//
// Each entry maps a known ext1 pattern to its CSS selector and event type.
// Patterns may use exact match or prefix match (for ext1 values containing
// dynamic segments like URLs or userIDs).
// ============================================================================

interface SelectorMapping {
  selector: string;
  event: string;
}

/**
 * Exact ext1 → selector mapping.
 * Keys are exact ext1 values (trimmed, normalized spaces).
 */
const EXACT_EXT1_MAP: Record<string, SelectorMapping> = {
  // === scene_select: Home SceneCard ===
  'home | chat': { selector: '.scene-item:nth-child(1) .tav-card-item-renew', event: 'scene_select' },
  'home | chat | medical': { selector: '.scene-item:nth-child(1) .tav-card-item-renew__scenario-btn', event: 'scene_select' },
  'home | call': { selector: '.scene-item:nth-child(2) .tav-card-item-renew', event: 'scene_select' },
  'home | room': { selector: '.scene-item:nth-child(3) .tav-card-item-renew', event: 'scene_select' },

  // === scene_select: Detail Bar tab ===
  'detail | chat': { selector: '.tav-rtc-slider__content-item:nth-child(1)', event: 'scene_select' },
  'detail | call': { selector: '.tav-rtc-slider__content-item:nth-child(2)', event: 'scene_select' },
  'detail | room': { selector: '.tav-rtc-slider__content-item:nth-child(3)', event: 'scene_select' },

  // === industry_switcher_click: Chat sub-scene ===
  'detail | chat | general': { selector: '.industry-switcher__list .industry-switcher__item:nth-child(1)', event: 'industry_switcher_click' },
  'detail | chat | medical': { selector: '.industry-switcher__list .industry-switcher__item:nth-child(2)', event: 'industry_switcher_click' },

  // === qrcode_view: Home PlatformExperience ===
  'home | android': { selector: '.rtc-platform-experience__grid > :nth-child(1)', event: 'qrcode_view' },
  'home | ios': { selector: '.rtc-platform-experience__grid > :nth-child(2)', event: 'qrcode_view' },
  'home | miniprogram': { selector: '.rtc-platform-experience__grid > :nth-child(3)', event: 'qrcode_view' },

  // === qrcode_view: SideBar mobile cards ===
  'detail | chat | android': { selector: '.sidebar-mobile-cards .sidebar-mobile-card:nth-child(1)', event: 'qrcode_view' },
  'detail | chat | ios': { selector: '.sidebar-mobile-cards .sidebar-mobile-card:nth-child(2)', event: 'qrcode_view' },
  'detail | chat | miniprogram': { selector: '.sidebar-mobile-cards .sidebar-mobile-card:nth-child(3)', event: 'qrcode_view' },
  'detail | call | android': { selector: '.sidebar-mobile-cards .sidebar-mobile-card:nth-child(1)', event: 'qrcode_view' },
  'detail | call | ios': { selector: '.sidebar-mobile-cards .sidebar-mobile-card:nth-child(2)', event: 'qrcode_view' },
  'detail | room | android': { selector: '.sidebar-mobile-cards .sidebar-mobile-card:nth-child(1)', event: 'qrcode_view' },
  'detail | room | ios': { selector: '.sidebar-mobile-cards .sidebar-mobile-card:nth-child(2)', event: 'qrcode_view' },

  // === link_click: CapabilityRecommend experience buttons ===
  'detail | chat | experience | call': { selector: '.cards-container .capability-card:nth-child(1) .card-actions .tui-button-blue-primary', event: 'link_click' },
  'detail | chat | experience | room': { selector: '.cards-container .capability-card:nth-child(2) .card-actions .tui-button-blue-primary', event: 'link_click' },
  'detail | chat | experience | live': { selector: '.cards-container .capability-card:nth-child(3) .card-actions .tui-button-blue-primary', event: 'link_click' },

  // === medical_showroom_click ===
  'detail | chat | medical | showroom': { selector: '.medical-showroom-btn', event: 'medical_showroom_click' },

  // === medical_picker_click ===
  'image': { selector: '.medical-toolbar-actions > :nth-child(2) .medical-picker-icon', event: 'medical_picker_click' },
  'file': { selector: '.medical-toolbar-actions > :nth-child(3) .medical-picker-icon', event: 'medical_picker_click' },
  'audio_call': { selector: '.medical-toolbar-actions > :nth-child(4) .medical-picker-icon', event: 'medical_picker_click' },
  'video_call': { selector: '.medical-toolbar-actions > :nth-child(5) .medical-picker-icon', event: 'medical_picker_click' },
  'medical_record': { selector: '.medical-toolbar-actions .record-picker__trigger', event: 'medical_picker_click' },
  'prescription': { selector: '.medical-toolbar-actions .rx-picker__trigger', event: 'medical_picker_click' },
  'quick_reply': { selector: '.medical-toolbar-actions .quick-reply-picker__trigger', event: 'medical_picker_click' },
  'quick_rate': { selector: '.medical-toolbar-actions .quick-rate-picker__trigger', event: 'medical_picker_click' },
};

/**
 * Prefix-based ext1 → selector mapping.
 * Matched when ext1 starts with the given prefix.
 * Checked in order; first match wins.
 */
const PREFIX_EXT1_MAP: Array<{ prefix: string; mapping: SelectorMapping }> = [
  // === link_click: Home QuickAccess (home | {product} | {platform} | {url}) ===
  { prefix: 'home | chat | Web |', mapping: { selector: '.rtc-quick-access__grid > :nth-child(1) .rtc-quick-access__link:nth-child(1)', event: 'link_click' } },
  { prefix: 'home | chat | Android |', mapping: { selector: '.rtc-quick-access__grid > :nth-child(1) .rtc-quick-access__link:nth-child(2)', event: 'link_click' } },
  { prefix: 'home | chat | iOS |', mapping: { selector: '.rtc-quick-access__grid > :nth-child(1) .rtc-quick-access__link:nth-child(3)', event: 'link_click' } },
  { prefix: 'home | chat | quickAccess.miniProgram |', mapping: { selector: '.rtc-quick-access__grid > :nth-child(1) .rtc-quick-access__link:nth-child(4)', event: 'link_click' } },
  { prefix: 'home | chat | miniProgram |', mapping: { selector: '.rtc-quick-access__grid > :nth-child(1) .rtc-quick-access__link:nth-child(4)', event: 'link_click' } },
  { prefix: 'home | call | Web |', mapping: { selector: '.rtc-quick-access__grid > :nth-child(2) .rtc-quick-access__link:nth-child(1)', event: 'link_click' } },
  { prefix: 'home | call | Android |', mapping: { selector: '.rtc-quick-access__grid > :nth-child(2) .rtc-quick-access__link:nth-child(2)', event: 'link_click' } },
  { prefix: 'home | call | iOS |', mapping: { selector: '.rtc-quick-access__grid > :nth-child(2) .rtc-quick-access__link:nth-child(3)', event: 'link_click' } },
  { prefix: 'home | call | miniProgram |', mapping: { selector: '.rtc-quick-access__grid > :nth-child(2) .rtc-quick-access__link:nth-child(4)', event: 'link_click' } },
  { prefix: 'home | room | Web |', mapping: { selector: '.rtc-quick-access__grid > :nth-child(3) .rtc-quick-access__link:nth-child(1)', event: 'link_click' } },
  { prefix: 'home | room | Android |', mapping: { selector: '.rtc-quick-access__grid > :nth-child(3) .rtc-quick-access__link:nth-child(2)', event: 'link_click' } },
  { prefix: 'home | room | iOS |', mapping: { selector: '.rtc-quick-access__grid > :nth-child(3) .rtc-quick-access__link:nth-child(3)', event: 'link_click' } },
  { prefix: 'home | room | miniProgram |', mapping: { selector: '.rtc-quick-access__grid > :nth-child(3) .rtc-quick-access__link:nth-child(4)', event: 'link_click' } },
  { prefix: 'home | live | Web |', mapping: { selector: '.rtc-quick-access__grid > :nth-child(4) .rtc-quick-access__link:nth-child(1)', event: 'link_click' } },
  { prefix: 'home | live | Android |', mapping: { selector: '.rtc-quick-access__grid > :nth-child(4) .rtc-quick-access__link:nth-child(2)', event: 'link_click' } },
  { prefix: 'home | live | iOS |', mapping: { selector: '.rtc-quick-access__grid > :nth-child(4) .rtc-quick-access__link:nth-child(3)', event: 'link_click' } },

  // === link_click: SideBar doc links (sideBar | {scene} | doc | {url}) ===
  { prefix: 'sideBar | chat | doc |', mapping: { selector: '.sidebar-doc-list .sidebar-doc-item:nth-child(1)', event: 'link_click' } },
  { prefix: 'sideBar | call | doc |', mapping: { selector: '.sidebar-doc-list .sidebar-doc-item:nth-child(1)', event: 'link_click' } },
  { prefix: 'sideBar | room | doc |', mapping: { selector: '.sidebar-doc-list .sidebar-doc-item:nth-child(1)', event: 'link_click' } },

  // === link_click: SideBar console (sideBar | {scene} | console | {url}) ===
  { prefix: 'sideBar | chat | console |', mapping: { selector: '.sidebar-doc-list .sidebar-doc-item:nth-child(4)', event: 'link_click' } },
  { prefix: 'sideBar | call | console |', mapping: { selector: '.sidebar-doc-list .sidebar-doc-item:nth-child(4)', event: 'link_click' } },
  { prefix: 'sideBar | room | console |', mapping: { selector: '.sidebar-doc-list .sidebar-doc-item:nth-child(4)', event: 'link_click' } },

  // === link_click: SideBar capability platform (sideBar | {scene} | {cap} | {platform} | {url}) ===
  { prefix: 'sideBar | chat | call | web |', mapping: { selector: '.sidebar-capability-item:nth-child(1) .sidebar-capability-item__platform-btn:nth-child(1)', event: 'link_click' } },
  { prefix: 'sideBar | chat | call | android |', mapping: { selector: '.sidebar-capability-item:nth-child(1) .sidebar-capability-item__platform-btn:nth-child(2)', event: 'link_click' } },
  { prefix: 'sideBar | chat | call | ios |', mapping: { selector: '.sidebar-capability-item:nth-child(1) .sidebar-capability-item__platform-btn:nth-child(3)', event: 'link_click' } },
  { prefix: 'sideBar | chat | room | web |', mapping: { selector: '.sidebar-capability-item:nth-child(2) .sidebar-capability-item__platform-btn:nth-child(1)', event: 'link_click' } },
  { prefix: 'sideBar | chat | room | android |', mapping: { selector: '.sidebar-capability-item:nth-child(2) .sidebar-capability-item__platform-btn:nth-child(2)', event: 'link_click' } },
  { prefix: 'sideBar | chat | room | ios |', mapping: { selector: '.sidebar-capability-item:nth-child(2) .sidebar-capability-item__platform-btn:nth-child(3)', event: 'link_click' } },
  { prefix: 'sideBar | chat | live | web |', mapping: { selector: '.sidebar-capability-item:nth-child(3) .sidebar-capability-item__platform-btn:nth-child(1)', event: 'link_click' } },
  { prefix: 'sideBar | chat | live | android |', mapping: { selector: '.sidebar-capability-item:nth-child(3) .sidebar-capability-item__platform-btn:nth-child(2)', event: 'link_click' } },
  { prefix: 'sideBar | chat | live | ios |', mapping: { selector: '.sidebar-capability-item:nth-child(3) .sidebar-capability-item__platform-btn:nth-child(3)', event: 'link_click' } },

  // === link_click: CapabilityRecommend doc buttons (detail | chat | doc | {url}) ===
  { prefix: 'detail | chat | doc |', mapping: { selector: '.cards-container .capability-card:nth-child(1) .card-actions .tui-button-blue-default', event: 'link_click' } },

  // === link_click: SideBar external link / promo ===
  { prefix: 'sideBar | chat | external_link |', mapping: { selector: '.sidebar-promo', event: 'link_click' } },
  { prefix: 'sideBar | call | external_link |', mapping: { selector: '.sidebar-promo', event: 'link_click' } },
  { prefix: 'sideBar | room | external_link |', mapping: { selector: '.sidebar-promo', event: 'link_click' } },

  // === link_click: Detail capability platform click (detail | chat | {cap} | {platform} | {url}) ===
  { prefix: 'detail | chat | call | web |', mapping: { selector: '.sidebar-capability-item:nth-child(1) .sidebar-capability-item__platform-btn:nth-child(1)', event: 'link_click' } },
];

// ============================================================================
// CSV Parser
// ============================================================================

interface CsvRow {
  ext1: string;
  clicks: number;
}

/**
 * Parse RUM CSV data.
 * Format: "编号","Ext1","数量(占比)"
 * Example: 1,"home | chat","520 (24.60%)"
 */
function parseCsv(csv: string): CsvRow[] {
  const rows: CsvRow[] = [];
  const lines = csv.trim().split('\n');

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Parse CSV with quoted fields
    const match = line.match(/^\d+,"([^"]*)","\s*(\d+)\s*\(/);
    if (!match) continue;

    const ext1 = match[1].trim();
    const clicks = parseInt(match[2], 10);
    if (isNaN(clicks) || clicks === 0) continue;

    rows.push({ ext1, clicks });
  }

  return rows;
}

/**
 * Resolve ext1 value to a selector mapping.
 * Tries exact match first, then prefix match.
 */
function resolveMapping(ext1: string): SelectorMapping | null {
  // Exact match
  if (EXACT_EXT1_MAP[ext1]) {
    return EXACT_EXT1_MAP[ext1];
  }

  // Prefix match
  for (const { prefix, mapping } of PREFIX_EXT1_MAP) {
    if (ext1.startsWith(prefix)) {
      return mapping;
    }
  }

  return null;
}

/**
 * Convert CSV rows to heatmap data items.
 * Aggregates clicks for the same selector.
 */
function csvToHeatmapData(rows: CsvRow[]): HeatmapDataItem[] {
  const selectorMap = new Map<string, HeatmapDataItem>();

  for (const row of rows) {
    const mapping = resolveMapping(row.ext1);
    if (!mapping) continue;

    const existing = selectorMap.get(mapping.selector);
    if (existing) {
      // Aggregate clicks for the same selector
      existing.clicks += row.clicks;
      existing.ext1 += ` + ${row.ext1}`;
    } else {
      selectorMap.set(mapping.selector, {
        selector: mapping.selector,
        clicks: row.clicks,
        event: mapping.event,
        ext1: row.ext1,
      });
    }
  }

  return Array.from(selectorMap.values());
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Fetch heatmap data by loading the RUM CSV file and parsing it.
 * To update data: replace the rum-data.csv file with a new export from the RUM platform.
 * To switch to Aegis Open API: replace the fetch call below.
 */
export async function fetchHeatmapData(): Promise<HeatmapDataItem[]> {
  try {
    const csvUrl = new URL('./rum-data.csv', import.meta.url).href;
    const response = await fetch(csvUrl);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const rumCsvData = await response.text();
    const rows = parseCsv(rumCsvData);
    return csvToHeatmapData(rows);
  } catch (e) {
    console.warn('[HeatmapOverlay] Failed to load CSV data:', e);
    return [];
  }
}
