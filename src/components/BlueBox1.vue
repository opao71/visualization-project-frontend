<template>
  <div class="blue-box-1">
    <!-- 顶部筛选区域 -->
    <div class="filter-section">
      <div class="filter-controls">
        <label class="filter-label">月份:</label>
        <select v-model="selectedMonth" class="month-select">
          <option value="">全部月份</option>
          <option v-for="month in availableMonths" :key="month" :value="month">
            {{ formatMonth(month) }}
          </option>
        </select>
        <button @click="handleFilter" class="filter-btn">筛选</button>
        <button @click="handleReset" class="reset-btn">重置</button>
      </div>
    </div>

    <!-- Tab切换区域 -->
    <div class="tab-section">
      <div 
        v-for="(tab, index) in tabs" 
        :key="tab.key"
        :class="['tab-item', { active: currentTab === tab.key }]"
        @click="switchTab(tab.key)"
      >
        {{ tab.label }}
      </div>
    </div>

    <!-- 图表内容区域（左右平滑切换） -->
    <div class="chart-container-wrapper">
      <!-- 加载状态 -->
      <div v-if="loading" class="loading-state">
        <div class="loading-spinner"></div>
        <p>数据加载中...</p>
      </div>
      
      <!-- 错误状态 -->
      <div v-else-if="error" class="error-state">
        <p class="error-message">{{ error }}</p>
        <button @click="loadData" class="retry-btn">重试</button>
      </div>
      
      <!-- 空数据状态 -->
      <div v-else-if="!className && !studentId" class="empty-state">
        <p>请先选择班级或学生</p>
      </div>
      
      <!-- 图表内容 -->
      <div 
        v-else
        class="chart-slider"
        :style="{ transform: `translateX(-${currentTabIndex * 100}%)` }"
      >
        <!-- Tab 1: 基础特征 - 雷达图 -->
        <div class="chart-panel">
          <div ref="basicFeaturesChart" class="chart-content"></div>
        </div>

        <!-- Tab 2: 学习模式 - 柱状图 -->
        <div class="chart-panel">
          <div ref="patternChart" class="chart-content"></div>
        </div>

        <!-- Tab 3: 编程方法 - 饼图 -->
        <div class="chart-panel">
          <div ref="methodChart" class="chart-content"></div>
        </div>

        <!-- Tab 4: 知识点 - 树状图/柱状图 -->
        <div class="chart-panel">
          <div ref="knowledgeChart" class="chart-content"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import * as echarts from 'echarts'
import axios from 'axios'

const API_BASE_URL = 'http://localhost:5000/api'

