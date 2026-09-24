<script setup>
import { useLocaleStore } from '../../stores/locale.js';

defineProps({ canKeepPassword: Boolean });
const enabled = defineModel('enabled', { type: Boolean, default: false });
const password = defineModel('password', { type: String, default: '' });
const locale = useLocaleStore();
</script>

<template>
  <fieldset class="fieldset-plain field-wide password-fields">
    <legend>{{ locale.t('form.protectionLegend') }}</legend>
    <label class="radio-option">
      <input v-model="enabled" type="checkbox" />
      {{ locale.t('form.passwordProtected') }}
    </label>
    <label v-if="enabled" class="password-label">
      {{ locale.t('form.sitePassword') }}
      <input
        v-model="password"
        type="password"
        autocomplete="new-password"
        minlength="6"
        :required="!canKeepPassword"
        :placeholder="locale.t(canKeepPassword ? 'form.keepPassword' : 'form.passwordHint')"
        aria-describedby="site-password-hint"
      />
      <span id="site-password-hint" class="field-hint">
        {{ locale.t(canKeepPassword ? 'form.keepPassword' : 'form.passwordHint') }}
      </span>
    </label>
  </fieldset>
</template>

<style scoped>
.password-fields { display: grid; gap: 0.6rem; }
.password-label { display: block; }
</style>
