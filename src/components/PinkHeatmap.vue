<template>
  <div class="pink-heatmap">
    <h3>题目匹配度</h3>
    <div v-if="loading" class="loading">加载中...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else ref="chartContainer" class="chart-container"></div>
  </div>
</template>

<script>
import axios from 'axios'
import echarts from '@/utils/echarts'

export default {
  name: 'PinkHeatmap',
  data() {
    return {
      loading: true,
      error: null,
      chart: null,
      apiBaseUrl: 'http://127.0.0.1:5000/api',
      // 纵向可视窗口控制，用于手动实现“上下翻动”
      visibleStart: 0,
      visibleCount: 7,
      fullYAxisLabels: [],
      fullSeriesData: []
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
        // 调用后端粉色视图一接口
        const response = await axios.get(`${this.apiBaseUrl}/pink/heatmap`)
        const data = response.data
        this.loading = false
        await this.$nextTick()
        this.renderChart(data)
      } catch (err) {
        console.error('加载热力图数据失败:', err)
        this.error = '加载热力图数据失败，请检查后端服务是否运行'
        this.loading = false
      }
    },
    renderChart(data) {
      if (!this.$refs.chartContainer) return

      if (this.chart) {
        this.chart.dispose()
      }

      this.chart = echarts.init(this.$refs.chartContainer)

      const xAxisLabels = data?.heatedConfig?.xAxisLabels || []
      const xAxisLabelsCode = data?.heatedConfig?.xAxisLabelsCode || []
      const yAxisLabels = data?.heatedConfig?.yAxisLabels || []
      const rawCoreData = data?.heatmapCoreData || []
      
      // 创建知识点编码到名称的映射
      const knowledgeNameMap = {}
      xAxisLabelsCode.forEach((code, idx) => {
        knowledgeNameMap[code] = xAxisLabels[idx] || code
      })

      const seriesData = rawCoreData.map(row => {
        const [
          xIndex,
          yIndex,
          aliasTitle,
          titleId,
          knowledge,
          subKnowledge,
          matchIndex,
          correctRate,
          discrimination
        ] = row

        return {
          value: [xIndex, yIndex, matchIndex || 0],
          meta: {
            qAlias: aliasTitle || '',
            titleId: titleId || '',
            knowledge: knowledge || '',
            subKnowledge: subKnowledge || '',
            matchIndex: matchIndex || 0,
            correctRate: correctRate ?? 0,
            discrimination: discrimination ?? 0,
            isEmpty: false
          }
        }
      })

      // 补齐没有数据的格子：用浅绿色（交错深浅）填充，保证热力图是规则矩阵
      const existingKeys = new Set(
        seriesData.map(item => `${item.value[0]}-${item.value[1]}`)
      )
      for (let yi = 0; yi < yAxisLabels.length; yi++) {
        for (let xi = 0; xi < xAxisLabels.length; xi++) {
          const key = `${xi}-${yi}`
          if (existingKeys.has(key)) continue
          const isEven = (xi + yi) % 2 === 0
          const bgColor = isEven ? '#d8f3dc' : '#b7e4c7' // 更浅和稍深的绿色交错
          seriesData.push({
            value: [xi, yi, 0],
            meta: {
              qAlias: yAxisLabels[yi] || '',
              titleId: '',
              knowledge: xAxisLabels[xi] || '',
              subKnowledge: '',
              matchIndex: 0,
              correctRate: null,
              discrimination: null,
              isEmpty: true
            },
            itemStyle: {
              color: bgColor
            }
          })
        }
      }

      const maxMatch = seriesData.reduce(
        (max, item) => Math.max(max, item.meta.matchIndex || 0),
        0
      ) || 10

      // 保存完整数据，用于后续滚动窗口更新
      this.fullYAxisLabels = yAxisLabels
      this.fullSeriesData = seriesData

      const option = {
        backgroundColor: '#f9fafb',
        tooltip: {
          trigger: 'item',
          confine: false,
          position: function(point, params, dom, rect, size) {
            return [point[0] + 20, point[1] - size.contentSize[1] / 2]
          },
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
            const meta = params.data.meta || {}
            // 无数据的格子：不显示任何 tooltip
            if (meta.isEmpty) {
              return ''
            }
            const correctRate = meta.correctRate != null ? `${meta.correctRate}%` : 'N/A'
            const discrimination =
              meta.discrimination != null ? meta.discrimination.toFixed(2) : 'N/A'
            const knowledgeName = knowledgeNameMap[meta.knowledge] || meta.knowledge || '未知'
            return `
              <div style="text-align:left;">
                <div style="font-size:14px;font-weight:bold;color:#1f2937;margin-bottom:4px;">
                  题目：${meta.qAlias || meta.titleId || '未知'}
                </div>
                <div>题目ID：${meta.titleId || '未知'}</div>
                <div>知识点：${knowledgeName}</div>
                <div>子知识点：${meta.subKnowledge || '无'}</div>
                <div>匹配度：${meta.matchIndex} / 10</div>
                <div>正确率：${correctRate}</div>
                <div>区分度：${discrimination}</div>
              </div>
            `
          }
        },
        grid: {
          left: '6%',
          right: '20%',
          top: '20%',   
          bottom: '3%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          data: xAxisLabels,
          position: 'bottom', 
          axisLabel: {
            rotate: 45,
            interval: 0,
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
          name: '知识点',
          nameLocation: 'end',
          nameGap: 10,
          nameTextStyle: {
            color: '#374151',
            fontSize: 12
          }
        },
        yAxis: {
          type: 'category',
          data: yAxisLabels, // 初始先用完整标签，稍后用 applyVisibleWindow 截取
          axisLabel: {
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
          name: '题目 ID',
          nameLocation: 'end',
          nameTextStyle: {
            color: '#374151',
            fontSize: 12
          }
        },
        visualMap: {
          min: 0,
          max: maxMatch,
          orient: 'vertical',
          right: 0,
          top: 'top',
          calculable: false,
          itemWidth: 10,
          itemHeight: 70,
          text: ['高匹配', '低匹配'],
          textStyle: {
            color: '#4b5563',
            fontSize: 10
          },
          // 低匹配：蓝色，高匹配：绿色
          inRange: {
            color: ['#4fc3f7', '#26a69a', '#66bb6a']
          }
        },
        series: [
          {
            name: '题目匹配度',
            type: 'heatmap',
            data: seriesData,
            label: {
              show: true,
              color: '#ffffff',
              fontSize: 9,
              formatter: params => {
                const meta = params.data.meta || {}
                // 无数据的格子不显示数字
                if (meta.isEmpty) {
                  return ''
                }
                return meta.matchIndex
              }
            },
            emphasis: {
              itemStyle: {
                shadowBlur: 10,
                shadowColor: 'rgba(255, 255, 255, 0.7)'
              }
            }
          }
        ]
      }

      this.chart.setOption(option)

      // 初始化可视窗口：按题目索引截取一部分，让方格更大
      this.visibleStart = 0
      this.visibleCount = Math.min(this.visibleCount, this.fullYAxisLabels.length || this.visibleCount)
      this.applyVisibleWindow()

      // 监听鼠标滚轮，实现组件内部上下翻动
      const zr = this.chart.getZr()
      zr.off('mousewheel')
      zr.on('mousewheel', params => {
        const delta = params.event.wheelDelta || -params.event.deltaY || 0
        if (!delta) return
        const direction = delta < 0 ? 1 : -1 // 向下滚：显示后面的题目
        const total = this.fullYAxisLabels.length
        if (!total) return
        const maxStart = Math.max(0, total - this.visibleCount)
        const nextStart = Math.min(maxStart, Math.max(0, this.visibleStart + direction))
        if (nextStart === this.visibleStart) return
        this.visibleStart = nextStart
        this.applyVisibleWindow()
      })
      window.addEventListener('resize', this.handleResize)
    },
    applyVisibleWindow() {
      if (!this.chart || !this.fullYAxisLabels.length) return
      const total = this.fullYAxisLabels.length
      const count = Math.min(this.visibleCount, total)
      const maxStart = Math.max(0, total - count)
      const start = Math.min(this.visibleStart, maxStart)
      const end = start + count

      const visibleY = this.fullYAxisLabels.slice(start, end)
      const visibleSeries = this.fullSeriesData
        .filter(item => {
          const y = item.value[1]
          return y >= start && y < end
        })
        .map(item => {
          const [xIdx, yIdx, matchVal] = item.value
          return {
            ...item,
            value: [xIdx, yIdx - start, matchVal]
          }
        })
      const currentOption = this.chart.getOption()
      const baseSeries = (currentOption.series && currentOption.series[0]) || {}

      this.chart.setOption({
        yAxis: {
          data: visibleY
        },
        series: [
          {
            ...baseSeries,
            data: visibleSeries
          }
        ]
      },
    false )
    },
  }
}
</script>

<style scoped>
.pink-heatmap {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #f9fafb 0%, #e5e7eb 100%);
  position: relative;
  overflow: visible;
}

.pink-heatmap::before {
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

.pink-heatmap h3 {
  margin: 0;
  padding: 8px 15px;
  font-size: 12px;
  color: #111827;
  text-shadow: none;
  position: relative;
  z-index: 1;
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
  color: #b0b0b0;
  position: relative;
  z-index: 1;
}

.error {
  color: #ff6b6b;
}
</style>