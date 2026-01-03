<template>
  <div id="dashboard">
    <!-- 第一页：Pink Views + 桑基图 -->
    <section class="page page-1">
      <!-- 背景装饰星星 -->
      <div class="decoration-stars">
        <span class="star star-1">✦</span>
        <span class="star star-2">✧</span>
        <span class="star star-3">★</span>
        <span class="star star-4">✦</span>
        <span class="star star-5">✧</span>
        <span class="star star-6">★</span>
        <span class="star star-7">✦</span>
        <span class="star star-8">✧</span>
      </div>
      <!-- 章节标题 -->
      <div class="chapter-header">
        <div class="chapter-number-wrapper">
          <span class="sparkle sparkle-tl">✨</span>
          <div class="chapter-number">01</div>
          <span class="sparkle sparkle-br">✨</span>
        </div>
        <div class="chapter-content">
          <h2 class="chapter-title">教师视角·题目质量分析</h2>
          <p class="chapter-subtitle">从匹配度、综合表现、答题状态三个维度评估题目质量</p>
        </div>
      </div>

      <!-- 数据说明标签 -->
      <div class="data-info-tag">
        <span class="info-icon">✦</span>
        <span>数据来源：2023学年 | 样本量：全部题目 | 更新：实时</span>
        <span class="info-icon">✦</span>
      </div>

      <div class="page-1-content">
        <!-- 左侧：三个图表竖向排列 -->
        <div class="left-pink-column">
          <div class="chart-with-label">
            <div class="vertical-label">题目匹配度热力图</div>
            <div class="pink-item">
              <PinkHeatmap />
            </div>
          </div>
          
          <div class="chart-with-label">
            <div class="vertical-label">题目综合表现分析</div>
            <div class="pink-item">
              <PinkBubbles />
            </div>
          </div>
          
          <div class="chart-with-label">
            <div class="vertical-label">答题状态趋势</div>
            <div class="pink-item">
              <PinkStateTrends />
            </div>
          </div>
        </div>
        
        <!-- 右侧：桑基图 -->
        <div class="right-sankey-column">
          <div class="chart-with-label-horizontal">
            <div class="horizontal-label main-label">学习路径全景图·知识点流转分析</div>
            <div class="sankey-card">
              <GreenLarge />
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 第二页：动态分析部分 -->
    <section class="page page-2">
      <!-- 章节标题 -->
      <div class="chapter-header">
        <div class="chapter-number orange">02</div>
        <div class="chapter-content">
          <h2 class="chapter-title">学生视角·个人学习动态</h2>
          <p class="chapter-subtitle">选择特定专业和学生，深入分析个性化学习模式与时间维度表现</p>
        </div>
      </div>

      <!-- 顶部：专业和学生选择器 -->
      <div class="header">
        <div class="selector-prompt">→ 请选择专业和学生查看个人学习动态</div>
        <div class="header-item">
          <label class="label">专业 :</label>
          <select v-model="selectedClass" @change="onClassChange" class="select-box">
            <option value="">请选择专业</option>
            <option v-for="cls in classes" :key="cls.code" :value="cls.code">{{ cls.name }}</option>
          </select>
        </div>
        <div class="header-item">
          <label class="label">学生 :</label>
          <select v-model="selectedStudent" @change="onStudentChange" class="select-box">
            <option value="">请选择学生</option>
            <option v-for="student in filteredStudents" :key="student.student_ID" :value="student.student_ID">
              {{ student.display_name }}
            </option>
          </select>
        </div>
      </div>
      
      <!-- 上方：两个蓝色框并排 -->
      <div class="top-blue-row">
        <div class="chart-with-label">
          <div class="vertical-label blue-label">多维度分析·学习行为雷达</div>
          <div class="grid-item blue-item">
            <BlueBox1 
              :className="selectedClass"
              :studentId="selectedStudent"
              @month-change="handleBlueBox1MonthChange"
            />
          </div>
        </div>
        <div class="chart-with-label">
          <div class="vertical-label blue-label">时间维度分析·学习曲线追踪</div>
          <div class="grid-item blue-item">
            <BlueBox2 
              :className="selectedClass"
              :studentId="selectedStudent"
              :selectedMonth="blueBox2SelectedMonth"
            />
          </div>
        </div>
      </div>
      
      <!-- 下方：绿色框横向 -->
      <div class="bottom-green-row">
        <div class="chart-with-label-horizontal">
          <div class="horizontal-label pink-label">学习模式识别·四维行为矩阵</div>
          <div class="grid-item green-item">
            <GreenBox2 
              :className="selectedClass"
              :studentId="selectedStudent"
            />
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script>
import axios from 'axios'
import PinkHeatmap from '@/components/PinkHeatmap.vue'
import PinkBubbles from '@/components/PinkBubbles.vue'
import PinkStateTrends from '@/components/PinkStateTrends.vue'
import BlueBox1 from '@/components/BlueBox1.vue'
import BlueBox2 from '@/components/BlueBox2.vue'
import GreenLarge from '@/components/GreenLarge.vue'
import GreenBox2 from '@/components/GreenBox2.vue'

