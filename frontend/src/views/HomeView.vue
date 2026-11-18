<script setup>
import { computed, onMounted, ref } from 'vue';
import Icon from '../components/ui/Icon.vue';
import Segmented from '../components/ui/Segmented.vue';
import { useCatalogStore } from '../stores/catalog.js';
import { useDisplayStore } from '../stores/display.js';
import { useLocaleStore } from '../stores/locale.js';
import { resolveFontStack, useTypographyStore } from '../stores/typography.js';
import { formatUploadedAt } from '../utils/format.js';

const catalog = useCatalogStore();
const display = useDisplayStore();
const typography = useTypographyStore();
const locale = useLocaleStore();
// Category names only appear once there's more than one category to
// choose between; with a single category every page is simply listed.
const tabs = computed(() => (catalog.categories.length >= 2 ? catalog.categories : []));
const tabOptions = computed(() => tabs.value.map((tab) => ({ value: tab.id, label: tab.name })));
const selectedTab = ref('');
// The first category is selected by default, and again if the selected
// one is deleted while this page stays open.
const activeTab = computed(() =>
  tabs.value.some((tab) => tab.id === selectedTab.value)
    ? selectedTab.value
    : tabs.value[0]?.id,
);
const visibleSites = computed(() =>
  tabs.value.length === 0
    ? catalog.sites
    : catalog.sites.filter((site) => site.categoryId === activeTab.value),
);
// Swapping category or layout replaces the whole panel, so its entrance
// (and each item's staggered rise) plays again.
const panelKey = computed(() => `${activeTab.value ?? 'all'}:${display.layout}`);

onMounted(() => {
  if (!catalog.loaded) {
    catalog.fetch();
  }
});

function siteHref(site) {
  return site.type === 'link' && !site.passwordProtected ? site.linkUrl : `/${site.pathId}/`;
}

// First character (not code unit) of the title, for the tile monogram.
function monogram(title) {
  return (Array.from(String(title).trim())[0] || '·').toUpperCase();
}

const introStyle = computed(() => ({
  '--h1-space-before': `${typography.h1SpaceBefore}px`,
}));
const h1Style = computed(() => ({
  fontFamily: resolveFontStack(typography.h1Font),
  fontSize: `${typography.h1Size}px`,
  marginBottom: `${typography.h1SpaceAfter}px`,
}));
const subtitleStyle = computed(() => ({
  fontFamily: resolveFontStack(typography.subtitleFont),
  fontSize: `${typography.subtitleSize}px`,
  marginTop: `${typography.subtitleSpaceBefore}px`,
  marginBottom: `${typography.subtitleSpaceAfter}px`,
}));

const listStyle = computed(() => ({
  '--row-pad-block': `${display.rowPadding}rem`,
  '--row-index-size': `${typography.rowIndexSize}px`,
  '--row-title-font': resolveFontStack(typography.listTitleFont),
  '--row-title-size': `${typography.listTitleSize}px`,
  '--row-desc-font': resolveFontStack(typography.listDescFont),
  '--row-desc-size': `${typography.listDescSize}px`,
}));
const gridStyle = computed(() => ({
  '--grid-cols': display.gridColumns,
  '--tile-height': `${display.tileHeight}px`,
  '--tile-title-font': resolveFontStack(typography.tileTitleFont),
  '--tile-title-size': `${typography.tileTitleSize}px`,
  '--tile-desc-font': resolveFontStack(typography.tileDescFont),
  '--tile-desc-size': `${typography.tileDescSize}px`,
}));
</script>

