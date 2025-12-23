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
        v-for="tab in tabs" 
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
      
      <!-- 无数据提示 -->
      <div v-else-if="!loading && !error && !hasAnyData" class="empty-state">
        <p>暂无数据</p>
      </div>
      
      <!-- 图表内容 -->
      <div v-else class="chart-container">
        <!-- Tab 1: 基础特征 - 雷达图 -->
        <div v-show="currentTab === 'basic_features'" class="chart-panel">
          <div ref="basicFeaturesChart" class="chart-content"></div>
        </div>

        <!-- Tab 2: 学习模式 - 散点图 -->
        <div v-show="currentTab === 'scatter'" class="chart-panel">
          <div ref="scatterChart" class="chart-content"></div>
        </div>

        <!-- Tab 3: 编程方法 - 饼图 -->
        <div v-show="currentTab === 'method'" class="chart-panel">
          <div ref="methodChart" class="chart-content"></div>
        </div>

        <!-- Tab 4: 知识点 - 树状图/柱状图 -->
        <div v-show="currentTab === 'knowledge'" class="chart-panel">
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
        { key: 'scatter', label: '学习模式' },
        { key: 'method', label: '编程方法' },
        { key: 'knowledge', label: '知识点' }
      ],
      chartInstances: {},
      chartData: {
        basicFeatures: null,
        scatter: null,
        method: null,
        knowledge: null
      },
      loading: false,
      error: null
    }
  },
  computed: {
    hasAnyData() {
      // 检查是否有任何有效数据 - 简化判断逻辑
      // 只要有 basicFeatures 对象（即使值为0）就认为有数据
      const hasBasicFeatures = this.chartData.basicFeatures && 
        typeof this.chartData.basicFeatures === 'object' &&
        this.chartData.basicFeatures !== null &&
        Object.keys(this.chartData.basicFeatures).length > 0
      
      const hasScatter = this.chartData.scatter && 
        Array.isArray(this.chartData.scatter) && 
        this.chartData.scatter.length > 0
      
      const hasMethod = this.chartData.method && 
        this.chartData.method.method_distribution && 
        Array.isArray(this.chartData.method.method_distribution) &&
        this.chartData.method.method_distribution.length > 0
      
      const hasKnowledge = this.chartData.knowledge && 
        this.chartData.knowledge.knowledge_stats && 
        Array.isArray(this.chartData.knowledge.knowledge_stats) &&
        this.chartData.knowledge.knowledge_stats.length > 0
      
      const result = hasBasicFeatures || hasScatter || hasMethod || hasKnowledge
      
      console.log('BlueBox1 hasAnyData 检查:', {
        result,
        hasBasicFeatures,
        hasScatter,
        hasMethod,
        hasKnowledge,
        basicFeatures: this.chartData.basicFeatures,
        basicFeaturesKeys: this.chartData.basicFeatures ? Object.keys(this.chartData.basicFeatures) : [],
        scatter: this.chartData.scatter,
        method: this.chartData.method,
        knowledge: this.chartData.knowledge
      })
      
      return result
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
        this.loading = false
        // 清空数据
        this.chartData.basicFeatures = null
        this.chartData.scatter = null
        this.chartData.method = null
        this.chartData.knowledge = null
        return
      }
      
      this.loading = true
      this.error = null
      
      try {
        const params = {}
        if (this.studentId) {
          params.student_id = this.studentId
          console.log('BlueBox1: 加载学生数据, student_id:', this.studentId)
        } else if (this.className) {
          params.class_name = this.className
          console.log('BlueBox1: 加载班级数据, class_name:', this.className)
        }
        if (this.selectedMonth) params.month = this.selectedMonth

        // 一次性获取所有Tab的数据
        const response = await axios.get(`${API_BASE_URL}/learning-profile/comprehensive-bluebox1`, { params })
        const data = response.data

        console.log('BlueBox1: 接收到的数据:', data)
        console.log('BlueBox1: tab1_basic_features:', data.tab1_basic_features)
        console.log('BlueBox1: tab2_scatter_data:', data.tab2_scatter_data)
        console.log('BlueBox1: tab3_method_preference:', data.tab3_method_preference)
        console.log('BlueBox1: tab4_knowledge_mastery:', data.tab4_knowledge_mastery)

        // 确保数据被正确设置，即使值为0或空对象
        this.chartData.basicFeatures = data.tab1_basic_features || null
        this.chartData.scatter = data.tab2_scatter_data || null
        this.chartData.method = data.tab3_method_preference || null
        this.chartData.knowledge = data.tab4_knowledge_mastery || null

        console.log('BlueBox1: 设置后的chartData:', this.chartData)
        console.log('BlueBox1: basicFeatures类型:', typeof this.chartData.basicFeatures)
        console.log('BlueBox1: basicFeatures是否为null:', this.chartData.basicFeatures === null)
        console.log('BlueBox1: basicFeatures键:', this.chartData.basicFeatures ? Object.keys(this.chartData.basicFeatures) : 'null')
        console.log('BlueBox1: hasAnyData:', this.hasAnyData)

        // 延迟渲染，确保DOM已更新
        this.$nextTick(() => {
          // 只渲染当前显示的图表
          try {
            // 统一延迟，确保容器可见后再渲染
            setTimeout(() => {
              this.renderChart(this.currentTab)
            }, 150)
          } catch (e) {
            console.error('BlueBox1: 渲染图表失败:', e)
          }
        })
      } catch (error) {
        console.error('BlueBox1: 加载数据失败:', error)
        console.error('BlueBox1: 错误详情:', error.response?.data)
        this.error = error.response?.data?.error || error.message || '加载数据失败，请稍后重试'
        // 清空数据
        this.chartData.basicFeatures = null
        this.chartData.scatter = null
        this.chartData.method = null
        this.chartData.knowledge = null
      } finally {
        this.loading = false
      }
    },
    switchTab(tabKey) {
      this.currentTab = tabKey
      // 延迟渲染，确保v-show已生效，容器可见
      this.$nextTick(() => {
        // 增加延迟时间，确保容器完全可见后再渲染
        setTimeout(() => {
          this.renderChart(tabKey)
        }, 150)
      })
    },
    handleFilter() {
      this.loadData()
      this.$emit('month-change', this.selectedMonth)
    },
    handleReset() {
      this.selectedMonth = ''
      // 销毁所有图表实例，确保重置后重新创建
      Object.keys(this.chartInstances).forEach(key => {
        if (this.chartInstances[key]) {
          try {
            this.chartInstances[key].dispose()
          } catch (e) {
            // 忽略dispose错误
          }
          this.chartInstances[key] = null
        }
      })
      this.loadData()
      this.$emit('month-change', '')
    },
    renderChart(tabKey) {
      // 确保 DOM 元素可见后再渲染
      this.$nextTick(() => {
        // 对于基础特征，需要额外等待确保容器可见
        if (tabKey === 'basic_features') {
          setTimeout(() => {
            try {
              this.renderBasicFeaturesChart()
            } catch (e) {
              console.error(`BlueBox1: 渲染${tabKey}图表失败:`, e)
            }
          }, 100)
        } else {
          // 对于其他图表，也需要等待容器可见
          setTimeout(() => {
            try {
              switch (tabKey) {
                case 'scatter':
                  this.renderScatterChart()
                  break
                case 'method':
                  this.renderMethodChart()
                  break
                case 'knowledge':
                  this.renderKnowledgeChart()
                  break
              }
            } catch (e) {
              console.error(`BlueBox1: 渲染${tabKey}图表失败:`, e)
            }
          }, 100)
        }
      })
    },
    renderBasicFeaturesChart() {
      console.log('BlueBox1: renderBasicFeaturesChart 被调用')
      
      if (!this.chartData.basicFeatures || typeof this.chartData.basicFeatures !== 'object') {
        console.log('BlueBox1: 基础特征数据为空或无效')
        return
      }
      
      // 检查数据是否有效（至少有一个字段存在）
      if (this.chartData.basicFeatures.submit_count === undefined && 
          this.chartData.basicFeatures.active_days === undefined &&
          this.chartData.basicFeatures.question_count === undefined &&
          this.chartData.basicFeatures.correct_ratio === undefined) {
        console.log('BlueBox1: 基础特征数据无效')
        return
      }
      
      // 确保当前Tab是基础特征
      if (this.currentTab !== 'basic_features') {
        console.log('BlueBox1: 当前Tab不是基础特征，跳过渲染。当前Tab:', this.currentTab)
        return
      }
      
      console.log('BlueBox1: 通过所有检查，开始渲染')
      
      const ref = this.$refs.basicFeaturesChart
      if (!ref) {
        console.log('BlueBox1: 基础特征图表容器不存在，延迟重试')
        setTimeout(() => this.renderBasicFeaturesChart(), 100)
        return
      }
      
      const data = this.chartData.basicFeatures
      console.log('BlueBox1: 渲染基础特征图表, 数据:', data)
      
      // 检查父容器（chart-panel）的可见性
      const panel = ref.parentElement
      const panelStyle = panel ? window.getComputedStyle(panel) : null
      const refStyle = window.getComputedStyle(ref)
      
      // 强制显示容器，确保可见
      if (panel && panelStyle) {
        if (panelStyle.display === 'none') {
          console.log('BlueBox1: 父容器被隐藏，强制显示')
          panel.style.display = 'block'
        }
        if (panelStyle.visibility === 'hidden') {
          panel.style.visibility = 'visible'
        }
        // 确保父容器有正确的尺寸
        if (panel.offsetWidth === 0 || panel.offsetHeight === 0) {
          panel.style.width = '100%'
          panel.style.height = '100%'
        }
      }
      if (refStyle.display === 'none') {
        ref.style.display = 'block'
      }
      if (refStyle.visibility === 'hidden') {
        ref.style.visibility = 'visible'
      }
      
      // 确保容器有正确的尺寸和可见性
      if (ref.offsetWidth === 0 || ref.offsetHeight === 0) {
        ref.style.width = '100%'
        ref.style.height = '100%'
        ref.style.minHeight = '400px'
        ref.style.minWidth = '400px'
        console.log('BlueBox1: 容器尺寸为0，已强制设置尺寸')
      }
      
      // 强制设置容器尺寸，确保有最小尺寸
      if (ref.offsetWidth === 0 || ref.offsetHeight === 0) {
        ref.style.width = '100%'
        ref.style.height = '100%'
        ref.style.minHeight = '400px'
        ref.style.minWidth = '400px'
        console.log('BlueBox1: 容器尺寸为0，已强制设置最小尺寸')
      }
      
      // 强制输出容器信息，无论尺寸如何 - 必须在setOption之前输出
      const containerInfo = {
        refWidth: ref.offsetWidth,
        refHeight: ref.offsetHeight,
        refClientWidth: ref.clientWidth,
        refClientHeight: ref.clientHeight,
        refDisplay: refStyle.display,
        refVisibility: refStyle.visibility,
        panelDisplay: panelStyle ? panelStyle.display : 'N/A',
        panelVisibility: panelStyle ? panelStyle.visibility : 'N/A',
        currentTab: this.currentTab,
        panelExists: !!panel,
        refStyleWidth: ref.style.width,
        refStyleHeight: ref.style.height,
        timestamp: new Date().toISOString()
      }
      console.log('BlueBox1: 容器信息 (在setOption之前):', containerInfo)
      
      // 如果容器尺寸为0，强制设置尺寸并继续渲染（不返回）
      if (ref.offsetWidth === 0 || ref.offsetHeight === 0) {
        console.warn('BlueBox1: 容器尺寸为0，强制设置最小尺寸并继续渲染')
        // 强制设置容器尺寸
        ref.style.width = '100%'
        ref.style.height = '100%'
        ref.style.minHeight = '400px'
        ref.style.minWidth = '400px'
        // 等待一帧后继续，但不返回
        this.$nextTick(() => {
          // 如果尺寸仍为0，使用固定尺寸
          if (ref.offsetWidth === 0 || ref.offsetHeight === 0) {
            ref.style.width = '600px'
            ref.style.height = '400px'
            console.log('BlueBox1: 使用固定尺寸:', { width: 600, height: 400 })
          }
        })
      }
      
      // 如果图表实例已存在，先检查是否需要重新创建
      // 为了确保数据更新时图表正确显示，每次数据更新时都重新创建实例
      if (this.chartInstances.basicFeatures) {
        try {
          // 检查图表实例是否仍然有效
          const isDisposed = this.chartInstances.basicFeatures.isDisposed && this.chartInstances.basicFeatures.isDisposed()
          if (isDisposed) {
            this.chartInstances.basicFeatures = null
          } else {
            // 图表实例仍然有效，但为了确保数据更新时正确显示，先销毁再重新创建
            console.log('BlueBox1: 销毁现有基础特征图表实例，准备重新创建')
            try {
              this.chartInstances.basicFeatures.dispose()
            } catch (disposeError) {
              // 忽略dispose错误
            }
            this.chartInstances.basicFeatures = null
          }
        } catch (e) {
          // 如果检查失败，重新创建
          try {
            this.chartInstances.basicFeatures.dispose()
          } catch (disposeError) {
            // 忽略dispose错误
          }
          this.chartInstances.basicFeatures = null
        }
      }
      
      // 如果图表实例不存在，创建新实例
      if (!this.chartInstances.basicFeatures) {
        try {
          // 确保容器有有效尺寸
          const width = ref.offsetWidth || ref.clientWidth || 600
          const height = ref.offsetHeight || ref.clientHeight || 400
          
          // 如果容器尺寸仍为0，强制设置
          if (ref.offsetWidth === 0 || ref.offsetHeight === 0) {
            ref.style.width = width + 'px'
            ref.style.height = height + 'px'
            console.log('BlueBox1: 强制设置容器尺寸:', { width, height })
          }
          
          this.chartInstances.basicFeatures = echarts.init(ref)
          console.log('BlueBox1: 基础特征图表实例已创建', {
            containerWidth: ref.offsetWidth,
            containerHeight: ref.offsetHeight,
            chartWidth: this.chartInstances.basicFeatures.getWidth(),
            chartHeight: this.chartInstances.basicFeatures.getHeight()
          })
        } catch (e) {
          console.error('BlueBox1: 创建基础特征图表实例失败:', e)
          return
        }
      }

      // 定义指标名称数组，用于tooltip显示
      const indicatorNames = ['提交次数', '活跃天数', '答题数', '正确占比']
      
      const option = {
        tooltip: {
          trigger: 'item',
          confine: false,
          appendToBody: true,
          extraCssText: 'z-index: 9999;',
          showContent: true,
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          borderColor: '#ccc',
          borderWidth: 1,
          textStyle: {
            color: '#333'
          },
          // 使用 HTML 渲染模式，完全自定义 tooltip
          renderMode: 'html',
          showDelay: 0,
          hideDelay: 0,
          enterable: false,
          formatter: function(params) {
            if (!params) return ''
            if (params.seriesType === 'radar' && params.data && params.data.value) {
              let result = '<div style="padding: 5px;">'
              result += '<strong>' + (params.name || '') + '</strong><br/>'
              if (Array.isArray(params.data.value)) {
                params.data.value.forEach((val, idx) => {
                  const indicatorName = indicatorNames[idx] || `指标${idx + 1}`
                  result += indicatorName + ': ' + (typeof val === 'number' ? val.toFixed(2) : val) + '<br/>'
                })
              }
              result += '</div>'
              return result
            }
            return '<div style="padding: 5px;">' + (params.name || '') + ': ' + (params.value || '') + '</div>'
          }
        },
        radar: {
          indicator: [
            { 
              name: '提交次数', 
              max: Math.max((data.submit_count || 0), (data.comparison?.submit_count_avg || 0), 1) * 1.2,
              splitNumber: 5
            },
            { 
              name: '活跃天数', 
              max: Math.max((data.active_days || 0), (data.comparison?.active_days_avg || 0), 1) * 1.2,
              splitNumber: 5
            },
            { 
              name: '答题数', 
              max: Math.max((data.question_count || 0), (data.comparison?.question_count_avg || 0), 1) * 1.2,
              splitNumber: 5
            },
            { 
              name: '正确占比', 
              max: 1,
              splitNumber: 5
            }
          ],
          center: ['50%', '55%'],
          radius: '70%',
          axisName: {
            show: true
          },
          splitArea: {
            show: true
          },
          splitLine: {
            show: true
          },
          splitNumber: 5
        },
        series: [{
          type: 'radar',
          name: '基础特征',
          z: 2,
          // 确保系列级别的样式配置完整
          itemStyle: {
            color: '#ff7f00',
            borderColor: '#ff7f00',
            borderWidth: 2
          },
          lineStyle: {
            color: '#ff7f00',
            width: 2,
            type: 'dashed'
          },
          areaStyle: {
            color: 'rgba(255, 127, 0, 0.3)',
            opacity: 0.3
          },
          emphasis: {
            itemStyle: {
              color: '#ff7f00',
              borderColor: '#ff7f00',
              borderWidth: 2
            },
            lineStyle: {
              color: '#ff7f00',
              width: 3
            },
            areaStyle: {
              color: 'rgba(255, 127, 0, 0.5)',
              opacity: 0.5
            }
          },
          data: [
            {
              value: [
                data.submit_count || 0,
                data.active_days || 0,
                data.question_count || 0,
                data.correct_ratio || 0
              ],
              name: this.studentId || this.className || '当前',
              symbol: 'circle',
              symbolSize: 6,
              itemStyle: {
                color: '#ff7f00',
                borderColor: '#ff7f00',
                borderWidth: 2
              },
              lineStyle: {
                color: '#ff7f00',
                width: 2,
                type: 'dashed'
              },
              areaStyle: {
                color: 'rgba(255, 127, 0, 0.3)',
                opacity: 0.3
              }
            },
            {
              value: [
                data.comparison?.submit_count_avg || 0,
                data.comparison?.active_days_avg || 0,
                data.comparison?.question_count_avg || 0,
                data.comparison?.correct_ratio_avg || 0
              ],
              name: '平均值',
              symbol: 'circle',
              symbolSize: 6,
              itemStyle: {
                color: '#1e90ff',
                borderColor: '#1e90ff',
                borderWidth: 2
              },
              lineStyle: {
                color: '#1e90ff',
                width: 2
              },
              areaStyle: {
                color: 'rgba(30, 144, 255, 0.2)',
                opacity: 0.2
              }
            }
          ]
        }]
      }
      
      try {
        if (!this.chartInstances.basicFeatures) {
          console.error('BlueBox1: 图表实例不存在，无法设置选项')
          return
        }
        
        // 再次检查容器尺寸，确保容器可见
        if (ref.offsetWidth === 0 || ref.offsetHeight === 0) {
          console.log('BlueBox1: 设置选项前容器尺寸为0，延迟设置')
          setTimeout(() => {
            if (this.chartInstances.basicFeatures && ref.offsetWidth > 0 && ref.offsetHeight > 0) {
              this.chartInstances.basicFeatures.setOption(option, true)
              this.chartInstances.basicFeatures.resize()
            }
          }, 200)
          return
        }
        
        // 在setOption之前再次输出容器信息，确保能看到
        console.log('BlueBox1: setOption前的容器信息:', {
          refWidth: ref.offsetWidth,
          refHeight: ref.offsetHeight,
          refClientWidth: ref.clientWidth,
          refClientHeight: ref.clientHeight,
          chartInstanceExists: !!this.chartInstances.basicFeatures
        })
        
        // 设置图表选项，使用 notMerge: true 确保完全替换
        try {
          // 确保容器可见且有尺寸
          if (ref.offsetWidth === 0 || ref.offsetHeight === 0) {
            console.warn('BlueBox1: 容器尺寸为0，强制设置尺寸并延迟设置选项')
            ref.style.width = '100%'
            ref.style.height = '100%'
            ref.style.minHeight = '400px'
            ref.style.minWidth = '400px'
            // 等待一帧后继续设置选项
            setTimeout(() => {
              if (this.chartInstances.basicFeatures && ref.offsetWidth > 0 && ref.offsetHeight > 0) {
                this.chartInstances.basicFeatures.setOption(option, true)
                this.chartInstances.basicFeatures.resize()
                console.log('BlueBox1: 延迟设置选项成功')
              }
            }, 100)
            return
          }
          
          this.chartInstances.basicFeatures.setOption(option, true)
          console.log('BlueBox1: 基础特征图表设置成功')
          console.log('BlueBox1: 设置选项时容器尺寸:', { width: ref.offsetWidth, height: ref.offsetHeight })
          
          // 立即尝试一次 resize，确保图表可见
          try {
            if (ref.offsetWidth > 0 && ref.offsetHeight > 0) {
              this.chartInstances.basicFeatures.resize()
              console.log('BlueBox1: 立即resize成功')
            } else {
              console.warn('BlueBox1: 容器尺寸为0，无法立即resize')
            }
          } catch (resizeError) {
            console.warn('BlueBox1: 立即resize失败，将在nextTick中重试:', resizeError)
          }
        } catch (setOptionError) {
          console.error('BlueBox1: setOption失败:', setOptionError)
          throw setOptionError
        }
        
        // 确保图表大小正确，多次尝试resize
        this.$nextTick(() => {
          if (this.chartInstances.basicFeatures && ref) {
            try {
              const width = ref.offsetWidth || ref.clientWidth
              const height = ref.offsetHeight || ref.clientHeight
              
              console.log('BlueBox1: nextTick中容器尺寸:', { width, height })
              
              if (width > 0 && height > 0) {
                // 强制resize，确保图表正确显示
                this.chartInstances.basicFeatures.resize({
                  width: width,
                  height: height
                })
                console.log('BlueBox1: 基础特征图表resize成功', { width, height })
              } else {
                console.warn('BlueBox1: 容器尺寸仍为0，延迟resize')
                // 如果容器尺寸仍为0，强制设置一个最小尺寸
                ref.style.width = '100%'
                ref.style.height = '100%'
                ref.style.minHeight = '300px'
                
                setTimeout(() => {
                  if (this.chartInstances.basicFeatures && ref) {
                    const newWidth = ref.offsetWidth || ref.clientWidth || 600
                    const newHeight = ref.offsetHeight || ref.clientHeight || 400
                    this.chartInstances.basicFeatures.resize({
                      width: newWidth,
                      height: newHeight
                    })
                    console.log('BlueBox1: 强制resize成功', { width: newWidth, height: newHeight })
                  }
                }, 300)
              }
              
              // 再次延迟resize，确保DOM完全更新
              setTimeout(() => {
                if (this.chartInstances.basicFeatures && ref) {
                  try {
                    const finalWidth = ref.offsetWidth || ref.clientWidth
                    const finalHeight = ref.offsetHeight || ref.clientHeight
                    if (finalWidth > 0 && finalHeight > 0) {
                      this.chartInstances.basicFeatures.resize({
                        width: finalWidth,
                        height: finalHeight
                      })
                      console.log('BlueBox1: 延迟resize成功', { width: finalWidth, height: finalHeight })
                    }
                  } catch (e) {
                    console.error('BlueBox1: 延迟resize失败:', e)
                  }
                }
              }, 300)
            } catch (e) {
              console.error('BlueBox1: 基础特征图表resize失败:', e)
            }
          }
        })
      } catch (e) {
        console.error('BlueBox1: 设置基础特征图表失败:', e)
        console.error('BlueBox1: 错误详情:', e.stack)
      }
    },
    renderScatterChart() {
      if (!this.chartData.scatter || !Array.isArray(this.chartData.scatter) || this.chartData.scatter.length === 0) {
        console.log('BlueBox1: 散点图数据为空或无效')
        return
      }
      
      // 确保当前Tab是散点图
      if (this.currentTab !== 'scatter') {
        console.log('BlueBox1: 当前Tab不是散点图，跳过渲染。当前Tab:', this.currentTab)
        return
      }
      
      const ref = this.$refs.scatterChart
      if (!ref) {
        console.log('BlueBox1: 散点图容器不存在，延迟重试')
        setTimeout(() => this.renderScatterChart(), 100)
        return
      }
      
      // 检查容器是否可见且有尺寸
      const panel = ref.parentElement
      const panelStyle = panel ? window.getComputedStyle(panel) : null
      const refStyle = window.getComputedStyle(ref)
      
      // 确保容器可见
      if (panel && panelStyle) {
        if (panelStyle.display === 'none') {
          panel.style.display = 'block'
        }
        if (panelStyle.visibility === 'hidden') {
          panel.style.visibility = 'visible'
        }
      }
      if (refStyle.display === 'none') {
        ref.style.display = 'block'
      }
      if (refStyle.visibility === 'hidden') {
        ref.style.visibility = 'visible'
      }
      
      // 如果容器尺寸为0，等待容器可见
      if (ref.offsetWidth === 0 || ref.offsetHeight === 0) {
        console.log('BlueBox1: 散点图容器尺寸为0，延迟重试')
        setTimeout(() => this.renderScatterChart(), 100)
        return
      }
      
      // 如果图表实例已存在，先销毁再重新创建，确保数据更新
      if (this.chartInstances.scatter) {
        try {
          this.chartInstances.scatter.dispose()
        } catch (e) {
          // 忽略dispose错误
        }
        this.chartInstances.scatter = null
      }
      
      // 创建新的图表实例
      try {
        this.chartInstances.scatter = echarts.init(ref)
      } catch (e) {
        console.error('BlueBox1: 创建散点图实例失败:', e)
        return
      }

      const data = this.chartData.scatter
      
      // 判断是学生模式（柱状图）还是班级分布（散点图）
      // 如果数据包含 is_current_student 字段，说明是学生模式
      // 如果数据包含 student_id 字段，说明是班级模式（散点图）
      const isStudentMode = data.length > 0 && Object.prototype.hasOwnProperty.call(data[0], 'is_current_student')
      const isClassMode = data.length > 0 && Object.prototype.hasOwnProperty.call(data[0], 'student_id')
      
      console.log('BlueBox1 renderScatterChart: 数据判断', {
        dataLength: data.length,
        firstItem: data[0],
        isStudentMode,
        isClassMode,
        hasIsCurrentStudent: data.length > 0 && Object.prototype.hasOwnProperty.call(data[0], 'is_current_student'),
        hasStudentId: data.length > 0 && Object.prototype.hasOwnProperty.call(data[0], 'student_id')
      })
      
      // 学习模式颜色
      const patternColors = {
        '探索尝试型': '#32cd32',  // 绿色
        '广泛多样型': '#ffa500',  // 橙色
        '集中针对型': '#ff6347'   // 红色
      }
      
      if (isStudentMode) {
        // 学生模式：显示柱状图，展示该学生的学习模式
        const patternNames = data.map(item => item.pattern)
        const patternCounts = data.map(item => item.count)
        const colors = data.map(item => {
          if (item.is_current_student) {
            return patternColors[item.pattern] || '#1e90ff'
          }
          return '#d3d3d3' // 灰色表示非当前学生
        })
        
        const option = {
          tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'shadow' },
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
              const param = params[0]
              return `
                <div style="text-align:left; padding: 5px;">
                  <strong>学习模式: ${param.name || '未知'}</strong><br/>
                  ${param.value > 0 ? '✓ 当前学习模式' : '非当前学习模式'}
                </div>
              `
            }
          },
          grid: {
            left: '15%',
            right: '10%',
            bottom: '15%',
            top: '10%'
          },
          xAxis: {
            type: 'category',
            data: patternNames,
            axisLabel: {
              rotate: 0
            }
          },
          yAxis: {
            type: 'value',
            name: '是否匹配',
            min: 0,
            max: 1,
            axisLabel: {
              formatter: function(value) {
                return value === 1 ? '是' : '否'
              }
            }
          },
          series: [{
            name: '学习模式',
            type: 'bar',
            data: patternCounts.map((count, idx) => ({
              value: count,
              itemStyle: { color: colors[idx] }
            })),
            label: {
              show: true,
              position: 'top',
              formatter: function(params) {
                return params.value > 0 ? '当前模式' : ''
              }
            }
          }]
        }
        this.chartInstances.scatter.setOption(option, true)
      } else if (isClassMode) {
        // 班级模式：显示散点图，展示班级的学习模式分布
        // 按学习模式分组数据
        const patternGroups = {
          '探索尝试型': [],
          '广泛多样型': [],
          '集中针对型': []
        }
        
        data.forEach(item => {
          const pattern = item.pattern || '集中针对型'
          if (patternGroups[pattern]) {
            patternGroups[pattern].push(item)
          }
        })
        
        // 计算提交次数的最大值，用于调整气泡大小
        const maxSubmitCount = Math.max(...data.map(item => item.submit_count), 1)
        
        // 构建系列数据
        const series = []
        Object.keys(patternGroups).forEach(pattern => {
          if (patternGroups[pattern].length > 0) {
            series.push({
              name: pattern,
              type: 'scatter',
              data: patternGroups[pattern].map(item => [
                item.question_count,
                item.correct_ratio,
                item.submit_count,
                item.student_id,
                item.active_days
              ]),
              symbolSize: function(data) {
                // 根据提交次数调整气泡大小
                const submitCount = data[2] || 1
                return Math.max(10, Math.min(50, (submitCount / maxSubmitCount) * 50))
              },
              itemStyle: {
                color: patternColors[pattern],
                opacity: 0.7
              },
              emphasis: {
                itemStyle: {
                  shadowBlur: 10,
                  shadowColor: 'rgba(0, 0, 0, 0.5)'
                }
              }
            })
          }
        })

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
              const data = params.data
              if (!Array.isArray(data) || data.length < 5) return ''
              return `
                <div style="text-align:left; padding: 5px;">
                  <strong>学习者: ${data[3] || '未知'}</strong><br/>
                  学习模式: ${params.seriesName || '未知'}<br/>
                  答题数: ${data[0] || 0}<br/>
                  正确占比: ${((data[1] || 0) * 100).toFixed(2)}%<br/>
                  提交次数: ${data[2] || 0}<br/>
                  活跃天数: ${data[4] || 0}
                </div>
              `
            }
          },
          legend: {
            data: Object.keys(patternGroups).filter(p => patternGroups[p].length > 0),
            top: 10
          },
          grid: {
            left: '10%',
            right: '10%',
            bottom: '15%',
            top: '15%'
          },
          xAxis: {
            type: 'value',
            name: '答题数',
            nameLocation: 'middle',
            nameGap: 30
          },
          yAxis: {
            type: 'value',
            name: '正确占比',
            nameLocation: 'middle',
            nameGap: 50,
            min: 0,
            max: 1,
            axisLabel: {
              formatter: function(value) {
                return (value * 100).toFixed(0) + '%'
              }
            }
          },
          series: series
        }
        this.chartInstances.scatter.setOption(option, true)
      }
      
      // 确保图表正确显示
      this.$nextTick(() => {
        if (this.chartInstances.scatter && ref && ref.offsetWidth > 0 && ref.offsetHeight > 0) {
          this.chartInstances.scatter.resize()
        }
      })
    },
    renderMethodChart() {
      if (!this.chartData.method || !this.chartData.method.method_distribution || 
          !Array.isArray(this.chartData.method.method_distribution) || 
          this.chartData.method.method_distribution.length === 0) {
        console.log('BlueBox1: 方法偏好数据为空或无效')
        return
      }
      
      // 确保当前Tab是方法偏好
      if (this.currentTab !== 'method') {
        console.log('BlueBox1: 当前Tab不是方法偏好，跳过渲染。当前Tab:', this.currentTab)
        return
      }
      
      const ref = this.$refs.methodChart
      if (!ref) {
        console.log('BlueBox1: 方法偏好图表容器不存在，延迟重试')
        setTimeout(() => this.renderMethodChart(), 100)
        return
      }
      
      // 检查容器是否可见且有尺寸
      const panel = ref.parentElement
      const panelStyle = panel ? window.getComputedStyle(panel) : null
      const refStyle = window.getComputedStyle(ref)
      
      // 确保容器可见
      if (panel && panelStyle) {
        if (panelStyle.display === 'none') {
          panel.style.display = 'block'
        }
        if (panelStyle.visibility === 'hidden') {
          panel.style.visibility = 'visible'
        }
      }
      if (refStyle.display === 'none') {
        ref.style.display = 'block'
      }
      if (refStyle.visibility === 'hidden') {
        ref.style.visibility = 'visible'
      }
      
      // 如果容器尺寸为0，等待容器可见
      if (ref.offsetWidth === 0 || ref.offsetHeight === 0) {
        console.log('BlueBox1: 方法偏好图表容器尺寸为0，延迟重试')
        setTimeout(() => this.renderMethodChart(), 100)
        return
      }
      
      const data = this.chartData.method.method_distribution
      
      // 如果图表实例已存在，先销毁再重新创建，确保数据更新
      if (this.chartInstances.method) {
        try {
          this.chartInstances.method.dispose()
        } catch (e) {
          // 忽略dispose错误
        }
        this.chartInstances.method = null
      }
      
      // 创建新的图表实例
      try {
        this.chartInstances.method = echarts.init(ref)
      } catch (e) {
        console.error('BlueBox1: 创建方法偏好图表实例失败:', e)
        return
      }

      // 提取方法名称的后5个字母
      const extractMethodShortName = (methodName) => {
        if (!methodName) return '未知'
        // 如果是 Method_xxx 格式，提取下划线后的前5个字符
        if (methodName.includes('_')) {
          const parts = methodName.split('_')
          if (parts.length > 1) {
            const suffix = parts[1]
            return suffix.substring(0, 5)
          }
        }
        // 如果不是标准格式，返回最后5个字符
        return methodName.length > 5 ? methodName.substring(methodName.length - 5) : methodName
      }

      // 美观的颜色方案
      const colorPalette = [
        '#5470c6', // 蓝色
        '#91cc75', // 绿色
        '#fac858', // 黄色
        '#ee6666', // 红色
        '#73c0de', // 浅蓝色
        '#3ba272', // 深绿色
        '#fc8452', // 橙色
        '#9a60b4', // 紫色
        '#ea7ccc', // 粉色
        '#ff9f7f'  // 浅橙色
      ]

      const pieData = data.map((item, index) => {
        const methodName = item.method || item.method_name || '未知方法'
        const shortName = extractMethodShortName(methodName)
        return {
          value: item.count,
          name: shortName,
          fullName: methodName, // 保留完整名称用于tooltip
          itemStyle: {
            color: colorPalette[index % colorPalette.length]
          }
        }
      })

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
            if (!params) return ''
            const fullName = params.data.fullName || params.name
            return `<div style="padding: 5px;">
              <strong>${fullName}</strong><br/>
              使用次数: ${params.value || 0}<br/>
              占比: ${params.percent || 0}%
            </div>`
          }
        },
        legend: {
          orient: 'vertical',
          left: 'left',
          top: 'middle',
          textStyle: {
            fontSize: 12
          }
        },
        series: [{
          name: '编程方法',
          type: 'pie',
          radius: '65%', // 改为饼图（单个值）
          center: ['60%', '50%'],
          data: pieData,
          label: {
            show: true,
            formatter: '{b}\n{d}%',
            fontSize: 11
          },
          labelLine: {
            show: true,
            length: 15,
            length2: 10
          },
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            },
            label: {
              fontSize: 13,
              fontWeight: 'bold'
            }
          }
        }]
      }
      this.chartInstances.method.setOption(option, true)
      
      // 确保图表正确显示
      this.$nextTick(() => {
        if (this.chartInstances.method && ref && ref.offsetWidth > 0 && ref.offsetHeight > 0) {
          this.chartInstances.method.resize()
        }
      })
    },
    renderKnowledgeChart() {
      if (!this.chartData.knowledge || !this.chartData.knowledge.knowledge_stats || 
          !Array.isArray(this.chartData.knowledge.knowledge_stats) || 
          this.chartData.knowledge.knowledge_stats.length === 0) {
        console.log('BlueBox1: 知识点掌握数据为空或无效')
        return
      }
      
      // 确保当前Tab是知识点
      if (this.currentTab !== 'knowledge') {
        console.log('BlueBox1: 当前Tab不是知识点，跳过渲染。当前Tab:', this.currentTab)
        return
      }
      
      const ref = this.$refs.knowledgeChart
      if (!ref) {
        console.log('BlueBox1: 知识点图表容器不存在，延迟重试')
        setTimeout(() => this.renderKnowledgeChart(), 100)
        return
      }
      
      // 检查容器是否可见且有尺寸
      const panel = ref.parentElement
      const panelStyle = panel ? window.getComputedStyle(panel) : null
      const refStyle = window.getComputedStyle(ref)
      
      // 确保容器可见
      if (panel && panelStyle) {
        if (panelStyle.display === 'none') {
          panel.style.display = 'block'
        }
        if (panelStyle.visibility === 'hidden') {
          panel.style.visibility = 'visible'
        }
      }
      if (refStyle.display === 'none') {
        ref.style.display = 'block'
      }
      if (refStyle.visibility === 'hidden') {
        ref.style.visibility = 'visible'
      }
      
      // 如果容器尺寸为0，等待容器可见
      if (ref.offsetWidth === 0 || ref.offsetHeight === 0) {
        console.log('BlueBox1: 知识点图表容器尺寸为0，延迟重试')
        setTimeout(() => this.renderKnowledgeChart(), 100)
        return
      }
      
      const data = this.chartData.knowledge.knowledge_stats
      
      // 如果图表实例已存在，先销毁再重新创建，确保数据更新
      if (this.chartInstances.knowledge) {
        try {
          this.chartInstances.knowledge.dispose()
        } catch (e) {
          // 忽略dispose错误
        }
        this.chartInstances.knowledge = null
      }
      
      // 创建新的图表实例
      try {
        this.chartInstances.knowledge = echarts.init(ref)
      } catch (e) {
        console.error('BlueBox1: 创建知识点图表实例失败:', e)
        return
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
          axisPointer: { type: 'shadow' },
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
            if (!params) return ''
            if (Array.isArray(params) && params.length > 0) {
              let result = '<div style="padding: 5px;">'
              result += '<strong>' + (params[0].name || '') + '</strong><br/>'
              params.forEach(param => {
                if (param && param.seriesName) {
                  result += param.seriesName + ': ' + (param.value || 0) + '<br/>'
                }
              })
              result += '</div>'
              return result
            }
            if (params && params.name) {
              return '<div style="padding: 5px;">' + params.name + ': ' + (params.value || 0) + '</div>'
            }
            return ''
          }
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
      this.chartInstances.knowledge.setOption(option, true)
      
      // 确保图表正确显示
      this.$nextTick(() => {
        if (this.chartInstances.knowledge && ref && ref.offsetWidth > 0 && ref.offsetHeight > 0) {
          this.chartInstances.knowledge.resize()
        }
      })
    },
    handleResize() {
      // 延迟执行，确保DOM已更新
      this.$nextTick(() => {
        Object.values(this.chartInstances).forEach(chart => {
          if (chart) {
            try {
              chart.resize()
            } catch (e) {
              console.error('BlueBox1 resize图表失败:', e)
            }
          }
        })
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
  position: relative;
  overflow: visible;
  background: white;
}

.filter-section {
  margin-bottom: 10px;
  padding: 6px 10px 0 10px;
  position: relative;
  z-index: 1;
}

.filter-controls {
  display: flex;
  align-items: center;
  gap: 10px;
}

.filter-label {
  font-size: 12px;
  font-weight: normal;
  color: #111827;
}

.month-select {
  padding: 4px 8px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 11px;
  min-width: 120px;
  background: #f9fafb;
}

.filter-btn,
.reset-btn {
  padding: 4px 12px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 11px;
  cursor: pointer;
  transition: all 0.15s ease;
  background-color: #f9fafb;
  color: #4b5563;
}

.filter-btn:hover {
  background-color: #e5e7eb;
}

.filter-btn.active {
  background-color: #111827;
  color: #f9fafb;
  border-color: #111827;
}

.reset-btn:hover {
  background-color: #e5e7eb;
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
  min-height: 300px;
  min-width: 300px;
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