export default {
  name: 'DashboardPage',
  components: {
    PinkHeatmap,
    PinkBubbles,
    PinkStateTrends,
    BlueBox1,
    BlueBox2,
    GreenBox2,
    GreenLarge
  },
  data() {
    return {
      classes: [],
      students: [],
      selectedClass: '',
      selectedStudent: '',
      greenBox1Data: null,
      greenBox2Data: null,
      blueBox1Data: null,
      blueBox2Data: null,
      blueBox2SelectedMonth: '',
      apiBaseUrl: 'http://localhost:5000/api'
    }
  },
  computed: {
    filteredStudents() {
      if (!this.selectedClass) {
        return []
      }
      return this.students.filter(s => s.major_code === this.selectedClass)
    }
  },
  mounted() {
    this.loadClasses()
    this.loadStudents()
  },
  methods: {
    handleBlueBox1MonthChange(month) {
      this.blueBox2SelectedMonth = month
    },
    async loadClasses() {
      try {
        const response = await axios.get(`${this.apiBaseUrl}/classes`)
        this.classes = response.data
      } catch (error) {
        console.error('加载班级列表失败:', error)
      }
    },
    async loadStudents() {
      try {
        const response = await axios.get(`${this.apiBaseUrl}/students`)
        this.students = response.data
      } catch (error) {
        console.error('加载学生列表失败:', error)
      }
    },
    async onClassChange() {
      this.selectedStudent = ''
      if (this.selectedClass) {
        await this.loadClassData()
      }
    },
    async onStudentChange() {
      if (this.selectedStudent) {
        await this.loadStudentData()
      }
    },
    async loadClassData() {
      try {
        const response = await axios.get(`${this.apiBaseUrl}/class-data/${this.selectedClass}`)
        this.greenBox1Data = response.data.greenBox1
        this.greenBox2Data = response.data.greenBox2
        this.blueBox1Data = response.data.blueBox1
        this.blueBox2Data = response.data.blueBox2
      } catch (error) {
        console.error('加载班级数据失败:', error)
      }
    },
    async loadStudentData() {
      try {
        const response = await axios.get(`${this.apiBaseUrl}/student-data/${this.selectedStudent}`)
        this.greenBox1Data = response.data.greenBox1
        this.greenBox2Data = response.data.greenBox2
        this.blueBox1Data = response.data.blueBox1
        this.blueBox2Data = response.data.blueBox2
      } catch (error) {
        console.error('加载学生数据失败:', error)
      }
    }
  }
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Ma+Shan+Zheng&family=ZCOOL+KuaiLe&display=swap');

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

#dashboard {
  width: 100vw;
  min-height: 100vh;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans SC', sans-serif;
  background: #ffffff;
  scroll-behavior: smooth;
}

/* 页面容器 */
.page {
  min-height: 100vh;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
}

/* 页面标题 */
.page-title {
  display: none;
}