<template>
  <main class="container home">
    <template v-if="catalog.loaded">
      <!-- .hero's top padding is the visitor's "space before" setting, so a
           value of 0 can put the title right under the header as promised. -->
      <header class="hero enter-rise" :style="introStyle">
        <h1 class="hero-title" :style="h1Style">{{ catalog.settings.title }}</h1>
        <p v-if="catalog.settings.subtitle" class="hero-lede" :style="subtitleStyle">
          {{ catalog.settings.subtitle }}
        </p>
      </header>

      <div v-if="tabs.length > 0" class="catalog-tabs enter-rise" style="--i: 1">
        <Segmented
          :model-value="activeTab"
          :options="tabOptions"
          mode="tabs"
          id-prefix="catalog-tab"
          controls="catalog-panel"
          :aria-label="locale.t('catalog.tabsLabel')"
          @update:model-value="selectedTab = $event"
        />
      </div>

      <div
        id="catalog-panel"
        class="catalog-panel"
        v-bind="tabs.length > 0
          ? { role: 'tabpanel', 'aria-labelledby': `catalog-tab-${activeTab}`, tabindex: 0 }
          : {}"
      >
        <Transition name="swap" mode="out-in">
          <section v-if="visibleSites.length === 0" :key="`${panelKey}:empty`" class="empty-state">
            <span class="empty-state-icon"><Icon name="inbox" /></span>
            <p>{{ locale.t(catalog.sites.length === 0 ? 'catalog.empty' : 'catalog.emptyCategory') }}</p>
          </section>

          <ul
            v-else-if="display.layout === 'table'"
            :key="`${panelKey}:list`"
            class="site-list card"
            :style="listStyle"
            :aria-label="locale.t('catalog.listLabel')"
          >
            <li
              v-for="(site, index) in visibleSites"
              :key="site.pathId"
              class="enter-rise"
              :style="{ '--i': index + 2 }"
            >
              <a
                class="site-row"
                :href="siteHref(site)"
                target="_blank"
                rel="noopener noreferrer"
              >
                <span class="row-index">{{ String(index + 1).padStart(2, '0') }}</span>
                <span class="row-main">
                  <span class="row-title">
                    <span class="row-title-text">{{ site.title }}</span>
                    <Icon
                      v-if="site.passwordProtected"
                      class="title-icon"
                      name="lock"
                      :label="locale.t('catalog.protected')"
                    />
                    <Icon
                      v-if="site.type === 'link'"
                      class="title-icon"
                      name="arrow-up-right"
                      :label="locale.t('catalog.externalLink')"
                    />
                  </span>
                  <span class="row-desc">{{
                    site.description || locale.t('common.noDescription')
                  }}</span>
                  <span class="row-meta">
                    <span v-if="site.version" class="mono">{{
                      locale.t('common.versionTag', { version: site.version })
                    }}</span>
                    <span class="tabular">{{ formatUploadedAt(site.uploadedAt) }}</span>
                  </span>
                </span>
                <span class="row-path mono">/{{ site.pathId }}/</span>
                <span class="row-go" aria-hidden="true">
                  <Icon name="arrow-right" />
                </span>
                <span class="sr-only">{{ locale.t('catalog.open') }}</span>
              </a>
            </li>
          </ul>

          <ul
            v-else
            :key="`${panelKey}:grid`"
            class="tile-grid"
            :style="gridStyle"
            :aria-label="locale.t('catalog.listLabel')"
          >
            <li
              v-for="(site, index) in visibleSites"
              :key="site.pathId"
              class="enter-rise"
              :style="{ '--i': index + 2 }"
            >
              <a
                class="tile card card-interactive"
                :href="siteHref(site)"
                target="_blank"
                rel="noopener noreferrer"
              >
                <span class="tile-top">
                  <span class="tile-monogram" aria-hidden="true">{{ monogram(site.title) }}</span>
                  <span class="tile-flags">
                    <span v-if="site.passwordProtected" class="badge">
                      <Icon name="lock" />{{ locale.t('catalog.protected') }}
                    </span>
                    <span v-if="site.type === 'link'" class="badge badge-info">
                      <Icon name="arrow-up-right" />{{ locale.t('catalog.externalLink') }}
                    </span>
                  </span>
                </span>
                <span class="tile-title">{{ site.title }}</span>
                <span class="tile-desc">{{
                  site.description || locale.t('common.noDescription')
                }}</span>
                <span class="tile-foot">
                  <span class="tile-meta">
                    <span v-if="site.version" class="mono">{{
                      locale.t('common.versionTag', { version: site.version })
                    }}</span>
                    <span class="tabular">{{ formatUploadedAt(site.uploadedAt) }}</span>
                  </span>
                  <span class="tile-path">
                    <span class="mono">/{{ site.pathId }}/</span>
                    <span class="tile-go" aria-hidden="true"><Icon name="arrow-right" /></span>
                  </span>
                </span>
              </a>
            </li>
          </ul>
        </Transition>

        <p class="tally tabular">
          {{ locale.t('catalog.tally', { count: visibleSites.length }) }}
        </p>
      </div>
    </template>

    <div v-else class="home-loading" aria-busy="true">
      <span class="sr-only" role="status">{{ locale.t('common.loading') }}</span>
      <div class="hero" aria-hidden="true">
        <span class="skeleton skeleton-hero"></span>
        <span class="skeleton skeleton-line skeleton-lede"></span>
      </div>
      <div class="site-list card" aria-hidden="true">
        <div v-for="n in 4" :key="n" class="skeleton-row">
          <span class="skeleton skeleton-title"></span>
          <span class="skeleton skeleton-line"></span>
        </div>
      </div>
    </div>
  </main>
