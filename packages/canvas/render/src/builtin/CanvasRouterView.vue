<template>
  <canvas-placeholder placeholder="路由子页面显示位置占位符"></canvas-placeholder>
</template>
<script>
import CanvasPlaceholder from './CanvasPlaceholder.vue'
export default {
  components: {
    CanvasPlaceholder
  },
  props: {
    name: {
      type: String
    },
    params: {
      type: Object
    }
  }
}
</script>
