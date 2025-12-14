<template>
  <div class="pink-state-trends">
    <div class="header-row">
      <h3>答题状态</h3>
      <div class="dimension-tabs">
        <button
          v-for="opt in dimensionOptions"
          :key="opt.value"
          class="tab-btn"
          :class="{ active: activeDimension === opt.value }"
          @click="switchDimension(opt.value)"
        >
          {{ opt.label }}
        </button>
      </div>
    </div>
    <div v-if="loading" class="loading">加载中...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else ref="chartContainer" class="chart-container"></div>
  </div>
</template>

<script>
import axios from 'axios'
import echarts from '@/utils/echarts'

export default {
  name: 'PinkStateTrends',
  data() {
    return {
      loading: true,
      error: null,
      chart: null,
      apiBaseUrl: 'http://127.0.0.1:5000/api',
      dimensionData: null,
      activeDimension: 'time',
      dimensionOptions: [
        { value: 'time', label: '周数' },
        { value: 'knowledge', label: '知识点' },
        { value: 'method', label: '语言' }
      ]
    }
  },
  mounted() {
    this.loadData()
  },
  beforeUnmount() {
    if (this.chart) {
      this.chart.dispose()
    }
    window.removeEventListener('resize', this.handleResize)
  },
  methods: {
    async loadData() {
      try {
        this.loading = true
        this.error = null
        const response = await axios.get(`${this.apiBaseUrl}/pink/state-trends`)
        this.dimensionData = response.data?.dimensionData || null
        this.loading = false
        await this.$nextTick()
        this.renderChart()
      } catch (err) {
        console.error('加载状态折线图数据失败:', err)
        this.error = '加载状态折线图数据失败，请检查后端服务是否运行'
        this.loading = false
      }
    },
    switchDimension(dim) {
      if (this.activeDimension === dim) return
      this.activeDimension = dim
      if (this.dimensionData) {
        this.renderChart()
      }
    },
    renderChart() {
      if (!this.$refs.chartContainer || !this.dimensionData) return

      const activeDim = this.activeDimension
      const dimSection = this.dimensionData[activeDim] || {
        xLabels: [],
        stateData: []
      }
      const rawXLabels = dimSection.xLabels || []
      // 时间维度：只保留“第X周”部分，去掉日期
      const xLabels = activeDim === 'time'
        ? rawXLabels.map(v => {
            if (typeof v !== 'string') return v
            // 先去掉括号后的日期部分，再只保留数字部分，例如："第1周(2023-08-31)" → "1"
            const base = v.split('（')[0].split('(')[0]
            const match = base.match(/\d+/)
            return match ? match[0] : base
          })
        : rawXLabels
      const stateData = dimSection.stateData || []

      if (this.chart) {
        this.chart.dispose()
      }
      this.chart = echarts.init(this.$refs.chartContainer)

      // 为不同状态分配一组可复用的颜色（12种左右）
      const palette = [
        '#2563eb', '#16a34a', '#f97316', '#facc15',
        '#ec4899', '#8b5cf6', '#06b6d4', '#10b981',
        '#ef4444', '#7c2d12', '#4b5563', '#0f766e'
      ]

      const series = stateData.map((s, idx) => ({
        name: s.stateCode,
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 4,
        data: s.ratios || [],
        showSymbol: false,
        lineStyle: {
          width: 2,
          color: palette[idx % palette.length]
        },
        itemStyle: {
          color: palette[idx % palette.length]
        },
        emphasis: {
          focus: 'series',
          lineStyle: {
            width: 3
          }
        }
      }))
      const option = {
        backgroundColor: '#f9fafb',
        tooltip: {
          trigger: 'axis',
          confine: false,
          padding: 10,
          backgroundColor: '#ffffff',
          borderColor: 'rgba(107, 114, 128, 0.4)',
          borderWidth: 1,
          borderRadius: 8,
          textStyle: {
            color: '#111827',
            fontSize: 12
          },
          formatter: params => {
            if (!params || !params.length) return ''
            const xLabel = params[0].axisValue
            let title = ''
            if (this.activeDimension === 'time') {
              title = `时间段：${xLabel}`
            } else if (this.activeDimension === 'knowledge') {
              title = `知识点：${xLabel}`
            } else {
              title = `编程语言：${xLabel}`
            }
            const lines = params.map(p => {
              const ratio = p.data != null ? `${p.data}%` : '0%'
              return `<div style="margin:1px 0;">
                <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${p.color};margin-right:6px;"></span>
                <span>${p.seriesName}</span>
                <span style="margin-left:8px;color:#374151;">${ratio}</span>
              </div>`
            }).join('')
            return `
              <div style="text-align:left;">
                <div style="font-size:13px;font-weight:bold;color:#111827;margin-bottom:4px;">
                  ${title}
                </div>
                ${lines}
              </div>
            `
          }
        },
        legend: {
          type: 'scroll',
          bottom: 4,
          left: 8,
          right: 8,
          textStyle: {
            color: '#4b5563',
            fontSize: 11
          }
        },
        grid: {
          left: '5%',
          right: '15%',
          top: '15%',
          bottom: '12%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          data: xLabels,
          boundaryGap: false,
          axisLabel: {
            rotate: 35,
            interval: 0,
            color: '#4b5563',
            fontSize: 10,
            // 语言维度时，只显示标签最后四位
            formatter: value => {
              if (activeDim === 'method' && typeof value === 'string') {
                return value.slice(-4)
              }
              return value
            }
          },
          axisLine: {
            lineStyle: {
              color: '#9ca3af'
            }
          },
          axisTick: {
            lineStyle: {
              color: '#d1d5db'
            }
          },
          name: activeDim === 'time'
            ? '周数'
            : activeDim === 'knowledge'
              ? '知识点'
              : '编程语言',
          nameLocation: 'end',
          nameGap: 10,
          nameTextStyle: {
            color: '#374151',
            fontSize: 12
          }
        },
        yAxis: {
          type: 'value',
          min: 0,
          max: this.activeDimension === 'time' ? 70 : 40,
          axisLabel: {
            formatter: '{value} %',
            color: '#4b5563',
            fontSize: 10
          },
          axisLine: {
            lineStyle: {
              color: '#9ca3af'
            }
          },
          axisTick: {
            lineStyle: {
              color: '#d1d5db'
            }
          },
          splitLine: {
            lineStyle: {
              color: '#e5e7eb',
              type: 'dashed'
            }
          },
          name: '答题状态占比 (%)',
          nameLocation: 'end',
          nameGap: 10,
          nameTextStyle: {
            color: '#374151',
            fontSize: 12
          }
        },
        series
      }

      this.chart.setOption(option)
      window.addEventListener('resize', this.handleResize)
    },
    handleResize() {
      if (this.chart) {
        this.chart.resize()
      }
    }
  }
}
</script>

