<script setup lang="ts">
import { Star } from 'lucide-vue-next';
import { Rate as TRate } from 'tdesign-vue-next';

const props = defineProps<{
  rate: number;
}>();

</script>

<template>
  <div class="rate-card">
    <div class="rate-card__header">
      <div class="rate-card__header-left">
        <Star :size="16" />
        <span>本次咨询评价</span>
      </div>
    </div>
    <div class="rate-card__body">
      <TRate
        :value="props.rate"
        disabled
      />
    </div>
  </div>
</template>

<style scoped>
.rate-card {
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid rgba(10, 191, 119, 0.15);
  background: #fff;
}

.rate-card__header {
  padding: 10px 14px;
  background: rgba(10, 191, 119, 0.08);
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #0ABF77;
  font-size: 14px;
  font-weight: 500;
}

.rate-card__header-left {
  display: flex;
  align-items: center;
  gap: 6px;
}

.rate-card__body {
  padding: 20px 50px;
  display: flex;
  justify-content: center;
}
</style>