</template>

<style scoped>
.home {
  padding-bottom: var(--space-12);
}

/* ---------- Hero ---------- */

/* A flex column so the visitor's independent "space before/after" margins
   on adjacent title/subtitle add up instead of collapsing. */
.hero {
  display: flex;
  flex-direction: column;
  padding-block: var(--h1-space-before, var(--space-12)) var(--space-6);
}

.hero-title {
  margin: 0;
  max-width: var(--measure-wide);
  background: linear-gradient(
    180deg,
    var(--ink) 35%,
    color-mix(in srgb, var(--ink) 72%, var(--accent))
  );
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  font-weight: var(--weight-bold);
  letter-spacing: var(--tracking-tight);
  line-height: var(--leading-tight);
  overflow-wrap: anywhere;
}

.hero-lede {
  max-width: var(--measure);
  color: var(--ink-muted);
  line-height: var(--leading-normal);
  overflow-wrap: anywhere;
  white-space: pre-line;
}

/* ---------- Category tabs ---------- */

.catalog-tabs {
  display: flex;
  margin-bottom: var(--space-5);
}

.catalog-panel:focus-visible {
  border-radius: var(--radius-lg);
  outline-offset: var(--space-1);
}

/* ---------- List layout ---------- */

.site-list {
  margin: 0;
  padding: var(--space-1-5);
  list-style: none;
}

.site-list > li + li {
  border-top: var(--border-width) solid var(--border);
}

.site-row {
  display: grid;
  grid-template-columns: var(--space-8) minmax(0, 1fr) auto auto;
  align-items: center;
  gap: var(--space-4);
  border-radius: var(--radius-md);
  padding: var(--row-pad-block, var(--space-4)) var(--space-4);
  color: inherit;
  text-decoration: none;
  transition: background-color var(--dur-fast) var(--ease-standard);
}

.site-row:hover {
  background: var(--surface-muted);
}

.site-row:focus-visible {
  outline-offset: calc(var(--focus-width) * -1);
}

.row-index {
  align-self: start;
  padding-top: 0.15em;
  color: var(--ink-faint);
  font-size: var(--row-index-size, var(--text-sm));
  font-variant-numeric: tabular-nums lining-nums;
  transition: color var(--dur-fast) var(--ease-standard);
}

.site-row:hover .row-index {
  color: var(--accent);
}

.row-main {
  display: grid;
  gap: var(--space-1);
  min-width: 0;
}

.row-title {
  display: flex;
  align-items: center;
  gap: var(--space-1-5);
  min-width: 0;
  font-family: var(--row-title-font, var(--font-sans));
  font-size: var(--row-title-size, var(--text-md));
  font-weight: var(--weight-semibold);
  line-height: var(--leading-snug);
}

.row-title-text {
  overflow-wrap: anywhere;
}

.title-icon {
  width: 0.8em;
  height: 0.8em;
  color: var(--ink-faint);
}

.row-desc {
  color: var(--ink-muted);
  font-family: var(--row-desc-font, var(--font-sans));
  font-size: var(--row-desc-size, var(--text-sm));
  line-height: var(--leading-normal);
  overflow-wrap: anywhere;
  white-space: pre-line;
}

.row-meta {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
  color: var(--ink-faint);
  font-size: var(--text-xs);
}

.row-path {
  border-radius: var(--radius-xs);
  background: var(--surface-muted);
  padding: var(--space-0-5) var(--space-2);
  color: var(--ink-faint);
  font-size: var(--text-xs);
  white-space: nowrap;
  transition: background-color var(--dur-fast) var(--ease-standard);
}

.site-row:hover .row-path {
  background: var(--surface);
}

.row-go {
  display: grid;
  place-items: center;
  width: var(--control-sm);
  height: var(--control-sm);
  border-radius: 50%;
  color: var(--ink-faint);
  transition: background-color var(--dur-fast) var(--ease-standard),
    color var(--dur-fast) var(--ease-standard),
    transform var(--dur-base) var(--ease-out);
}

.row-go svg {
  width: var(--icon-sm);
  height: var(--icon-sm);
}

.site-row:hover .row-go {
  background: var(--accent);
  color: var(--accent-ink);
  transform: translateX(var(--nudge));
}

