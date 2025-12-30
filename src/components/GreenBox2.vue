<template>
  <div class="green-box-2">
    <!-- 图表网格布局：2x2 -->
    <div class="charts-grid">
      <!-- 加载状态 -->
      <div v-if="loading" class="loading-overlay">
        <div class="loading-spinner"></div>
        <p>数据加载中...</p>
      </div>
      
      <!-- 错误状态 -->
      <div v-else-if="error" class="error-overlay">
        <p class="error-message">{{ error }}</p>
        <button @click="loadData" class="retry-btn">重试</button>
      </div>
      
      <!-- 空数据状态 -->
      <div v-else-if="!className && !studentId" class="empty-overlay">
        <p>请先选择班级或学生</p>
      </div>
      
      <!-- 无数据提示 -->
      <div v-else-if="!hasData" class="empty-overlay">
        <p>暂无数据</p>
      </div>
      
      <!-- 图表内容 -->
      <template v-else>
        <!-- 图表1: 知识掌握程度 vs 学习时长 -->
        <div class="chart-item">
          <div class="chart-title">{{ scatterPlots.learning_duration?.title || '知识掌握程度 vs 学习时长' }}</div>
          <div ref="learningDurationChart" class="chart-content"></div>
        </div>

        <!-- 图表2: 知识掌握程度 vs 编程习惯 -->
        <div class="chart-item">
          <div class="chart-title">{{ scatterPlots.coding_habits?.title || '知识掌握程度 vs 编程习惯' }}</div>
          <div ref="codingHabitsChart" class="chart-content"></div>
        </div>

        <!-- 图表3: 知识掌握程度 vs 平均得分 -->
        <div class="chart-item">
          <div class="chart-title">{{ scatterPlots.average_score?.title || '知识掌握程度 vs 平均得分' }}</div>
          <div ref="averageScoreChart" class="chart-content"></div>
        </div>

        <!-- 图表4: 知识掌握程度 vs 提交次数 -->
        <div class="chart-item">
          <div class="chart-title">{{ scatterPlots.submit_count?.title || '知识掌握程度 vs 提交次数' }}</div>
          <div ref="submitCountChart" class="chart-content"></div>
        </div>
      </template>
    </div>
  </div>
</template>

<script>
import * as echarts from 'echarts'
import axios from 'axios'

const API_BASE_URL = 'http://localhost:5000/api'

