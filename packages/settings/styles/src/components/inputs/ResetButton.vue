<template>
  <TinyButton class="reset-btn" @click="reset">{{ text }}</TinyButton>
  <span class="reset-desc">重置后将恢复到初始值。</span>
</template>

<script>
import { Button } from '@opentiny/vue'

export default {
  components: {
    TinyButton: Button
  },
  props: {
    text: {
      type: String,
      default: '重置'
    }
  },
  emits: ['reset'],
  setup(props, { emit }) {
    const reset = () => {
      emit('reset')
    }

    return {
      reset
    }
  }
}
</script>

<style lang="less" scoped>
.reset-btn.tiny-button {
  display: block;
  max-width: 100%;
  border: 0;
  color: var(--te-common-text-primary);
  border: 1px solid var(--te-common-border-active);
}
.reset-desc {
  display: block;
  padding: 8px 4px;
  text-align: center;
  color: var(--te-common-text-secondary);
}
</style>
