<template>
  <div id="app">
    <Dashboard />
  </div>
</template>

<script>
import Dashboard from '@/pages/Dashboard.vue'

export default {
  name: 'App',
  components: {
    Dashboard
  }
}
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

#app {
  width: 100vw;
  min-height: 100vh;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans SC', sans-serif;
  background: #0a0e27;
}

.navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 2000;
  background: rgba(10, 14, 39, 0.95);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(100, 181, 246, 0.1);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.nav-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.nav-logo {
  font-size: 1.3rem;
  font-weight: 700;
  background: linear-gradient(135deg, #64b5f6 0%, #42a5f5 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0;
}

.nav-links {
  display: flex;
  gap: 1rem;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1.2rem;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(100, 181, 246, 0.2);
  border-radius: 8px;
  color: #9ca3af;
  text-decoration: none;
  font-size: 0.95rem;
  transition: all 0.3s ease;
}

.nav-link:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(100, 181, 246, 0.4);
  color: #e5e7eb;
  transform: translateY(-2px);
}

.nav-link.active {
  background: rgba(100, 181, 246, 0.15);
  border-color: rgba(100, 181, 246, 0.5);
  color: #64b5f6;
}

.nav-link .icon {
  font-size: 1.2rem;
}

/* 原始样式 */
.header {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 30px;
  margin-bottom: 20px;
  padding: 10px;
}

.header-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.label {
  font-size: 18px;
  font-weight: bold;
}

.select-box {
  padding: 5px 10px;
  font-size: 16px;
  min-width: 200px;
  background: white;
}

.main-content {
  display: flex;
  gap: 20px;
  height: calc(100vh - 150px);
}

.left-column {
  display: flex;
  flex-direction: column;
  gap: 15px;
  flex: 0 0 400px;
}

.middle-column {
  display: flex;
  flex-direction: column;
  gap: 15px;
  flex: 1;
}

.right-column {
  display: flex;
  flex-direction: column;
  gap: 15px;
  flex: 0 0 480px;
}

.frame {
  border: 3px solid; /* 保留彩色边框，仅移除黑色边框 */
  background: white;
  padding: 15px;
  overflow: auto;
}

.pink-frame {
  border: none;
  background: transparent;
  padding: 0;
  flex: 2;
  overflow: visible; 
}

.green-frame {
  border-color: transparent;
}

.green-frame.large {
  flex: 2;
}

.green-frame.small {
  flex: 1;
}

.green-box2-container {
  border: none !important;
  padding: 0 !important;
  overflow: hidden;
}

.green-box2-content {
  padding: 0 !important;
  overflow: hidden;
}

.green-box2-content h3 {
  display: none;
}

.blue-frame {
  border: none;
  background: linear-gradient(135deg, #f9fafb 0%, #e5e7eb 100%);
  padding: 0;
  overflow: visible;
}

.blue-frame.medium {
  flex: 4;
}

.blue-frame.small {
  flex: 3;
}

.frame-content {
  width: 100%;
  height: 100%;
  overflow: visible; 
}

.frame-content h3 {
  margin-bottom: 15px;
  font-size: 18px;
  font-weight: 600;
  color: #2c3e50;
  text-align: center;
  padding-bottom: 10px;
  border-bottom: 2px solid rgba(65, 105, 225, 0.2);
}

.frame-content pre {
  font-size: 12px;
  white-space: pre-wrap;
  word-wrap: break-word;
}
</style>