/* 第一页：Pink Views + 桑基图 */
.page-1 {
  background: linear-gradient(to bottom, 
    #fff5f5 0%, 
    #ffe4e6 15%, 
    #ffedd5 45%,
    #fdd8b5 70%,
    #f5e8dd 85%,
    #eef4f9 95%,
    #e8f1f8 100%);
  padding-top: 1.5rem;
  padding-bottom: 3rem;
  position: relative;
  overflow: hidden;
}

/* 背景装饰星星 */
.decoration-stars {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1;
}

.star {
  position: absolute;
  font-size: 1.5rem;
  opacity: 0.3;
  animation: twinkle 3s ease-in-out infinite;
}

.star-1 { top: 15%; left: 10%; color: #ec4899; animation-delay: 0s; }
.star-2 { top: 25%; right: 15%; color: #f97316; animation-delay: 0.5s; font-size: 1.2rem; }
.star-3 { top: 45%; left: 5%; color: #ec4899; animation-delay: 1s; font-size: 1rem; }
.star-4 { top: 60%; right: 8%; color: #f97316; animation-delay: 1.5s; }
.star-5 { top: 75%; left: 12%; color: #ec4899; animation-delay: 2s; font-size: 1.3rem; }
.star-6 { top: 35%; right: 25%; color: #f97316; animation-delay: 2.5s; font-size: 0.9rem; }
.star-7 { top: 85%; right: 20%; color: #ec4899; animation-delay: 1.2s; }
.star-8 { top: 50%; left: 18%; color: #f97316; animation-delay: 1.8s; font-size: 1.1rem; }

@keyframes twinkle {
  0%, 100% { opacity: 0.3; transform: scale(1); }
  50% { opacity: 0.8; transform: scale(1.2); }
}

/* 章节标题 */
.chapter-header {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  margin-bottom: 1rem;
  padding: 0 2rem;
  position: relative;
  z-index: 2;
}

.chapter-number-wrapper {
  position: relative;
  display: inline-block;
}

.sparkle {
  position: absolute;
  font-size: 1.5rem;
  animation: sparkle 2s ease-in-out infinite;
}

.sparkle-tl {
  top: -10px;
  left: -10px;
  color: #f59e0b;
}

.sparkle-br {
  bottom: -10px;
  right: -10px;
  color: #ec4899;
  animation-delay: 1s;
}

@keyframes sparkle {
  0%, 100% { opacity: 0.5; transform: rotate(0deg) scale(0.8); }
  50% { opacity: 1; transform: rotate(180deg) scale(1.2); }
}

.chapter-number {
  font-size: 3rem;
  font-weight: 900;
  color: #ec4899;
  background: linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%);
  width: 80px;
  height: 80px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(236, 72, 153, 0.2);
  border: 2px solid #ec4899;
}

.chapter-number.orange {
  color: #0ea5e9;
  background: linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%);
  border-color: #0ea5e9;
  box-shadow: 0 4px 12px rgba(14, 165, 233, 0.2);
}

.chapter-content {
  flex: 1;
}

.chapter-title {
  font-size: 2rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 0.25rem 0;
  font-family: 'Ma Shan Zheng', 'ZCOOL KuaiLe', cursive;
}

.chapter-subtitle {
  font-size: 0.95rem;
  color: #64748b;
  margin: 0;
  font-weight: 400;
}

/* 数据说明标签 */
.data-info-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 1rem;
  background: rgba(236, 72, 153, 0.08);
  border-radius: 20px;
  margin: 0 0 1.5rem 2rem;
  font-size: 0.85rem;
  color: #64748b;
  border: 1px solid rgba(236, 72, 153, 0.15);
  position: relative;
  z-index: 2;
}

.info-icon {
  color: #ec4899;
  font-size: 1rem;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}

.page-1-content {
  width: 95%;
  max-width: 1800px;
  display: flex;
  gap: 2rem;
  min-height: calc(100vh - 220px);
  margin-top: 1rem;
}

/* 图表带标签容器 */
.chart-with-label {
  flex: 1;
  display: flex;
  gap: 0.75rem;
  min-height: 0;
}

/* 竖向标签 */
.vertical-label {
  writing-mode: vertical-rl;
  text-orientation: mixed;
  font-size: 0.95rem;
  font-weight: 600;
  color: #475569;
  background: linear-gradient(180deg, rgba(236, 72, 153, 0.08) 0%, transparent 100%);
  border-top: 3px solid #ec4899;
  padding: 1rem 0.5rem;
  border-radius: 4px 4px 0 0;
  display: flex;
  align-items: center;
  justify-content: center;
  letter-spacing: 0.05em;
  white-space: nowrap;
}

.vertical-label.main-label {
  border-top-color: #0ea5e9;
  background: linear-gradient(180deg, rgba(14, 165, 233, 0.08) 0%, transparent 100%);
}

.vertical-label.blue-label {
  border-top-color: #0ea5e9;
  background: linear-gradient(180deg, rgba(14, 165, 233, 0.08) 0%, transparent 100%);
}

.vertical-label.pink-label {
  border-top-color: #ec4899;
  background: linear-gradient(180deg, rgba(236, 72, 153, 0.08) 0%, transparent 100%);
}

/* 横向标签 */
.horizontal-label {
  writing-mode: horizontal-tb;
  font-size: 1.1rem;
  font-weight: 600;
  color: #475569;
  background: linear-gradient(90deg, rgba(14, 165, 233, 0.08) 0%, transparent 100%);
  border-left: 3px solid #0ea5e9;
  padding: 0.75rem 1rem;
  border-radius: 4px 0 0 4px;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  letter-spacing: 0.05em;
}

.horizontal-label.pink-label {
  border-left-color: #ec4899;
  background: linear-gradient(90deg, rgba(236, 72, 153, 0.04) 0%, transparent 100%);
}

/* 横向图表容器 */
.chart-with-label-horizontal {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  min-height: 0;
}

/* 左侧：三个粉色框竖向排列 */
.left-pink-column {
  flex: 0 0 35%;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  height: 100%;
}

.pink-item {
  background: transparent;
  border-radius: 0;
  box-shadow: none;
  padding: 0;
  flex: 1;
  min-height: 300px;
  display: flex;
  flex-direction: column;
  transition: transform 0.2s ease;
}

.pink-item:hover {
  transform: scale(1.005);
}

/* 右侧：桑基图 */
.right-sankey-column {
  flex: 1;
  display: flex;
}

.sankey-card {
  width: 100%;
  flex: 1;
  min-height: 0;
  background: transparent;
  border-radius: 0;
  box-shadow: none;
  padding: 0;
  border-top: none;
  transition: transform 0.2s ease;
}

.sankey-card:hover {
  transform: scale(1.01);
}

/* 第二页：动态分析 */
.page-2 {
  background: linear-gradient(to bottom,
    #e8f1f8 0%,
    #eaf3f9 5%,
    #ecf5fa 10%,
    #e0f2fe 20%,
    #dbeafe 45%,
    #cfe3fc 70%,
    #bfdbfe 100%);
  padding-top: 4rem;
}


.header {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
  padding: 1rem 2rem;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  backdrop-filter: blur(10px);
  max-width: 95%;
  margin-left: auto;
  margin-right: auto;
}

.selector-prompt {
  font-size: 0.9rem;
  color: #64748b;
  font-weight: 500;
  white-space: nowrap;
}

.header-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.label {
  font-size: 1.1rem;
  font-weight: 600;
  color: #334155;
}

.select-box {
  padding: 0.6rem 1rem;
  font-size: 1rem;
  min-width: 220px;
  background: white;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.select-box:hover {
  border-color: #3b82f6;
}

.select-box:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

/* 上方：两个蓝色框并排 */
.top-blue-row {
  width: 95%;
  max-width: 1800px;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 2rem;
  margin-bottom: 2rem;
  margin-left: auto;
  margin-right: auto;
}

/* 下方：绿色框横向 */
.bottom-green-row {
  width: 95%;
  max-width: 1800px;
  min-height: 400px;
  margin-bottom: 2rem;
  margin-left: auto;
  margin-right: auto;
}

.grid-item {
  background: transparent;
  border-radius: 0;
  box-shadow: none;
  padding: 0;
  min-height: 380px;
  flex: 1;
  transition: transform 0.2s ease;
}

.grid-item:hover {
  transform: scale(1.005);
}

.green-item {
  border-top: none;
}

.blue-item {
  border-top: none;
}

/* 图表标题 */
.chart-title {
  display: none;
}

/* 响应式设计 */
@media (max-width: 1400px) {
  .page-1-content {
    flex-direction: column;
    height: auto;
  }
  
  .left-pink-column {
    flex: none;
    width: 100%;
  }
  
  .right-sankey-column {
    flex: none;
    width: 100%;
    min-height: 600px;
  }
  
  .top-blue-row {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .page-title {
    font-size: 2rem;
  }
  
  .header {
    flex-direction: column;
    gap: 1rem;
  }
}
</style>
