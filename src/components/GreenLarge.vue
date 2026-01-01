<template>
  <div class="green-large-container">
    <div ref="chartContainer" class="chart-wrapper"></div>
    <div v-if="loading" class="loading-overlay">
      <div class="loading-spinner"></div>
      <p>加载数据中...</p>
    </div>
    <div v-if="error" class="error-message">
      <p>{{ error }}</p>
      <button @click="fetchData">重试</button>
    </div>
  </div>
</template>

<script>
import * as echarts from 'echarts'
import axios from 'axios'

export default {
  name: 'GreenLarge',
  data() {
    return {
      chart: null,
      loading: false,
      error: null,
      apiBaseUrl: 'http://localhost:5000/api',
      chartData: null  // 保存图表数据用于tooltip映射
    }
  },
  mounted() {
    this.initChart()
    this.fetchData()
    window.addEventListener('resize', this.handleResize)
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.handleResize)
    if (this.chart) {
      this.chart.dispose()
    }
  },
  methods: {
    initChart() {
      if (this.$refs.chartContainer) {
        this.chart = echarts.init(this.$refs.chartContainer)
      }
    },
    
    async fetchData() {
      this.loading = true
      this.error = null
      
      try {
        console.log('正在请求桑基图数据...', `${this.apiBaseUrl}/green/top/sankey`)
        const response = await axios.get(`${this.apiBaseUrl}/green/top/sankey`)
        console.log('桑基图数据获取成功:', response.data)
        this.chartData = response.data  // 保存数据用于tooltip映射
        this.renderChart(response.data)
      } catch (err) {
        console.error('获取桑基图数据失败:', err)
        console.error('错误详情:', err.response || err.message)
        this.error = `数据加载失败: ${err.message || '请检查后端服务是否运行'}`
      } finally {
        this.loading = false
      }
    },
    
    renderChart(data) {
      console.log('开始渲染桑基图，数据:', data)
      
      if (!this.chart) {
        console.error('图表实例未初始化')
        this.error = '图表初始化失败'
        return
      }
      
      if (!data || !data.nodes || !data.links) {
        console.error('数据格式错误:', data)
        this.error = '数据格式不正确，缺少 nodes 或 links'
        return
      }
      
      console.log(`节点数量: ${data.nodes.length}, 链路数量: ${data.links.length}`)

      // 预处理：建立颜色映射关系
      // 1. 计算知识点的总分值并确定颜色
      const knowledgeScores = {}
      const knowledgeColors = {}
      
      data.nodes.forEach(node => {
        if (node.category === 0) { // 知识点
          // 从extra中提取总分值
          let totalScore = 0
          if (node.extra) {
            const scoreMatch = node.extra.match(/总分值[：:]\s*(\d+\.?\d*)/)
            if (scoreMatch) {
              totalScore = parseFloat(scoreMatch[1])
            }
          }
          knowledgeScores[node.id] = totalScore
        }
      })
      
      // 找出最大和最小分值用于颜色映射
      const scores = Object.values(knowledgeScores)
      const maxScore = Math.max(...scores, 1)
      const minScore = Math.min(...scores, 0)
      
      // 为每个知识点分配颜色（浅绿到红色）
      Object.keys(knowledgeScores).forEach(knowledgeId => {
        const score = knowledgeScores[knowledgeId]
        knowledgeColors[knowledgeId] = this.getColorByScore(score, minScore, maxScore)
      })
      
      // 2. 建立专业ID→名称的映射
      const majorIdToName = {}
      data.nodes.forEach(node => {
        if (node.category === 1) { // 专业
          majorIdToName[node.id] = node.name || node.id
        }
      })
      
      // 3. 建立学生→专业的映射
      const studentToMajor = {}
      data.links.forEach(link => {
        const sourcePrefix = link.source.split('_')[0]
        const targetPrefix = link.target.split('_')[0]
        if (sourcePrefix === 'm' && targetPrefix === 's') {
          studentToMajor[link.target] = link.source
        }
      })
      
      // 4. 提取题目分值并确定颜色
      const questionScores = {}
      const questionColors = {}
      
      data.nodes.forEach(node => {
        if (node.category === 3) { // 题目节点
          // 从extra中提取题目分值（注意是"分值"不是"分数"）
          let score = 0
          if (node.extra) {
            // 匹配 "题目分值：3分" 这样的格式
            const scoreMatch = node.extra.match(/题目分值[：:]\s*(\d+\.?\d*)/)
            if (scoreMatch) {
              score = parseFloat(scoreMatch[1])
            }
          }
          questionScores[node.id] = score
        }
      })
      
      // 找出题目的最大和最小分值
      const qScores = Object.values(questionScores)
      const maxQScore = Math.max(...qScores, 1)
      const minQScore = Math.min(...qScores, 0)
      
      // 为每个题目分配柔和的颜色
      Object.keys(questionScores).forEach(questionId => {
        const score = questionScores[questionId]
        questionColors[questionId] = this.getQuestionColorByScore(score, minQScore, maxQScore)
      })
      

      // 处理节点数据
      const nodes = data.nodes.map(node => {
        const nodeData = {
          name: node.name || node.id,
          id: node.id,
          category: node.category,
          itemStyle: {
            color: this.getNodeColorWithMapping(node, knowledgeColors, studentToMajor, questionColors, majorIdToName)
          },
          label: {
            show: true,
            fontSize: this.getNodeFontSize(node.category),
            formatter: (params) => {
              return this.formatNodeLabel(params.data, node)
            }
          },
          tooltip: {
            formatter: (params) => {
              return this.formatNodeTooltip(params.data, node)
            }
          }
        }
        return nodeData
      })

      // 计算专业→学生链路的流量
      // 1. 统计每个专业有多少个学生链路
      const majorToStudentCount = {}
      data.links.forEach(link => {
        const sourcePrefix = link.source.split('_')[0]
        const targetPrefix = link.target.split('_')[0]
        if (sourcePrefix === 'm' && targetPrefix === 's') {
          majorToStudentCount[link.source] = (majorToStudentCount[link.source] || 0) + 1
        }
      })
      
      // 2. 计算每个专业的入流量（知识点→专业的总流量）
      const majorInflow = {}
      data.links.forEach(link => {
        const sourcePrefix = link.source.split('_')[0]
        const targetPrefix = link.target.split('_')[0]
        if (sourcePrefix === 'k' && targetPrefix === 'm') {
          majorInflow[link.target] = (majorInflow[link.target] || 0) + link.value
        }
      })
      
      // 3. 计算每个学生的入流量（专业→学生的流量，需要先计算）
      const studentInflow = {}
      data.links.forEach(link => {
        const sourcePrefix = link.source.split('_')[0]
        const targetPrefix = link.target.split('_')[0]
        if (sourcePrefix === 'm' && targetPrefix === 's') {
          const inflow = majorInflow[link.source] || 0
          const studentCount = majorToStudentCount[link.source] || 1
          studentInflow[link.target] = inflow / studentCount
        }
      })
      
      // 4. 统计每个学生关联的题目总分数
      const studentQuestionTotalScore = {}
      const linkQuestionScores = {} // 存储每个链路的题目分数
      
      data.links.forEach(link => {
        const sourcePrefix = link.source.split('_')[0]
        const targetPrefix = link.target.split('_')[0]
        if (sourcePrefix === 's' && targetPrefix === 'q') {
          // 从link.extra中提取题目分数
          let score = 1 // 默认分数
          if (link.extra) {
            const scoreMatch = link.extra.match(/题目分数[：:]\s*(\d+\.?\d*)/)
            if (scoreMatch) {
              score = parseFloat(scoreMatch[1])
            }
          }
          
          linkQuestionScores[`${link.source}_${link.target}`] = score
          studentQuestionTotalScore[link.source] = (studentQuestionTotalScore[link.source] || 0) + score
        }
      })
      

      
      // 处理链路数据 - 只显示正向链路
      const links = data.links
        .filter(link => this.isForwardLink(link))
        .map(link => {
          const sourcePrefix = link.source.split('_')[0]
          const targetPrefix = link.target.split('_')[0]
          
          // 如果是专业→学生的链路，重新计算流量
          let calculatedValue = link.value
          
          if (sourcePrefix === 'm' && targetPrefix === 's') {
            const inflow = majorInflow[link.source] || 0
            const studentCount = majorToStudentCount[link.source] || 1
            calculatedValue = inflow / studentCount
            console.log(`专业 ${link.source} → 学生 ${link.target}: 入流量=${inflow}, 学生数=${studentCount}, 计算流量=${calculatedValue}`)
          }
          
          // 如果是学生→题目的链路，重新计算流量
          if (sourcePrefix === 's' && targetPrefix === 'q') {
            const studentFlow = studentInflow[link.source] || 0
            const questionScore = linkQuestionScores[`${link.source}_${link.target}`] || 1
            const totalScore = studentQuestionTotalScore[link.source] || 1
            calculatedValue = studentFlow * (questionScore / totalScore)
            console.log(`学生 ${link.source} → 题目 ${link.target}: 学生入流量=${studentFlow}, 题目分数=${questionScore}, 总分数=${totalScore}, 计算流量=${calculatedValue}`)
          }
          
          return {
            source: link.source,
            target: link.target,
            value: calculatedValue,
            originalValue: link.value, // 保留原始值用于调试
            lineStyle: {
              color: 'source',
              opacity: 0.3
            },
            tooltip: {
              formatter: (params) => {
                return this.formatLinkTooltip(params, link, calculatedValue)
              }
            }
          }
        })

      const option = {
        title: {
          text: '',
          left: 'center',
          top: 10,
          textStyle: {
            fontSize: 16,
            fontWeight: 'bold'
          }
        },
        tooltip: {
          trigger: 'item',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          borderColor: '#32cd32',
          borderWidth: 2,
          textStyle: {
            color: '#333',
            fontSize: 12
          },
          padding: 10
        },
        grid: {
          left: '3%',
          right: '12%',
          top: '3%',
          bottom: '3%',
          containLabel: true
        },
        series: [
          {
            type: 'sankey',
            layout: 'none',
            emphasis: {
              focus: 'adjacency'
            },
            nodeAlign: 'left',
            nodeGap: 2,  // 紧凑的节点间距，避免超出边界
            nodeWidth: 15,  // 适中的节点宽度
            layoutIterations: 0,
            orient: 'horizontal',
            draggable: false,
            left: '3%',
            right: '12%',
            top: '3%',
            bottom: '3%',
            data: nodes,
            links: links,
            lineStyle: {
              color: 'gradient',
              curveness: 0.5
            },
            label: {
              position: 'right',
              fontSize: 9,
              color: '#333',
              fontWeight: 'normal',
              padding: [0, 3]
            },
            levels: [
              {
                depth: 0,  // 知识点层 - 突出显示
                itemStyle: {
                  color: '#ff6b6b',
                },
                lineStyle: {
                  color: 'source',
                  opacity: 0.4
                },
                label: {
                  fontSize: 11,
                  fontWeight: '600',
                  color: '#2c3e50'
                }
              },
              {
                depth: 1,  // 专业层 - 次要突出
                itemStyle: {
                  color: '#4ecdc4',
                  shadowBlur: 3,
                  shadowColor: 'rgba(78, 205, 196, 0.3)'
                },
                lineStyle: {
                  color: 'source',
                  opacity: 0.35
                },
                label: {
                  fontSize: 10,
                  fontWeight: '600',
                  color: '#2c3e50'
                }
              },
              {
                depth: 2,  // 学生层 - 适度显示
                itemStyle: {
                  color: '#45b7d1',
                },
                lineStyle: {
                  color: 'source',
                  opacity: 0.3
                },
                label: {
                  fontSize: 9,
                  fontWeight: 'normal',
                  color: '#555'
                }
              },
              {
                depth: 3,  // 题目层 - 压缩显示
                itemStyle: {
                  color: '#96ceb4',
                  borderWidth: 0
                },
                lineStyle: {
                  color: 'source',
                  opacity: 0.2
                },
                label: {
                  fontSize: 7,
                  fontWeight: 'normal',
                  color: '#666'
                }
              }
            ]
          }
        ]
      }

      this.chart.setOption(option, true)
    },
    
    isForwardLink(link) {
      // 判断是否为正向链路
      // 正向：知识点→专业、专业→学生、学生→题目
      const sourcePrefix = link.source.split('_')[0]
      const targetPrefix = link.target.split('_')[0]
      
      const forwardPairs = [
        ['k', 'm'], // 知识点→专业
        ['m', 's'], // 专业→学生
        ['s', 'q']  // 学生→题目
      ]
      
      return forwardPairs.some(([src, tgt]) => 
        sourcePrefix === src && targetPrefix === tgt
      )
    },
    
    getNodeColor(node) {
      // 根据节点类型和数据返回颜色
      switch (node.category) {
        case 0: // 知识点 - 根据平均掌握度
          return this.getMasteryColor(this.extractMastery(node.extra))
        case 1: // 专业 - 根据专业类别
          return this.getMajorColor(node.name)
        case 2: // 学生 - 根据个人综合掌握度
          return this.getMasteryColor(this.extractPersonalMastery(node.extra))
        case 3: // 题目 - 继承知识点颜色
          return this.getQuestionColor()
        default:
          return '#95a5a6'
      }
    },
    
    getNodeColorWithMapping(node, knowledgeColors, studentToMajor, questionColors, majorIdToName) {
      // 根据节点类型和映射关系返回颜色
      switch (node.category) {
        case 0: // 知识点 - 根据总分值从浅绿到红色
          return knowledgeColors[node.id] || '#90EE90'
        case 1: // 专业 - 保持原有颜色
          return this.getMajorColor(node.name)
        case 2: { // 学生 - 继承专业颜色
          const majorId = studentToMajor[node.id]
          if (majorId) {
            const majorName = majorIdToName[majorId]
            return this.getMajorColor(majorName)
          }
          return '#45b7d1' // 默认颜色
        }
        case 3: { // 题目 - 根据题目分值分配颜色
          return questionColors[node.id] || '#D4E4F7'
        }
        default:
          return '#95a5a6'
      }
    },
    
    getColorByScore(score, minScore, maxScore) {
      // 根据分数返回从浅蓝到柔和橙的渐变色
      // 浅蓝: #A8D8EA (rgb(168, 216, 234)) - 低分值
      // 浅紫: #AA96DA (rgb(170, 150, 218)) - 中等分值
      // 浅粉: #FCBAD3 (rgb(252, 186, 211)) - 中高分值
      // 柔和橙: #FFAA85 (rgb(255, 170, 133)) - 高分值
      
      if (maxScore === minScore) {
        return '#B8E6D5' // 如果所有分数相同，返回柔和的薄荷绿
      }
      
      // 归一化分数到 0-1
      const normalized = (score - minScore) / (maxScore - minScore)
      
      // 使用三段式渐变，更加柔和
      let r, g, b
      
      if (normalized < 0.33) {
        // 浅蓝 -> 浅紫
        const t = normalized / 0.33
        const startColor = { r: 168, g: 216, b: 234 } // 浅蓝
        const endColor = { r: 170, g: 150, b: 218 }   // 浅紫
        r = Math.round(startColor.r + (endColor.r - startColor.r) * t)
        g = Math.round(startColor.g + (endColor.g - startColor.g) * t)
        b = Math.round(startColor.b + (endColor.b - startColor.b) * t)
      } else if (normalized < 0.67) {
        // 浅紫 -> 浅粉
        const t = (normalized - 0.33) / 0.34
        const startColor = { r: 170, g: 150, b: 218 } // 浅紫
        const endColor = { r: 252, g: 186, b: 211 }   // 浅粉
        r = Math.round(startColor.r + (endColor.r - startColor.r) * t)
        g = Math.round(startColor.g + (endColor.g - startColor.g) * t)
        b = Math.round(startColor.b + (endColor.b - startColor.b) * t)
      } else {
        // 浅粉 -> 柔和橙
        const t = (normalized - 0.67) / 0.33
        const startColor = { r: 252, g: 186, b: 211 } // 浅粉
        const endColor = { r: 255, g: 170, b: 133 }   // 柔和橙
        r = Math.round(startColor.r + (endColor.r - startColor.r) * t)
        g = Math.round(startColor.g + (endColor.g - startColor.g) * t)
        b = Math.round(startColor.b + (endColor.b - startColor.b) * t)
      }
      
      return `rgb(${r}, ${g}, ${b})`
    },
    
    getQuestionColorByScore(score, minScore, maxScore) {
      // 为题目分配柔和的颜色（薄荷绿到天蓝色）
      // 薄荷绿: #C8E6C9 (rgb(200, 230, 201)) - 低分值
      // 浅青: #B2DFDB (rgb(178, 223, 219)) - 中低分值
      // 浅蓝: #B3E5FC (rgb(179, 229, 252)) - 中高分值
      // 天蓝: #90CAF9 (rgb(144, 202, 249)) - 高分值
      
      if (maxScore === minScore) {
        return '#D4E4F7' // 如果所有分数相同，返回淡蓝色
      }
      
      // 归一化分数到 0-1
      const normalized = (score - minScore) / (maxScore - minScore)
      
      // 使用三段式渐变
      let r, g, b
      
      if (normalized < 0.33) {
        // 薄荷绿 -> 浅青
        const t = normalized / 0.33
        const startColor = { r: 200, g: 230, b: 201 } // 薄荷绿
        const endColor = { r: 178, g: 223, b: 219 }   // 浅青
        r = Math.round(startColor.r + (endColor.r - startColor.r) * t)
        g = Math.round(startColor.g + (endColor.g - startColor.g) * t)
        b = Math.round(startColor.b + (endColor.b - startColor.b) * t)
      } else if (normalized < 0.67) {
        // 浅青 -> 浅蓝
        const t = (normalized - 0.33) / 0.34
        const startColor = { r: 178, g: 223, b: 219 } // 浅青
        const endColor = { r: 179, g: 229, b: 252 }   // 浅蓝
        r = Math.round(startColor.r + (endColor.r - startColor.r) * t)
        g = Math.round(startColor.g + (endColor.g - startColor.g) * t)
        b = Math.round(startColor.b + (endColor.b - startColor.b) * t)
      } else {
        // 浅蓝 -> 天蓝
        const t = (normalized - 0.67) / 0.33
        const startColor = { r: 179, g: 229, b: 252 } // 浅蓝
        const endColor = { r: 144, g: 202, b: 249 }   // 天蓝
        r = Math.round(startColor.r + (endColor.r - startColor.r) * t)
        g = Math.round(startColor.g + (endColor.g - startColor.g) * t)
        b = Math.round(startColor.b + (endColor.b - startColor.b) * t)
      }
      
      return `rgb(${r}, ${g}, ${b})`
    },
    
    getMasteryColor(mastery) {
      // 根据掌握度返回颜色
      if (mastery >= 70) return '#2ecc71' // 绿色
      if (mastery >= 50) return '#f39c12' // 黄色
      return '#e74c3c' // 红色
    },
    
    getMajorColor(majorName) {
      // 根据专业名称返回颜色
      const colorMap = {
        '计算机科学与技术': '#3498db',
        '软件工程': '#9b59b6',
        '数据科学与大数据技术': '#1abc9c',
        '人工智能': '#e67e22',
        '网络工程': '#34495e'
      }
      return colorMap[majorName] || '#95a5a6'
    },
    
    getQuestionColor() {
      // 题目继承知识点颜色，这里简化处理
      return '#96ceb4'
    },
    
    extractMastery(extra) {
      // 从extra字段提取掌握度
      if (!extra) return 0
      const match = extra.match(/平均掌握度[：:]\s*(\d+\.?\d*)%/)
      return match ? parseFloat(match[1]) : 0
    },
    
    extractPersonalMastery(extra) {
      // 从extra字段提取个人综合掌握度
      if (!extra) return 0
      const match = extra.match(/个人综合掌握度[：:]\s*(\d+\.?\d*)%/)
      return match ? parseFloat(match[1]) : 0
    },
    
    getNodeFontSize(category) {
      // 根据节点层级返回字体大小
      const fontSizes = {
        0: 11, // 知识点 - 突出但不过大
        1: 10, // 专业 - 次要突出
        2: 9,  // 学生 - 适度
        3: 7   // 题目 - 压缩
      }
      return fontSizes[category] || 9
    },
    
    formatNodeLabel(nodeData, originalNode) {
      // 格式化节点标签
      switch (originalNode.category) {
        case 0: // 知识点
          // 优先使用 name 字段（知识点名称），如果没有则使用 id
          return originalNode.name || originalNode.id.replace('k_', '')
        case 1: // 专业
          return originalNode.name || originalNode.id
        case 2: // 学生
          return `${originalNode.id.replace('s_', 'S')}`
        case 3: // 题目
          return originalNode.name || originalNode.id
        default:
          return nodeData.name
      }
    },
    
    formatNodeTooltip(nodeData, originalNode) {
      // 格式化节点提示信息
      let tooltip = `<div style="padding: 5px;">
        <strong style="font-size: 14px; color: #2c3e50;">${nodeData.name}</strong><br/>`
      
      if (originalNode.extra) {
        const extraItems = originalNode.extra.split('、')
        extraItems.forEach(item => {
          tooltip += `<div style="margin-top: 5px; color: #555;">${item}</div>`
        })
      }
      
      tooltip += '</div>'
      return tooltip
    },
    
    formatLinkTooltip(params, originalLink) {
      // 格式化链路提示信息
      // 获取节点名称映射
      const nodeNameMap = {}
      if (this.chartData && this.chartData.nodes) {
        this.chartData.nodes.forEach(node => {
          nodeNameMap[node.id] = node.name || node.id
        })
      }
      
      // 将节点ID转换为名称
      const sourceName = nodeNameMap[params.data.source] || params.data.source
      const targetName = nodeNameMap[params.data.target] || params.data.target
      
      let tooltip = `<div style="padding: 5px;">
        <strong style="font-size: 13px; color: #2c3e50;">
          ${sourceName} → ${targetName}
        </strong><br/>`
      
      if (originalLink.extra) {
        const extraItems = originalLink.extra.split('、')
        extraItems.forEach(item => {
          tooltip += `<div style="margin-top: 3px; color: #555;">${item}</div>`
        })
      }
      
      tooltip += '</div>'
      return tooltip
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
.green-large-container {
  width: 100%;
  height: 100%;
  position: relative;
  display: flex;
  flex-direction: column;
  background: white;
}

.chart-header {
  padding: 10px 15px;
  border-bottom: 2px solid #32cd32;
  background: linear-gradient(135deg, #f0fff4 0%, #e8f5e9 100%);
}

.chart-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
  text-align: center;
}

.chart-wrapper {
  flex: 1;
  width: 100%;
  min-height: 0;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 10;
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #e0e0e0;
  border-top-color: #32cd32;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-overlay p {
  margin-top: 15px;
  font-size: 14px;
  color: #666;
}

.error-message {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  padding: 20px;
  background: #fff3cd;
  border: 2px solid #ffc107;
  border-radius: 8px;
  z-index: 10;
}

.error-message p {
  margin-bottom: 15px;
  color: #856404;
  font-size: 14px;
}

.error-message button {
  padding: 8px 20px;
  background: #32cd32;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.3s;
}

.error-message button:hover {
  background: #28a428;
}
</style>

