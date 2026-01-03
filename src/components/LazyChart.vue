<template>
  <div class="lazy-chart">
    <component 
      :is="component" 
      v-bind="props"
      v-on="listeners"
    />
  </div>
</template>

<script>
export default {
  name: 'LazyChart',
  props: {
    component: {
      type: Object,
      required: true
    },
    props: {
      type: Object,
      default: () => ({})
    },
    chartName: {
      type: String,
      default: '图表'
    }
  },
  emits: ['month-change'],
  setup(props, { emit }) {
    // 转发事件
    const listeners = {
      'month-change': (month) => emit('month-change', month)
    }

    return {
      listeners
    }
  }
}
</script>

<style scoped>
.lazy-chart {
  width: 100%;
  height: 100%;
  min-height: 400px;
}

.chart-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  color: #9ca3af;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(100, 181, 246, 0.2);
  border-top-color: #64b5f6;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.chart-loading p {
  font-size: 0.9rem;
}

.fade-in-enter-active, .fade-in-leave-active {
  transition: opacity 0.3s ease;
}

.fade-in-enter-from, .fade-in-leave-to {
  opacity: 0;
}
</style>
