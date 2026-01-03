<template>
  <div class="chart-skeleton">
    <div class="skeleton-header">
      <div class="skeleton-line skeleton-title"></div>
      <div class="skeleton-line skeleton-subtitle"></div>
    </div>
    <div class="skeleton-body">
      <div class="skeleton-chart-area">
        <div class="skeleton-bar" v-for="i in 5" :key="i" :style="{ height: `${Math.random() * 60 + 40}%` }"></div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ChartSkeleton'
}
</script>

<style scoped>
.chart-skeleton {
  width: 100%;
  min-height: 400px;
  padding: 1.5rem;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}

.skeleton-header {
  margin-bottom: 2rem;
}

.skeleton-line {
  background: linear-gradient(
    90deg,
    rgba(100, 181, 246, 0.1) 0%,
    rgba(100, 181, 246, 0.2) 50%,
    rgba(100, 181, 246, 0.1) 100%
  );
  background-size: 200% 100%;
  animation: shimmer 2s infinite;
  border-radius: 8px;
}

@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

.skeleton-title {
  height: 32px;
  width: 40%;
  margin-bottom: 1rem;
}

.skeleton-subtitle {
  height: 20px;
  width: 60%;
}

.skeleton-body {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 300px;
}

.skeleton-chart-area {
  display: flex;
  align-items: flex-end;
  justify-content: space-around;
  width: 80%;
  height: 250px;
  gap: 1rem;
}

.skeleton-bar {
  flex: 1;
  background: linear-gradient(
    180deg,
    rgba(100, 181, 246, 0.2) 0%,
    rgba(100, 181, 246, 0.05) 100%
  );
  border-radius: 8px 8px 0 0;
  animation: bar-grow 1.5s ease-in-out infinite;
}

.skeleton-bar:nth-child(1) { animation-delay: 0s; }
.skeleton-bar:nth-child(2) { animation-delay: 0.1s; }
.skeleton-bar:nth-child(3) { animation-delay: 0.2s; }
.skeleton-bar:nth-child(4) { animation-delay: 0.3s; }
.skeleton-bar:nth-child(5) { animation-delay: 0.4s; }

@keyframes bar-grow {
  0%, 100% {
    transform: scaleY(1);
  }
  50% {
    transform: scaleY(0.8);
  }
}
</style>