export default {
  name: 'BlueBox1',
  props: {
    className: {
      type: String,
      default: ''
    },
    studentId: {
      type: String,
      default: ''
    }
  },
  emits: ['month-change'],
  data() {
    return {
      selectedMonth: '',
      availableMonths: [],
      currentTab: 'basic_features',
      tabs: [
        { key: 'basic_features', label: '基础特征' },
        { key: 'pattern', label: '学习模式' },
        { key: 'method', label: '编程方法' },
        { key: 'knowledge', label: '知识点' }
      ],
      chartInstances: {},
      chartData: {
        basicFeatures: null,
        pattern: null,
        method: null,
        knowledge: null
      },
      loading: false,
      error: null
    }
  },
  computed: {
    currentTabIndex() {
      return this.tabs.findIndex(tab => tab.key === this.currentTab)
    }
  },
  watch: {
    className() {
      this.loadAvailableMonths()
      this.loadData()
    },
    studentId() {
      this.loadAvailableMonths()
      this.loadData()
    }
  },
  mounted() {
    this.loadAvailableMonths()
    this.loadData()
    window.addEventListener('resize', this.handleResize)
  },
  beforeUnmount() {
    Object.values(this.chartInstances).forEach(chart => {
      if (chart) chart.dispose()
    })
    window.removeEventListener('resize', this.handleResize)
  },
  methods: {
    formatMonth(month) {
      if (!month) return ''
      const [year, m] = month.split('-')
      return `${year}年${parseInt(m)}月`
    },
    async loadAvailableMonths() {
      try {
        const params = {}
        if (this.studentId) params.student_id = this.studentId
        else if (this.className) params.class_name = this.className
        
        const response = await axios.get(`${API_BASE_URL}/learning-profile/available-months`, { params })
        this.availableMonths = response.data.months || []
      } catch (error) {
        console.error('加载可用月份失败:', error)
      }
    },
    async loadData() {
      if (!this.className && !this.studentId) {
        this.error = null
        return
      }
      
      this.loading = true
      this.error = null
      
      try {
        const params = {}
        if (this.studentId) params.student_id = this.studentId
        else if (this.className) params.class_name = this.className
        if (this.selectedMonth) params.month = this.selectedMonth

        // 一次性获取所有Tab的数据
        const response = await axios.get(`${API_BASE_URL}/learning-profile/comprehensive-bluebox1`, { params })
        const data = response.data

        this.chartData.basicFeatures = data.tab1_basic_features
        this.chartData.pattern = data.tab2_pattern_distribution
        this.chartData.method = data.tab3_method_preference
        this.chartData.knowledge = data.tab4_knowledge_mastery

        this.$nextTick(() => {
          this.renderAllCharts()
        })
      } catch (error) {
        console.error('加载数据失败:', error)
        this.error = error.response?.data?.error || error.message || '加载数据失败，请稍后重试'
      } finally {
        this.loading = false
      }
    },
    switchTab(tabKey) {
      this.currentTab = tabKey
      this.$nextTick(() => {
        this.renderChart(tabKey)
      })
    },
    handleFilter() {
      this.loadData()
      this.$emit('month-change', this.selectedMonth)
    },
    handleReset() {
      this.selectedMonth = ''
      this.loadData()
      this.$emit('month-change', '')
    },
    renderAllCharts() {
      this.tabs.forEach(tab => {
        this.renderChart(tab.key)
      })
    },
    renderChart(tabKey) {
      switch (tabKey) {
        case 'basic_features':
          this.renderBasicFeaturesChart()
          break
        case 'pattern':
          this.renderPatternChart()
          break
        case 'method':
          this.renderMethodChart()
          break
        case 'knowledge':
          this.renderKnowledgeChart()
          break
      }
    },
    renderBasicFeaturesChart() {
      if (!this.chartData.basicFeatures) return
      
      const data = this.chartData.basicFeatures
      if (!this.chartInstances.basicFeatures) {
        this.chartInstances.basicFeatures = echarts.init(this.$refs.basicFeaturesChart)
      }

      const option = {
        tooltip: {
          trigger: 'item'
        },
        radar: {
          indicator: [
            { name: '提交次数', max: Math.max(data.submit_count, data.comparison.submit_count_avg) * 1.2 },
            { name: '活跃天数', max: Math.max(data.active_days, data.comparison.active_days_avg) * 1.2 },
            { name: '答题数', max: Math.max(data.question_count, data.comparison.question_count_avg) * 1.2 },
            { name: '正确占比', max: 1 }
          ],
          center: ['50%', '55%'],
          radius: '70%'
        },
        series: [{
          type: 'radar',
          data: [
            {
              value: [
                data.submit_count,
                data.active_days,
                data.question_count,
                data.correct_ratio
              ],
              name: this.studentId || this.className || '当前',
              itemStyle: {
                color: '#ff7f00'
              },
              lineStyle: {
                color: '#ff7f00',
                type: 'dashed'
              },
              areaStyle: {
                color: 'rgba(255, 127, 0, 0.3)'
              }
            },
            {
              value: [
                data.comparison.submit_count_avg,
                data.comparison.active_days_avg,
                data.comparison.question_count_avg,
                data.comparison.correct_ratio_avg
              ],
              name: '平均值',
              itemStyle: {
                color: '#1e90ff'
              },
              areaStyle: {
                color: 'rgba(30, 144, 255, 0.2)'
              }
            }
          ]
        }]
      }
      this.chartInstances.basicFeatures.setOption(option)
    },
    renderPatternChart() {
      if (!this.chartData.pattern) return
      
      const data = this.chartData.pattern
      if (!this.chartInstances.pattern) {
        this.chartInstances.pattern = echarts.init(this.$refs.patternChart)
      }

      const patternNames = Object.keys(data.patterns)
      const patternValues = Object.values(data.patterns)

      const option = {
        tooltip: {
          trigger: 'axis',
          axisPointer: { type: 'shadow' }
        },
        grid: {
          left: '10%',
          right: '10%',
          bottom: '15%',
          top: '10%'
        },
        xAxis: {
          type: 'category',
          data: patternNames
        },
        yAxis: {
          type: 'value',
          name: '人数'
        },
        series: [{
          data: patternValues,
          type: 'bar',
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#4169e1' },
              { offset: 1, color: '#87ceeb' }
            ])
          },
          label: {
            show: true,
            position: 'top'
          }
        }]
      }
      this.chartInstances.pattern.setOption(option)
    },
    renderMethodChart() {
      if (!this.chartData.method) return
      
      const data = this.chartData.method.method_distribution
      if (!this.chartInstances.method) {
        this.chartInstances.method = echarts.init(this.$refs.methodChart)
      }

      const pieData = data.map(item => ({
        value: item.count,
        name: item.method_name || item.method
      }))

      const option = {
        tooltip: {
          trigger: 'item',
          formatter: '{a} <br/>{b}: {c} ({d}%)'
        },
        legend: {
          orient: 'vertical',
          left: 'left',
          top: 'middle'
        },
        series: [{
          name: '编程方法',
          type: 'pie',
          radius: ['40%', '70%'],
          center: ['60%', '50%'],
          data: pieData,
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
          }
        }]
      }
      this.chartInstances.method.setOption(option)
    },
    renderKnowledgeChart() {
      if (!this.chartData.knowledge) return
      
      const data = this.chartData.knowledge.knowledge_stats
      if (!this.chartInstances.knowledge) {
        this.chartInstances.knowledge = echarts.init(this.$refs.knowledgeChart)
      }

      const knowledgeIds = data.map(item => item.knowledge_id)
      const masteryValues = data.map(item => item.mastery_percentage || item.mastery * 100)
      const colors = data.map(item => {
        if (item.level === 'good') return '#32cd32'
        if (item.level === 'medium') return '#ffa500'
        return '#ff6347'
      })

      const option = {
        tooltip: {
          trigger: 'axis',
          axisPointer: { type: 'shadow' }
        },
        grid: {
          left: '25%',
          right: '10%',
          bottom: '15%',
          top: '10%'
        },
        xAxis: {
          type: 'value',
          name: '掌握度(%)',
          max: 100
        },
        yAxis: {
          type: 'category',
          data: knowledgeIds
        },
        series: [{
          data: masteryValues.map((val, idx) => ({
            value: val,
            itemStyle: { color: colors[idx] }
          })),
          type: 'bar',
          label: {
            show: true,
            position: 'right',
            formatter: '{c}%'
          }
        }]
      }
      this.chartInstances.knowledge.setOption(option)
    },
    handleResize() {
      Object.values(this.chartInstances).forEach(chart => {
        if (chart) chart.resize()
      })
    }
  }
}
</script>