<style scoped>
.pink-state-trends {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: visible;
}

.pink-state-trends::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: 
    radial-gradient(circle at 20% 30%, rgba(148, 163, 184, 0.25) 0%, transparent 55%),
    radial-gradient(circle at 80% 80%, rgba(209, 213, 219, 0.35) 0%, transparent 60%);
  pointer-events: none;
  z-index: 0;
}

.header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 10px 0 10px;
  position: relative;
  z-index: 1;
}

.pink-state-trends h3 {
  margin: 0;
  font-size: 12px;
  color: #111827;
}

.dimension-tabs {
  display: flex;
  gap: 4px;
}

.tab-btn {
  border: 1px solid #d1d5db;
  background-color: #f9fafb;
  color: #4b5563;
  border-radius: 999px;
  padding: 2px 8px;
  font-size: 10px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.tab-btn.active {
  background-color: #111827;
  color: #f9fafb;
  border-color: #111827;
}

.tab-btn:hover {
  background-color: #e5e7eb;
}

.chart-container {
  flex: 1;
  min-height: 0;
  width: 100%;
  height: 100%;
  position: relative;
  z-index: 1;
}

.loading,
.error {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: #6b7280;
  position: relative;
  z-index: 1;
}

.error {
  color: #b91c1c;
}
</style>