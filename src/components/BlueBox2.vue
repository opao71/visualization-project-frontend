<template>
  <div class="blue-box-2">
    <!-- 24小时答题高峰时段 -->
    <div class="chart-section hour-section">
      <h4 class="section-title">学习者答题高峰时段</h4>
      <div v-if="loading" class="loading-state">
        <div class="loading-spinner"></div>
      </div>
      <div v-else-if="error" class="error-state">
        <p class="error-message">{{ error }}</p>
        <button @click="loadData" class="retry-btn">重试</button>
      </div>
      <div v-else-if="!className && !studentId" class="empty-state">
        <p>请先选择班级或学生</p>
      </div>
      <div v-else ref="hourChart" class="chart-content"></div>
    </div>

    <!-- 月度活动热力图 -->
    <div class="chart-section heatmap-section">
      <h4 class="section-title">月度学习活动热力图</h4>
      <div v-if="loading" class="loading-state">
        <div class="loading-spinner"></div>
      </div>
      <div v-else-if="error" class="error-state">
        <p class="error-message">{{ error }}</p>
        <button @click="loadData" class="retry-btn">重试</button>
      </div>
      <div v-else-if="!className && !studentId" class="empty-state">
        <p>请先选择班级或学生</p>
      </div>
      <div v-else ref="heatmapChart" class="chart-content"></div>
    </div>
  </div>
</template>

<script>
import * as echarts from 'echarts'
import axios from 'axios'

const API_BASE_URL = 'http://localhost:5000/api'

export default {
  name: 'BlueBox2',
  props: {
    className: {
      type: String,
      default: ''
    },
    studentId: {
      type: String,
      default: ''
    },
    selectedMonth: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      hourChartInstance: null,
      heatmapChartInstance: null,
      chartData: {
        hourDistribution: null,
        monthlyHeatmap: null
      },
      loading: false,
      error: null
    }
  },
  watch: {
    className() {
      this.loadData()
    },
    studentId() {
      this.loadData()
    },
    selectedMonth() {
      this.loadData()
    }
  },
  mounted() {
    this.loadData()
    window.addEventListener('resize', this.handleResize)
  },
  beforeUnmount() {
    if (this.hourChartInstance) this.hourChartInstance.dispose()
    if (this.heatmapChartInstance) this.heatmapChartInstance.dispose()
    window.removeEventListener('resize', this.handleResize)
  },
  methods: {
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

        const response = await axios.get(`${API_BASE_URL}/learning-profile/comprehensive-bluebox2`, { params })
        const data = response.data

        this.chartData.hourDistribution = data.hour_distribution
        this.chartData.monthlyHeatmap = data.monthly_heatmap

        this.$nextTick(() => {
          this.renderHourChart()
          this.renderHeatmapChart()
        })
      } catch (error) {
        console.error('加载蓝色框2数据失败:', error)
        this.error = error.response?.data?.error || error.message || '加载数据失败，请稍后重试'
      } finally {
        this.loading = false
      }
    },
    renderHourChart() {
      if (!this.chartData.hourDistribution) return

      const data = this.chartData.hourDistribution.hour_distribution
      if (!this.hourChartInstance) {
        this.hourChartInstance = echarts.init(this.$refs.hourChart)
      }

      // 构建径向气泡图数据
      const bubbleData = data.map(item => {
        const angle = (item.hour * 15 - 90) * Math.PI / 180 // 转换为弧度，0点在顶部
        const radius = 50 + (item.count / Math.max(...data.map(d => d.count))) * 50
        return {
          value: [item.hour, item.count],
          symbolSize: Math.max(10, item.count / 2),
          itemStyle: {
            color: '#32cd32',
            opacity: 0.7
          }
        }
      })

      const option = {
        tooltip: {
          trigger: 'item',
          formatter: '{b}时: {c}次提交'
        },
        polar: {
          radius: '80%'
        },
        angleAxis: {
          type: 'category',
          data: Array.from({ length: 24 }, (_, i) => i + '时'),
          startAngle: 90,
          clockwise: true
        },
        radiusAxis: {
          type: 'value',
          show: false
        },
        series: [{
          type: 'scatter',
          coordinateSystem: 'polar',
          data: bubbleData,
          symbolSize: function(data) {
            return data[2] || 20
          }
        }]
      }
      this.hourChartInstance.setOption(option)
    },
    renderHeatmapChart() {
      if (!this.chartData.monthlyHeatmap) return

      const heatmapData = this.chartData.monthlyHeatmap.heatmap_data
      if (!this.heatmapChartInstance) {
        this.heatmapChartInstance = echarts.init(this.$refs.heatmapChart)
      }

      // 构建热力图数据
      const data = []
      const months = []
      
      heatmapData.forEach((monthData, monthIdx) => {
        months.push(monthData.month_name)
        monthData.days.forEach(dayData => {
          if (dayData.count > 0) {
            data.push([
              monthIdx,
              dayData.day - 1,
              dayData.count,
              dayData.level
            ])
          }
        })
      })

      const maxDay = Math.max(...heatmapData.map(m => m.days.length))
      const dayLabels = Array.from({ length: maxDay }, (_, i) => i + 1)

      const option = {
        tooltip: {
          position: 'top',
          formatter: function(params) {
            return `${params.value[0] + 1}月${params.value[1] + 1}日: ${params.value[2]}次提交`
          }
        },
        grid: {
          height: '60%',
          top: '10%'
        },
        xAxis: {
          type: 'category',
          data: months,
          splitArea: {
            show: true
          }
        },
        yAxis: {
          type: 'category',
          data: dayLabels,
          splitArea: {
            show: true
          }
        },
        visualMap: {
          min: 0,
          max: Math.max(...data.map(d => d[2])),
          calculable: true,
          orient: 'horizontal',
          left: 'center',
          bottom: '5%',
          inRange: {
            color: ['#ffffcc', '#ffeda0', '#fed976', '#feb24c', '#fd8d3c', '#fc4e2a', '#e31a1c']
          }
        },
        series: [{
          name: '提交次数',
          type: 'heatmap',
          data: data,
          label: {
            show: false
          },
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
          }
        }]
      }
      this.heatmapChartInstance.setOption(option)
    },
    handleResize() {
      if (this.hourChartInstance) this.hourChartInstance.resize()
      if (this.heatmapChartInstance) this.heatmapChartInstance.resize()
    }
  }
}
</script>

<style scoped>
.blue-box-2 {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 10px;
  gap: 15px;
}

.chart-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.section-title {
  font-size: 14px;
  font-weight: bold;
  color: #4169e1;
  margin-bottom: 10px;
  text-align: center;
}

.chart-content {
  flex: 1;
  min-height: 200px;
}

.hour-section {
  flex: 1;
}

.heatmap-section {
  flex: 1;
}

.loading-state,
.error-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 150px;
  color: #999;
}

.loading-spinner {
  width: 30px;
  height: 30px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #4169e1;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-message {
  color: #ff6347;
  font-size: 12px;
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
  font-size: 12px;
}

.retry-btn:hover {
  background-color: #1e90ff;
}
</style>