<style scoped>
.blue-box-1 {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 10px;
}

.filter-section {
  margin-bottom: 15px;
}

.filter-controls {
  display: flex;
  align-items: center;
  gap: 10px;
}

.filter-label {
  font-size: 14px;
  font-weight: bold;
  color: #4169e1;
}

.month-select {
  padding: 5px 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  min-width: 150px;
}

.filter-btn,
.reset-btn {
  padding: 5px 15px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
}

.filter-btn {
  background-color: #4169e1;
  color: white;
}

.filter-btn:hover {
  background-color: #1e90ff;
}

.reset-btn {
  background-color: #999;
  color: white;
}

.reset-btn:hover {
  background-color: #777;
}

.tab-section {
  display: flex;
  gap: 5px;
  margin-bottom: 15px;
  border-bottom: 2px solid #e0e0e0;
}

.tab-item {
  padding: 8px 20px;
  cursor: pointer;
  font-size: 14px;
  color: #666;
  transition: all 0.3s;
  position: relative;
}

.tab-item:hover {
  color: #4169e1;
}

.tab-item.active {
  color: #ff7f00;
  font-weight: bold;
}

.tab-item.active::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  right: 0;
  height: 2px;
  background-color: #ff7f00;
}

.chart-container-wrapper {
  flex: 1;
  overflow: hidden;
  position: relative;
}

.chart-slider {
  display: flex;
  width: 400%;
  height: 100%;
  transition: transform 0.5s ease-in-out;
}

.chart-panel {
  width: 25%;
  height: 100%;
  flex-shrink: 0;
}

.chart-content {
  width: 100%;
  height: 100%;
  min-height: 300px;
}

.loading-state,
.error-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 300px;
  color: #999;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #4169e1;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 10px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-message {
  color: #ff6347;
  margin-bottom: 10px;
  text-align: center;
}

.retry-btn {
  padding: 5px 15px;
  background-color: #4169e1;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.retry-btn:hover {
  background-color: #1e90ff;
}
</style>

