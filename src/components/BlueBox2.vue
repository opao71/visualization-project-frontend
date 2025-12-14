<template>
  <div class="blue-box-2">
    <!-- Tab切换区域 -->
    <div class="tab-section">
      <div 
        v-for="tab in tabs" 
        :key="tab.key"
        :class="['tab-item', { active: currentTab === tab.key }]"
        @click="switchTab(tab.key)"
      >
        {{ tab.label }}
      </div>
    </div>

    <!-- 图表内容区域 -->
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
      
      <!-- 无数据提示 -->
      <div v-else-if="!loading && !error && !chartData.hourDistribution && !chartData.monthlyStats && !chartData.monthlyHeatmap" class="empty-state">
        <p>暂无数据</p>
      </div>
      
      <!-- 图表内容 -->
      <div v-else-if="className || studentId" class="chart-container">
        <!-- Tab 1: 24小时答题高峰时段 -->
        <div v-show="currentTab === 'hour'" class="chart-panel">
          <div ref="hourChart" class="chart-content"></div>
        </div>

        <!-- Tab 2: 月度学习趋势 -->
        <div v-show="currentTab === 'trend'" class="chart-panel">
          <div ref="trendChart" class="chart-content"></div>
        </div>

        <!-- Tab 3: 月度活动热力图 -->
        <div v-show="currentTab === 'heatmap'" class="chart-panel">
          <div ref="heatmapChart" class="chart-content"></div>
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
      currentTab: 'hour',
      tabs: [
        { key: 'hour', label: '答题高峰时段' },
        { key: 'trend', label: '月度学习趋势' },
        { key: 'heatmap', label: '月度活动热力图' }
      ],
      hourChartInstance: null,
      trendChartInstance: null,
      heatmapChartInstance: null,
      hourChartReady: false, // 标记极坐标图是否已完全初始化
      chartData: {
        hourDistribution: null,
        monthlyStats: null,
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
    if (this.trendChartInstance) this.trendChartInstance.dispose()
    if (this.heatmapChartInstance) this.heatmapChartInstance.dispose()
    window.removeEventListener('resize', this.handleResize)
  },
  methods: {
    async loadData() {
      if (!this.className && !this.studentId) {
        this.loading = false
        this.error = null
        this.chartData.hourDistribution = null
        this.chartData.monthlyStats = null
        this.chartData.monthlyHeatmap = null
        return
      }

      this.loading = true
      this.error = null

      try {
        const params = {}
        if (this.studentId) {
          params.student_id = this.studentId
          console.log('BlueBox2: 加载学生数据, student_id:', this.studentId)
        } else if (this.className) {
          params.class_name = this.className
          console.log('BlueBox2: 加载班级数据, class_name:', this.className)
        }
        if (this.selectedMonth) params.month = this.selectedMonth

        const response = await axios.get(`${API_BASE_URL}/learning-profile/comprehensive-bluebox2`, { params })
        const data = response.data

        console.log('BlueBox2: 接收到的数据:', data)

        this.chartData.hourDistribution = data.hour_distribution || null
        this.chartData.monthlyStats = data.monthly_stats || null
        this.chartData.monthlyHeatmap = data.monthly_heatmap || null

        this.$nextTick(() => {
          // 只渲染当前显示的图表
          this.renderChart(this.currentTab)
        })
      } catch (error) {
        console.error('BlueBox2: 加载数据失败:', error)
        console.error('BlueBox2: 错误详情:', error.response?.data)
        this.error = error.response?.data?.error || error.message || '加载数据失败，请稍后重试'
        this.chartData.hourDistribution = null
        this.chartData.monthlyStats = null
        this.chartData.monthlyHeatmap = null
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
    renderChart(tabKey) {
      // 确保 DOM 元素可见后再渲染
      this.$nextTick(() => {
        switch (tabKey) {
          case 'hour':
            this.renderHourChart()
            break
          case 'trend':
            this.renderTrendChart()
            break
          case 'heatmap':
            this.renderHeatmapChart()
            break
        }
      })
    },
    renderHourChart() {
      if (!this.chartData.hourDistribution || !this.chartData.hourDistribution.hour_distribution) return
      if (this.currentTab !== 'hour') return // 只在当前tab时渲染

      const ref = this.$refs.hourChart
      if (!ref) return

      const data = this.chartData.hourDistribution.hour_distribution
      if (!data || data.length === 0) return

      // 确保容器有尺寸后再初始化
      this.$nextTick(() => {
        // 检查容器是否可见且有尺寸
        if (!ref || ref.offsetWidth === 0 || ref.offsetHeight === 0) {
          setTimeout(() => this.renderHourChart(), 100)
          return
        }

        // 如果图表实例已存在但被销毁，重新创建
        if (this.hourChartInstance) {
          try {
            this.hourChartInstance.dispose()
          } catch (e) {
            // 忽略dispose错误
          }
          this.hourChartInstance = null
          this.hourChartReady = false
        }
        
        // 初始化图表实例
        try {
          this.hourChartInstance = echarts.init(ref)
        } catch (e) {
          console.error('初始化极坐标图失败:', e)
          return
        }

        // 构建径向气泡图数据
        const maxCount = Math.max(...data.map(item => item.count), 1)
        const bubbleData = data.map(item => {
          const size = Math.max(15, Math.min(50, (item.count / maxCount) * 50))
          return {
            value: [item.hour, item.count],
            symbolSize: size,
            itemStyle: {
              color: '#32cd32',
              opacity: 0.7
            }
          }
        })
        
        // 确保 maxCount 至少为 1
        const radiusMax = Math.max(maxCount, 1)
        
        const option = {
          tooltip: {
            trigger: 'item',
            confine: true,
            extraCssText: 'z-index: 9999;',
            renderMode: 'html',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            borderColor: '#ccc',
            borderWidth: 1,
            textStyle: {
              color: '#333'
            },
            formatter: function(params) {
              if (!params || !params.data) return ''
              if (params.data && params.data.value && Array.isArray(params.data.value) && params.data.value.length >= 2) {
                return `<div style="padding: 5px;">${params.data.value[0]}时: ${params.data.value[1]}次提交</div>`
              }
              return ''
            }
          },
          polar: {
            radius: '75%',
            center: ['50%', '55%']
          },
          angleAxis: {
            type: 'category',
            data: Array.from({ length: 24 }, (_, i) => i + '时'),
            startAngle: 90,
            clockwise: true,
            boundaryGap: false,
            axisLine: {
              show: true,
              lineStyle: {
                color: '#999'
              }
            },
            splitLine: {
              show: true,
              lineStyle: {
                color: '#e0e0e0',
                type: 'dashed'
              }
            }
          },
          radiusAxis: {
            type: 'value',
            min: 0,
            max: radiusMax,
            splitNumber: 5,
            axisLine: {
              show: true,
              lineStyle: {
                color: '#999'
              }
            },
            axisLabel: {
              show: true,
              formatter: '{value}'
            },
            splitLine: {
              show: true,
              lineStyle: {
                color: '#e0e0e0',
                type: 'dashed'
              }
            },
            axisTick: {
              show: true
            }
          },
          series: [{
            name: '答题次数',
            type: 'scatter',
            coordinateSystem: 'polar',
            data: bubbleData,
            symbolSize: function(data) {
              return data.symbolSize || 20
            },
            label: {
              show: false
            }
          }]
        }
        
        try {
          this.hourChartInstance.setOption(option, true)
          console.log('BlueBox2: 极坐标图setOption成功')
          
          // 标记图表未完全初始化，等待坐标系统创建完成
          this.hourChartReady = false
          
          // 延迟标记为已准备好，确保坐标系统已完全创建
          setTimeout(() => {
            this.hourChartReady = true
            console.log('BlueBox2: 极坐标图坐标系统已初始化')
          }, 300)
        } catch (e) {
          console.error('设置极坐标图选项失败:', e)
          this.hourChartReady = false
        }
      })
    },
    renderTrendChart() {
      if (!this.chartData.monthlyStats || !Array.isArray(this.chartData.monthlyStats) || this.chartData.monthlyStats.length === 0) return

      const ref = this.$refs.trendChart
      if (!ref) return

      // 如果图表实例已存在但被销毁，重新创建
      if (this.trendChartInstance) {
        try {
          this.trendChartInstance.dispose()
        } catch (e) {
          // 忽略dispose错误
        }
      }
      this.trendChartInstance = echarts.init(ref)

      const data = this.chartData.monthlyStats
      const months = data.map(item => {
        const [year, month] = item.month.split('-')
        return `${year}年${parseInt(month)}月`
      })
      const submitCounts = data.map(item => item.submit_count)
      const questionCounts = data.map(item => item.question_count)
      const correctPercentages = data.map(item => item.correct_percentage)

      const option = {
        tooltip: {
          trigger: 'axis',
          confine: true,
          extraCssText: 'z-index: 9999;',
          renderMode: 'html',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          borderColor: '#ccc',
          borderWidth: 1,
          textStyle: {
            color: '#333'
          },
          formatter: function(params) {
            if (!params || !Array.isArray(params) || params.length === 0) return ''
            let result = '<div style="padding: 5px;">'
            result += '<strong>' + (params[0].name || '') + '</strong><br/>'
            params.forEach(param => {
              if (param && param.seriesName) {
                if (param.seriesName === '正确率') {
                  result += param.seriesName + ': ' + (param.value || 0) + '%<br/>'
                } else {
                  result += param.seriesName + ': ' + (param.value || 0) + '<br/>'
                }
              }
            })
            result += '</div>'
            return result
          }
        },
        legend: {
          data: ['提交次数', '答题数', '正确率'],
          top: 10
        },
        grid: {
          left: '10%',
          right: '10%',
          bottom: '15%',
          top: '20%'
        },
        xAxis: {
          type: 'category',
          data: months,
          axisLabel: {
            rotate: 45
          }
        },
        yAxis: [
          {
            type: 'value',
            name: '次数',
            position: 'left'
          },
          {
            type: 'value',
            name: '正确率(%)',
            position: 'right',
            max: 100
          }
        ],
        series: [
          {
            name: '提交次数',
            type: 'line',
            data: submitCounts,
            itemStyle: { color: '#4169e1' },
            smooth: true
          },
          {
            name: '答题数',
            type: 'line',
            data: questionCounts,
            itemStyle: { color: '#32cd32' },
            smooth: true
          },
          {
            name: '正确率',
            type: 'line',
            yAxisIndex: 1,
            data: correctPercentages,
            itemStyle: { color: '#ff7f00' },
            smooth: true
          }
        ]
      }
      this.trendChartInstance.setOption(option, true)
      
      // 确保图表大小正确
      this.$nextTick(() => {
        if (this.trendChartInstance) {
          this.trendChartInstance.resize()
        }
      })
    },
    renderHeatmapChart() {
      if (!this.chartData.monthlyHeatmap || !this.chartData.monthlyHeatmap.heatmap_data) return

      const ref = this.$refs.heatmapChart
      if (!ref) return

      const heatmapData = this.chartData.monthlyHeatmap.heatmap_data
      if (!heatmapData || heatmapData.length === 0) return

      // 如果图表实例已存在但被销毁，重新创建
      if (this.heatmapChartInstance) {
        try {
          this.heatmapChartInstance.dispose()
        } catch (e) {
          // 忽略dispose错误
        }
      }
      this.heatmapChartInstance = echarts.init(ref)

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
          confine: true,
          extraCssText: 'z-index: 9999;',
          renderMode: 'html',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          borderColor: '#ccc',
          borderWidth: 1,
          textStyle: {
            color: '#333'
          },
          formatter: function(params) {
            if (!params || !params.value || !Array.isArray(params.value) || params.value.length < 3) {
              return ''
            }
            return `<div style="padding: 5px;">${params.value[0] + 1}月${params.value[1] + 1}日: ${params.value[2]}次提交</div>`
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
      this.heatmapChartInstance.setOption(option, true)
      
      // 确保图表大小正确
      this.$nextTick(() => {
        if (this.heatmapChartInstance) {
          this.heatmapChartInstance.resize()
        }
      })
    },
    handleResize() {
      // 延迟执行，确保DOM已更新
      this.$nextTick(() => {
        if (this.hourChartInstance && this.currentTab === 'hour') {
          try {
            const ref = this.$refs.hourChart
            if (ref && ref.offsetWidth > 0 && ref.offsetHeight > 0) {
              // 检查图表是否已完全初始化（包括坐标系统）
              if (!this.hourChartReady) {
                console.warn('BlueBox2: 极坐标图坐标系统未完全初始化，跳过resize')
                return
              }
              
              try {
                const dom = this.hourChartInstance.getDom()
                const option = this.hourChartInstance.getOption()
                if (dom && option && option.series && option.series.length > 0) {
                  // 使用 try-catch 包裹 resize，防止坐标系统未完全初始化时的错误
                  try {
                    this.hourChartInstance.resize({
                      width: ref.offsetWidth,
                      height: ref.offsetHeight
                    })
                  } catch (resizeError) {
                    // 如果 resize 失败，可能是坐标系统还未完全初始化
                    console.warn('BlueBox2: 极坐标图resize失败，坐标系统可能未完全初始化:', resizeError)
                    // 延迟重试
                    setTimeout(() => {
                      if (this.hourChartInstance && this.hourChartReady && ref && ref.offsetWidth > 0 && ref.offsetHeight > 0) {
                        try {
                          this.hourChartInstance.resize({
                            width: ref.offsetWidth,
                            height: ref.offsetHeight
                          })
                        } catch (retryError) {
                          console.warn('BlueBox2: 极坐标图延迟resize仍然失败:', retryError)
                        }
                      }
                    }, 200)
                  }
                }
              } catch (e) {
                // 如果图表未完全初始化，忽略resize错误
                console.warn('BlueBox2: 极坐标图未完全初始化，跳过resize:', e)
              }
            }
          } catch (e) {
            console.error('resize极坐标图失败:', e)
          }
        }
        if (this.trendChartInstance && this.currentTab === 'trend') {
          try {
            const ref = this.$refs.trendChart
            if (ref && ref.offsetWidth > 0 && ref.offsetHeight > 0) {
              this.trendChartInstance.resize()
            }
          } catch (e) {
            console.error('resize趋势图失败:', e)
          }
        }
        if (this.heatmapChartInstance && this.currentTab === 'heatmap') {
          try {
            const ref = this.$refs.heatmapChart
            if (ref && ref.offsetWidth > 0 && ref.offsetHeight > 0) {
              this.heatmapChartInstance.resize()
            }
          } catch (e) {
            console.error('resize热力图失败:', e)
          }
        }
      })
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
  position: relative;
  overflow: visible;
  background: white;
}

.tab-section {
  display: flex;
  gap: 4px;
  margin-bottom: 10px;
  padding: 6px 10px 0 10px;
  overflow-x: auto;
  overflow-y: hidden;
  position: relative;
  z-index: 1;
}

.tab-item {
  border: 1px solid #d1d5db;
  background-color: #f9fafb;
  color: #4b5563;
  border-radius: 999px;
  padding: 2px 8px;
  font-size: 10px;
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
  flex-shrink: 0;
}

.tab-item:hover {
  background-color: #e5e7eb;
}

.tab-item.active {
  background-color: #111827;
  color: #f9fafb;
  border-color: #111827;
}

.chart-container-wrapper {
  flex: 1;
  min-height: 0;
  position: relative;
  z-index: 1;
  width: 100%;
  height: 100%;
  overflow: visible;
}

.chart-container {
  width: 100%;
  height: 100%;
  position: relative;
}

.chart-panel {
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
}

.chart-content {
  width: 100%;
  height: 100%;
  min-height: 0;
}

.loading-state,
.error-state,
.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #6b7280;
  position: relative;
  z-index: 1;
}

.loading-spinner {
  width: 30px;
  height: 30px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #111827;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-message {
  color: #b91c1c;
  font-size: 12px;
  margin-bottom: 10px;
  text-align: center;
}

.retry-btn {
  padding: 4px 12px;
  background-color: #111827;
  color: #f9fafb;
  border: 1px solid #111827;
  border-radius: 4px;
  cursor: pointer;
  font-size: 11px;
  transition: all 0.15s ease;
}

.retry-btn:hover {
  background-color: #374151;
}
</style>

