<template>
  <div class="pink-bubbles">
    <h3>题目综合表现</h3>
    <div v-if="loading" class="loading">加载中...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else ref="chartContainer" class="chart-container"></div>
  </div>
</template>

<script>
import axios from 'axios'
import echarts from '@/utils/echarts'

export default {
  name: 'PinkBubbles',
  data() {
    return {
      loading: true,
      error: null,
      chart: null,
      apiBaseUrl: 'http://127.0.0.1:5000/api'
    }
  },
  mounted() {
    this.loadData()
  },
  beforeUnmount() {
    if (this.chart) {
      this.chart.dispose()
    }
  },
  methods: {
    async loadData() {
      try {
        this.loading = true
        this.error = null
        //发送GET请求
        const response = await axios.get(`${this.apiBaseUrl}/pink/bubbles`)
        //提取响应数据
        const data = response.data
        //先设置loading为false，让chartContainer渲染
        this.loading = false
        //等待DOM更新后再渲染图表
        await this.$nextTick()
        //数据加载成功，渲染图表
        this.renderChart(data)
      } catch (error) {
        console.error('加载气泡图数据失败:', error)
        this.error = '加载数据失败，请检查后端服务是否运行'
        this.loading = false
      }
    },
    renderChart(data) {
      if (!this.$refs.chartContainer) return
      console.log('后端返回完整数据:', data);
      console.log('bubbleData 字段检查:', data.bubbleData?.[0] || '无数据');
      if (this.chart) {
        this.chart.dispose()
      }
      //初始化图表，绑定到图表容器上
      this.chart = echarts.init(this.$refs.chartContainer)

      //解构后端数据
      //气泡图数据
      const bubbleData = data.bubbleData || []
      //知识维度标签（名称，用于显示）
      const xAxisLabels = data.xAxisLabels || []
      //知识维度编码（用于查找索引）
      const xAxisLabelsCode = data.xAxisLabelsCode || xAxisLabels

      // 计算提交次数的最大值，用于颜色映射
      const maxSubmissionCount = Math.max(
        ...bubbleData.map(item => item.submission_count || 0),
        1
      )

      // 构建单个系列数据，不再按知识点分组
      const seriesData = bubbleData.map(item => {
        const knowledge = item.knowledge || '未知'
        // 使用编码查找索引
        const knowledgeIndex = xAxisLabelsCode.indexOf(knowledge)
        const x = knowledgeIndex >= 0 ? knowledgeIndex : 0
        return [
          x, // x: 知识维度索引
          item.comprehensive_efficiency || 0, // y: 综合效率
          item.score || 0, // 气泡大小：题目分值
          item.submission_count || 0, // 气泡颜色：提交次数
          item // 原始数据：用于hover提示
        ]
      })

      // 构建单个系列
      const series = [{
        name: '题目数据',
        type: 'scatter',
        xAxisIndex: 0,
        yAxisIndex: 0,
        data: seriesData,
        symbolSize: function(data) {
          // 根据题目分值调整气泡大小
          const score = data[2] || 1 //默认1
          return Math.max(10, Math.min(60, score * 8))//像素范围
        },
        itemStyle: {
          opacity: 0.8,
          shadowBlur: 10,
          shadowColor: 'rgba(0, 0, 0, 0.2)'
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 20,
            shadowColor: 'rgba(255, 255, 255, 0.8)'
          }
        }
      }]

      //构建图表配置
      const option = {
        backgroundColor: '#f9fafb',
        //hover文本提示框
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
          boxShadow: '0 0 20px rgba(100, 150, 255, 0.3)',
          textStyle: {
            color: '#111827',
            fontSize: 12
          },
          formatter: function(params) {
            const item = params.data[4]
            return `
              <div style="text-align:left;">
                <strong style="color: #64b5f6; font-size: 14px;">${item.title_ID}</strong><br/>
                知识点: ${item.knowledge_name || item.knowledge || '未知'}<br/>
                平均用时: ${item.timeconsume || 'N/A'} ms<br/>
                平均内存: ${item.memory || 'N/A'} KB<br/>
                总提交量: ${item.submission_count || 0} 次<br/>
                题目分值: ${item.score || 0} 分<br/>
                综合效率: ${item.comprehensive_efficiency || 0}%
              </div>
            `
          }
        },
        // 颜色映射组件（右侧图例）
        visualMap: {
          min: 3000,
          max: maxSubmissionCount,
          dimension: 3,
          right: 1,
          top: 'top',
          precision: 0,         
          inRange: {
            color: [
              '#4fc3f7', // 蓝色
              '#26a69a', // 青绿色
              '#66bb6a', // 绿色
              '#ffa726', // 橙色
              '#ff7043', // 橙红色
              '#e53935'  // 红色
            ]
          },
          text: [maxSubmissionCount.toLocaleString(), '3000'],
          textStyle: {
            color: '#4b5563',
            fontSize: 9
          },
          itemWidth: 10,
          itemHeight: 70,
          formatter: function(value) {
            return Math.round(value).toLocaleString()
          }
        },
        grid: {
          left: '8%',
          right: '18%',
          top: '15%',
          bottom: '5%',
          containLabel: true
        },
        //横坐标
        xAxis: {
          type: 'category',
          data: xAxisLabels,
          axisLabel: {
            rotate: 45,
            interval: 0,
            color: '#4b5563',
            fontSize: 11
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
          nameTextStyle: {
            color: '#374151',
            fontSize: 12
          }
        },
        yAxis: {
          type: 'value',
          name: '综合效率 (%)',
          nameLocation: 'end',
          nameGap: 10,
          min: 30,
          max: 220,
          axisLabel: {
            color: '#4b5563',
            fontSize: 11
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
              color: '#2d3748',
              type: 'dashed'
            }
          },
          nameTextStyle: {
            color: '#374151',
            fontSize: 12
          }
        },
        series: series
      }

      this.chart.setOption(option)

      // 响应式调整
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
.pink-bubbles {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: visible;
}

.pink-bubbles::before {
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

.pink-bubbles h3 {
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
  position: relative;
  z-index: 1;
  width: 100%;
  height: 100%;
  overflow: visible;
}

.loading, .error {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #b0b0b0;
  position: relative;
  z-index: 1;
}

.error {
  color: #ff6b6b;
}
</style>