export default {
  name: 'GreenBox2',
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
  data() {
    return {
      scatterPlots: {},
      chartInstances: {},
      loading: false,
      error: null
    }
  },
  computed: {
    hasData() {
      return this.scatterPlots && Object.keys(this.scatterPlots).length > 0
    }
  },
  watch: {
    className() {
      this.loadData()
    },
    studentId() {
      this.loadData()
    }
  },
  mounted() {
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
    async loadData() {
      if (!this.className && !this.studentId) {
        this.error = null
        this.loading = false
        this.scatterPlots = {}
        return
      }
      
      this.loading = true
      this.error = null
      
      try {
        const params = {}
        // 如果同时有studentId和className，优先使用studentId（单个学生）
        // 如果只有className，返回该班级所有学生的数据
        if (this.studentId) {
          params.student_ID = this.studentId
        }
        if (this.className) {
          params.class = this.className
        }

        console.log('GreenBox2: 请求参数:', params)
        const response = await axios.get(`${API_BASE_URL}/green/box2/learning-mode-analysis`, { params })
        const data = response.data

        console.log('GreenBox2: 接收到的数据:', data)
        console.log('GreenBox2: scatter_plots:', data.scatter_plots)

        if (data.scatter_plots) {
          this.scatterPlots = data.scatter_plots
          
          // 打印每个图表的数据
          Object.keys(this.scatterPlots).forEach(key => {
            const plot = this.scatterPlots[key]
            console.log(`GreenBox2: ${key} 数据点数量:`, plot.data ? plot.data.length : 0)
            if (plot.data && plot.data.length > 0) {
              console.log(`GreenBox2: ${key} 前3个数据点:`, plot.data.slice(0, 3))
            }
          })
          
          // 延迟渲染，确保DOM已更新
          this.$nextTick(() => {
            setTimeout(() => {
              this.renderAllCharts()
            }, 150)
          })
        } else {
          console.warn('GreenBox2: 没有scatter_plots数据')
          this.scatterPlots = {}
        }
      } catch (error) {
        console.error('GreenBox2: 加载数据失败:', error)
        this.error = error.response?.data?.error || error.message || '加载数据失败，请稍后重试'
        this.scatterPlots = {}
      } finally {
        this.loading = false
      }
    },
    renderAllCharts() {
      this.renderChart('learning_duration', 'learningDurationChart', this.scatterPlots.learning_duration)
      this.renderChart('coding_habits', 'codingHabitsChart', this.scatterPlots.coding_habits)
      this.renderChart('average_score', 'averageScoreChart', this.scatterPlots.average_score)
      this.renderChart('submit_count', 'submitCountChart', this.scatterPlots.submit_count)
    },
    renderChart(chartKey, refName, plotData) {
      if (!plotData || !plotData.data || !Array.isArray(plotData.data) || plotData.data.length === 0) {
        console.log(`GreenBox2: ${chartKey} 数据为空`, plotData)
        return
      }
      
      console.log(`GreenBox2: 开始渲染 ${chartKey}，数据点数量:`, plotData.data.length)

      const ref = this.$refs[refName]
      if (!ref) {
        console.log(`GreenBox2: ${refName} 容器不存在，延迟重试`)
        setTimeout(() => this.renderChart(chartKey, refName, plotData), 100)
        return
      }

      // 检查容器尺寸
      let containerWidth = ref.offsetWidth || ref.clientWidth
      let containerHeight = ref.offsetHeight || ref.clientHeight
      console.log(`GreenBox2: ${chartKey} 容器尺寸:`, { width: containerWidth, height: containerHeight })
      
      // 如果容器尺寸太小，强制设置最小尺寸并重新获取
      if (containerWidth < 200 || containerHeight < 150) {
        ref.style.width = '100%'
        ref.style.height = '100%'
        ref.style.minWidth = '200px'
        ref.style.minHeight = '150px'
        console.log(`GreenBox2: ${chartKey} 容器尺寸太小，强制设置最小尺寸`)
        // 等待样式应用后重新获取尺寸
        setTimeout(() => {
          containerWidth = ref.offsetWidth || ref.clientWidth || 200
          containerHeight = ref.offsetHeight || ref.clientHeight || 150
          if (containerWidth === 0 || containerHeight === 0) {
            console.log(`GreenBox2: ${chartKey} 容器尺寸仍为0，延迟重试`)
            setTimeout(() => this.renderChart(chartKey, refName, plotData), 200)
            return
          }
          this._renderChartWithSize(chartKey, refName, plotData, ref)
        }, 50)
        return
      }
      
      if (containerWidth === 0 || containerHeight === 0) {
        console.log(`GreenBox2: ${chartKey} 容器尺寸为0，延迟重试`)
        setTimeout(() => this.renderChart(chartKey, refName, plotData), 100)
        return
      }
      
      this._renderChartWithSize(chartKey, refName, plotData, ref)
    },
    _renderChartWithSize(chartKey, refName, plotData, ref) {

      // 销毁旧实例
      if (this.chartInstances[chartKey]) {
        try {
          this.chartInstances[chartKey].dispose()
        } catch (e) {
          // 忽略dispose错误
        }
        this.chartInstances[chartKey] = null
      }

      // 创建新实例
      try {
        this.chartInstances[chartKey] = echarts.init(ref)
      } catch (e) {
        console.error(`GreenBox2: 创建${chartKey}图表实例失败:`, e)
        return
      }

      const data = plotData.data
      const stats = plotData.statistics || {}
      
      console.log(`GreenBox2: ${chartKey} 原始数据示例:`, data.slice(0, 2))
      
      // 准备散点数据
      const scatterData = data.map(item => {
        let x = item.x_value || 0
        let y = item.y_value || 0
        const studentId = item.student_ID || 'unknown'
        
        // 对于编程习惯，确保x值有效（不为0或NaN）
        if (chartKey === 'coding_habits') {
          if (x === 0 || isNaN(x) || x === null || x === undefined) {
            x = 0.5  // 默认值
          }
        }
        
        return [x, y, studentId]
      })
      
      console.log(`GreenBox2: ${chartKey} 散点数据示例:`, scatterData.slice(0, 2))
      console.log(`GreenBox2: ${chartKey} X值范围:`, {
        min: Math.min(...scatterData.map(d => d[0])),
        max: Math.max(...scatterData.map(d => d[0])),
        stats: stats
      })

      // 不同图表的颜色
      const chartColors = {
        learning_duration: '#5470c6',    // 蓝色
        coding_habits: '#91cc75',          // 绿色
        average_score: '#fac858',          // 黄色
        submit_count: '#ee6666'            // 红色
      }

      const color = chartColors[chartKey] || '#5470c6'

      // 计算X轴范围，特别处理单个数据点的情况
      const xMin = Math.min(...scatterData.map(d => d[0]))
      const xMax = Math.max(...scatterData.map(d => d[0]))
      const xRange = xMax - xMin
      
      // 对于编程习惯图表，确保X轴范围合理，避免点落在Y轴上
      let xAxisMin, xAxisMax
      if (chartKey === 'coding_habits') {
        if (xRange === 0 || scatterData.length === 1) {
          // 单个数据点或所有点X值相同，确保X轴范围是0-1，点不在边界
          const xValue = xMin
          xAxisMin = Math.max(0, xValue - 0.15)
          xAxisMax = Math.min(1, xValue + 0.15)
          // 如果点在边界附近，调整范围
          if (xValue < 0.1) {
            xAxisMin = 0
            xAxisMax = Math.min(1, xValue + 0.3)
          } else if (xValue > 0.9) {
            xAxisMin = Math.max(0, xValue - 0.3)
            xAxisMax = 1
          }
        } else {
          // 多个数据点，使用统计信息或数据范围
          xAxisMin = stats.x_min !== undefined ? Math.max(0, stats.x_min - 0.05) : Math.max(0, xMin - 0.05)
          xAxisMax = stats.x_max !== undefined ? Math.min(1, stats.x_max + 0.05) : Math.min(1, xMax + 0.05)
        }
      } else {
        // 其他图表类型
        if (xRange === 0 || scatterData.length === 1) {
          // 单个数据点，确保有合理的范围
          const xValue = xMin
          const padding = Math.max(Math.abs(xValue) * 0.2, 0.1)
          xAxisMin = xValue - padding
          xAxisMax = xValue + padding
        } else {
          // 多个数据点
          const padding = xRange * 0.1
          xAxisMin = stats.x_min !== undefined ? stats.x_min - padding : xMin - padding
          xAxisMax = stats.x_max !== undefined ? stats.x_max + padding : xMax + padding
        }
      }

      const option = {
        tooltip: {
          trigger: 'item',
          confine: true,
          extraCssText: 'z-index: 9999;',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          borderColor: '#ccc',
          borderWidth: 1,
          textStyle: {
            color: '#333',
            fontSize: 12
          },
          formatter: (params) => {
            if (!params || !params.data) return ''
            
            // 处理散点图数据格式
            let point = params.data
            let studentId = '未知'
            let xValue = 0
            let yValue = 0
            
            // 数据可能是数组格式 [x, y, studentId] 或对象格式
            if (Array.isArray(point)) {
              xValue = point[0] || 0
              yValue = point[1] || 0
              studentId = point[2] || '未知'
            } else if (typeof point === 'object') {
              xValue = point.value ? (Array.isArray(point.value) ? point.value[0] : point.value) : 0
              yValue = point.value ? (Array.isArray(point.value) ? point.value[1] : point.value) : 0
              studentId = point.student_ID || point.studentId || '未知'
            } else {
              return ''
            }
            
            // 根据图表类型格式化X轴数值
            let xLabel = plotData.x_axis_label || 'X轴'
            let xFormatted = xValue
            if (chartKey === 'coding_habits') {
              xFormatted = (xValue * 100).toFixed(2) + '%'
            } else if (chartKey === 'average_score') {
              xFormatted = xValue.toFixed(2)
            } else if (chartKey === 'learning_duration') {
              xFormatted = xValue.toFixed(2) + '小时'
            } else {
              xFormatted = xValue.toString()
            }
            
            const studentIdStr = typeof studentId === 'string' ? studentId.substring(0, 10) : String(studentId).substring(0, 10)
            
            return `
              <div style="padding: 8px;">
                <div style="font-weight: bold; margin-bottom: 4px;">学生ID: ${studentIdStr}...</div>
                <div>${xLabel}: ${xFormatted}</div>
                <div>知识掌握程度: ${typeof yValue === 'number' ? yValue.toFixed(2) : yValue}%</div>
                ${stats.correlation !== undefined ? `<div style="margin-top: 4px; color: #666; font-size: 11px;">相关系数: ${stats.correlation.toFixed(3)}</div>` : ''}
              </div>
            `
          }
        },
        grid: {
          left: '12%',
          right: '8%',
          bottom: '15%',
          top: '10%',
          containLabel: false
        },
        xAxis: {
          type: 'value',
          name: plotData.x_axis_label || 'X轴',
          nameLocation: 'middle',
          nameGap: 30,
          nameTextStyle: {
            fontSize: 12,
            fontWeight: 'bold'
          },
          min: xAxisMin,
          max: xAxisMax,
          axisLabel: {
            fontSize: 10,
            formatter: (value) => {
              if (chartKey === 'coding_habits') {
                return (value * 100).toFixed(0) + '%'
              } else if (chartKey === 'average_score') {
                return value.toFixed(1)
              } else if (chartKey === 'learning_duration') {
                return value.toFixed(0) + 'h'
              }
              return value
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
        yAxis: {
          type: 'value',
          name: plotData.y_axis_label || '知识掌握程度(%)',
          nameLocation: 'middle',
          nameGap: 50,
          nameTextStyle: {
            fontSize: 12,
            fontWeight: 'bold'
          },
          min: stats.y_min !== undefined ? stats.y_min : 0,
          max: stats.y_max !== undefined ? stats.y_max : 80,
          axisLabel: {
            fontSize: 10,
            formatter: '{value}%'
          },
          splitLine: {
            show: true,
            lineStyle: {
              color: '#e0e0e0',
              type: 'dashed'
            }
          }
        },
        series: [{
          name: plotData.title || '散点图',
          type: 'scatter',
          data: scatterData,
          symbolSize: 8,
          itemStyle: {
            color: color,
            opacity: 0.6,
            borderColor: color,
            borderWidth: 1
          },
          emphasis: {
            itemStyle: {
              color: color,
              opacity: 1,
              borderColor: color,
              borderWidth: 2,
              shadowBlur: 10,
              shadowColor: color
            },
            focus: 'self'
          }
        }]
      }

      try {
        console.log(`GreenBox2: 设置${chartKey}图表选项，数据点数量:`, scatterData.length, 'X轴范围:', { min: xAxisMin, max: xAxisMax })
        this.chartInstances[chartKey].setOption(option, true)
        console.log(`GreenBox2: ${chartKey}图表设置成功`)
        
        // 确保图表正确显示，延迟resize以确保容器尺寸已更新
        setTimeout(() => {
          if (this.chartInstances[chartKey] && ref && ref.offsetWidth > 0 && ref.offsetHeight > 0) {
            try {
              this.chartInstances[chartKey].resize()
              console.log(`GreenBox2: ${chartKey}图表resize成功`)
            } catch (e) {
              console.error(`GreenBox2: ${chartKey}图表resize失败:`, e)
            }
          }
        }, 100)
      } catch (e) {
        console.error(`GreenBox2: 设置${chartKey}图表失败:`, e)
        console.error(`GreenBox2: 错误详情:`, e.stack)
      }
    },
    calculateTrendLine(data, stats) {
      // 简单的趋势线计算（线性回归）
      if (!data || data.length < 2) return []
      
      const xValues = data.map(d => d[0])
      const yValues = data.map(d => d[1])
      
      // 使用统计信息中的范围
      const xMin = stats.x_min !== undefined ? stats.x_min : Math.min(...xValues)
      const xMax = stats.x_max !== undefined ? stats.x_max : Math.max(...xValues)
      
      // 如果提供了相关系数，使用它来计算趋势线
      if (stats.correlation !== undefined) {
        const xMean = xValues.reduce((a, b) => a + b, 0) / xValues.length
        const yMean = yValues.reduce((a, b) => a + b, 0) / yValues.length
        
        const xStd = Math.sqrt(xValues.reduce((sum, x) => sum + Math.pow(x - xMean, 2), 0) / xValues.length)
        const yStd = Math.sqrt(yValues.reduce((sum, y) => sum + Math.pow(y - yMean, 2), 0) / yValues.length)
        
        if (xStd === 0 || yStd === 0) {
          // 如果标准差为0，返回水平线
          return [
            [xMin, yMean],
            [xMax, yMean]
          ]
        }
        
        const slope = stats.correlation * (yStd / xStd)
        const intercept = yMean - slope * xMean
        
        return [
          [xMin, Math.max(0, Math.min(80, slope * xMin + intercept))],
          [xMax, Math.max(0, Math.min(80, slope * xMax + intercept))]
        ]
      }
      
      // 如果没有相关系数，使用最小二乘法
      const n = data.length
      const sumX = xValues.reduce((a, b) => a + b, 0)
      const sumY = yValues.reduce((a, b) => a + b, 0)
      const sumXY = data.reduce((sum, d) => sum + d[0] * d[1], 0)
      const sumXX = xValues.reduce((sum, x) => sum + x * x, 0)
      
      const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
      const intercept = (sumY - slope * sumX) / n
      
      return [
        [xMin, Math.max(0, Math.min(80, slope * xMin + intercept))],
        [xMax, Math.max(0, Math.min(80, slope * xMax + intercept))]
      ]
    },
    handleResize() {
      this.$nextTick(() => {
        Object.values(this.chartInstances).forEach(chart => {
          if (chart) {
            try {
              chart.resize()
            } catch (e) {
              console.error('GreenBox2 resize图表失败:', e)
            }
          }
        })
      })
    }
  }
}
</script>

<style scoped>
.green-box-2 {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
  background: white;
}

.charts-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;
  gap: 0;
  width: 100%;
  height: 100%;
  padding: 0;
  box-sizing: border-box;
}

.chart-item {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: white;
  border: none;
  border-right: 1px solid #e0e0e0;
  border-bottom: 1px solid #e0e0e0;
  overflow: hidden;
}

.chart-item:nth-child(2n) {
  border-right: none;
}

.chart-item:nth-child(n+3) {
  border-bottom: none;
}

.chart-title {
  padding: 6px 8px;
  font-size: 11px;
  font-weight: 600;
  color: #333;
  background: #f9f9f9;
  border-bottom: 1px solid #e0e0e0;
  text-align: center;
  white-space: normal;
  word-wrap: break-word;
  overflow: visible;
  flex-shrink: 0;
  line-height: 1.3;
}

.chart-content {
  flex: 1;
  width: 100%;
  min-height: 150px;
  min-width: 200px;
  position: relative;
}

.loading-overlay,
.error-overlay,
.empty-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.9);
  z-index: 10;
  color: #6b7280;
}

.loading-spinner {
  width: 30px;
  height: 30px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #32cd32;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 10px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-message {
  color: #b91c1c;
  margin-bottom: 10px;
  text-align: center;
  font-size: 12px;
}

.retry-btn {
  padding: 6px 16px;
  background-color: #32cd32;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 11px;
  transition: all 0.15s ease;
}

.retry-btn:hover {
  background-color: #28a428;
}
</style>