/* ---------- Grid layout ---------- */

.tile-grid {
  display: grid;
  grid-template-columns: repeat(var(--grid-cols, 3), minmax(0, 1fr));
  gap: var(--space-4);
  margin: 0;
  padding: 0;
  list-style: none;
}

.tile {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  height: var(--tile-height);
  overflow: hidden;
  padding: var(--space-5);
  color: inherit;
  text-decoration: none;
}

.tile:focus-visible {
  outline-offset: var(--space-0-5);
}

.tile-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-2);
}

.tile-monogram {
  display: grid;
  flex: none;
  place-items: center;
  width: var(--space-10);
  height: var(--space-10);
  border-radius: var(--radius-md);
  background: var(--accent-soft);
  color: var(--accent);
  font-size: var(--text-lg);
  font-weight: var(--weight-bold);
  transition: transform var(--dur-base) var(--ease-spring);
}

.tile:hover .tile-monogram {
  transform: scale(1.06) rotate(-3deg);
}

.tile-flags {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: var(--space-1);
}

.tile-title {
  margin-top: var(--space-1);
  font-family: var(--tile-title-font, var(--font-sans));
  font-size: var(--tile-title-size, var(--text-md));
  font-weight: var(--weight-semibold);
  line-height: var(--leading-snug);
  overflow-wrap: anywhere;
}

/* The description takes whatever height the visitor's tile size leaves
   and fades out at the bottom instead of a fixed line clamp. */
.tile-desc {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  color: var(--ink-muted);
  font-family: var(--tile-desc-font, var(--font-sans));
  font-size: var(--tile-desc-size, var(--text-sm));
  line-height: var(--leading-normal);
  overflow-wrap: anywhere;
  white-space: pre-line;
  -webkit-mask-image: linear-gradient(180deg, #000 calc(100% - 2.5em), transparent);
  mask-image: linear-gradient(180deg, #000 calc(100% - 2.5em), transparent);
}

.tile-foot {
  display: grid;
  gap: var(--space-1-5);
  border-top: var(--border-width) solid var(--border);
  padding-top: var(--space-3);
}

.tile-meta {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
  color: var(--ink-faint);
  font-size: var(--text-xs);
}

.tile-path {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
  color: var(--ink-faint);
  font-size: var(--text-xs);
}

.tile-path .mono {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tile-go {
  color: var(--ink-faint);
  transition: color var(--dur-fast) var(--ease-standard),
    transform var(--dur-base) var(--ease-out);
}

.tile-go svg {
  width: var(--icon-sm);
  height: var(--icon-sm);
}

.tile:hover .tile-go {
  color: var(--accent);
  transform: translateX(var(--nudge));
}

/* ---------- Tally & loading ---------- */

.tally {
  margin: var(--space-6) 0 0;
  color: var(--ink-faint);
  font-size: var(--text-xs);
  font-weight: var(--weight-medium);
  letter-spacing: var(--tracking-wide);
  text-align: center;
}

.skeleton-hero {
  width: min(60%, 22rem);
  height: var(--space-10);
  border-radius: var(--radius-md);
}

.skeleton-lede {
  width: min(80%, 28rem);
  margin-top: var(--space-4);
}

.skeleton-row {
  display: grid;
  gap: var(--space-2);
  padding: var(--space-5) var(--space-4);
}

.skeleton-row + .skeleton-row {
  border-top: var(--border-width) solid var(--border);
}

.skeleton-row .skeleton-line {
  width: 75%;
}

/* ---------- Responsive ---------- */

@media (max-width: 860px) {
  .tile-grid {
    grid-template-columns: repeat(min(var(--grid-cols, 3), 2), minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .site-row {
    grid-template-columns: var(--space-6) minmax(0, 1fr) auto;
    gap: var(--space-3);
    padding-inline: var(--space-3);
  }

  .row-path {
    display: none;
  }
}

@media (max-width: 560px) {
  .tile-grid {
    grid-template-columns: minmax(0, 1fr);
  }

  /* One column on a phone: let the tile hug its content (never taller
     than the visitor's chosen height) rather than leave a tall gap. */
  .tile {
    height: auto;
    min-height: min(var(--tile-height), 13rem);
    max-height: var(--tile-height);
  }

  /* The tile hugs its text here, so the fade would only dim the last
     line — clamp instead. */
  .tile-desc {
    display: -webkit-box;
    flex: none;
    -webkit-mask-image: none;
    mask-image: none;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 6;
  }
}
</style>
