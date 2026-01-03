<template>
  <div class="summit-story">
    <!-- 固定顶部控制台 -->
    <div class="control-bar" ref="controlBar">
      <div class="control-content">
        <h1 class="logo">登峰 · Summit</h1>
        <div class="controls">
          <div class="control-item">
            <label>专业</label>
            <select v-model="selectedClass" @change="onClassChange">
              <option value="">选择专业</option>
              <option v-for="cls in classes" :key="cls.code" :value="cls.code">{{ cls.name }}</option>
            </select>
          </div>
          <div class="control-item">
            <label>学生</label>
            <select v-model="selectedStudent" @change="onStudentChange">
              <option value="">选择学生</option>
              <option v-for="student in filteredStudents" :key="student.student_ID" :value="student.student_ID">
                {{ student.display_name }}
              </option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <!-- Section 0: Hero / Base Camp -->
    <section class="section hero-section" ref="heroSection">
      <div class="mountain-bg"></div>
      <div class="hero-content">
        <h1 class="hero-title">登峰</h1>
        <p class="hero-subtitle">学习画像与登顶路线可视化</p>
        <div class="hero-stats">
          <div class="stat-card">
            <div class="stat-value">--</div>
            <div class="stat-label">当前海拔</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">--</div>
            <div class="stat-label">稳定性</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">--</div>
            <div class="stat-label">练习强度</div>
          </div>
        </div>
        <div class="scroll-hint">
          <span>向下滚动探索</span>
          <div class="arrow-down"></div>
        </div>
      </div>
    </section>

    <!-- Section 1: Route (桑基图 - 路线分流) -->
    <section class="section route-section" ref="routeSection">
      <div class="section-header">
        <h2 class="section-title">登山路线</h2>
        <p class="section-desc">从起点到各个知识营地的学习路径分布</p>
      </div>
      <div class="section-content">
        <div class="chart-wrapper">
          <GreenLarge />
        </div>
      </div>
    </section>

    <!-- Section 2: Terrain (热力图 - 地形/雪线) -->
    <section class="section terrain-section" ref="terrainSection">
      <div class="section-header">
        <h2 class="section-title">地形热力图</h2>
        <p class="section-desc">题目与知识点的匹配度分布 · 颜色越深代表匹配度越高</p>
      </div>
      <div class="section-content">
        <div class="chart-wrapper">
          <PinkHeatmap />
        </div>
      </div>
    </section>

    <!-- Section 3: Cliffs (气泡图 - 风险区/难点) -->
    <section class="section cliffs-section" ref="cliffsSection">
      <div class="section-header">
        <h2 class="section-title">风险落石区</h2>
        <p class="section-desc">题目综合表现 · 气泡大小代表分值，颜色代表提交量</p>
      </div>
      <div class="section-content">
        <div class="chart-wrapper">
          <PinkBubbles />
        </div>
      </div>
    </section>

    <!-- Section 4: Learning Mode (学习模式散点) -->
    <section class="section mode-section" ref="modeSection">
      <div class="section-header">
        <h2 class="section-title">学习模式分析</h2>
        <p class="section-desc">不同维度下的学习行为模式</p>
      </div>
      <div class="section-content">
        <div class="chart-wrapper">
          <GreenBox2 
            :className="selectedClass"
            :studentId="selectedStudent"
          />
        </div>
      </div>
    </section>

    <!-- Section 5: State Trends (答题状态趋势) -->
    <section class="section trends-section" ref="trendsSection">
      <div class="section-header">
        <h2 class="section-title">攀登轨迹</h2>
        <p class="section-desc">不同维度下的答题状态变化趋势</p>
      </div>
      <div class="section-content">
        <div class="chart-wrapper">
          <PinkStateTrends />
        </div>
      </div>
    </section>

    <!-- Section 6: Compass (罗盘 - 能力雷达) -->
    <section class="section compass-section" ref="compassSection">
      <div class="section-header">
        <h2 class="section-title">能力罗盘</h2>
        <p class="section-desc">多维度学习特征与时间分布</p>
      </div>
      <div class="section-content">
        <div class="chart-wrapper dual-chart">
          <div class="chart-half">
            <BlueBox1 
              :className="selectedClass"
              :studentId="selectedStudent"
              @month-change="handleBlueBox1MonthChange"
            />
          </div>
          <div class="chart-half">
            <BlueBox2 
              :className="selectedClass"
              :studentId="selectedStudent"
              :selectedMonth="blueBox2SelectedMonth"
            />
          </div>
        </div>
      </div>
    </section>

    <!-- Section 7: Summit Plan (登顶计划) -->
    <section class="section summit-section" ref="summitSection">
      <div class="section-header">
        <h2 class="section-title">登顶计划</h2>
        <p class="section-desc">基于当前画像的优化建议</p>
      </div>
      <div class="section-content">
        <div class="summit-plan">
          <div class="plan-card">
            <div class="plan-icon">🎯</div>
            <h3>优先强化</h3>
            <p>聚焦低掌握度但高权重的知识点</p>
          </div>
          <div class="plan-card">
            <div class="plan-icon">⚡</div>
            <h3>稳定提升</h3>
            <p>巩固波动较大的已掌握内容</p>
          </div>
          <div class="plan-card">
            <div class="plan-icon">🚀</div>
            <h3>持续攀登</h3>
            <p>保持练习节奏，逐步提升海拔</p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script>
import { onMounted, onUnmounted, ref } from 'vue'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import axios from 'axios'
import PinkHeatmap from '@/components/PinkHeatmap.vue'
import PinkBubbles from '@/components/PinkBubbles.vue'
import PinkStateTrends from '@/components/PinkStateTrends.vue'
import BlueBox1 from '@/components/BlueBox1.vue'
import BlueBox2 from '@/components/BlueBox2.vue'
import GreenLarge from '@/components/GreenLarge.vue'
import GreenBox2 from '@/components/GreenBox2.vue'

gsap.registerPlugin(ScrollTrigger)

export default {
  name: 'SummitStory',
  components: {
    PinkHeatmap,
    PinkBubbles,
    PinkStateTrends,
    BlueBox1,
    BlueBox2,
    GreenLarge,
    GreenBox2
  },
  setup() {
    const classes = ref([])
    const students = ref([])
    const selectedClass = ref('')
    const selectedStudent = ref('')
    const blueBox2SelectedMonth = ref('')
    const apiBaseUrl = 'http://localhost:5000/api'

    const heroSection = ref(null)
    const routeSection = ref(null)
    const terrainSection = ref(null)
    const cliffsSection = ref(null)
    const modeSection = ref(null)
    const trendsSection = ref(null)
    const compassSection = ref(null)
    const summitSection = ref(null)
    const controlBar = ref(null)

    const filteredStudents = ref([])

    const loadClasses = async () => {
      try {
        const response = await axios.get(`${apiBaseUrl}/classes`)
        classes.value = response.data
      } catch (error) {
        console.error('加载班级列表失败:', error)
      }
    }

    const loadStudents = async () => {
      try {
        const response = await axios.get(`${apiBaseUrl}/students`)
        students.value = response.data
      } catch (error) {
        console.error('加载学生列表失败:', error)
      }
    }

    const onClassChange = () => {
      selectedStudent.value = ''
      if (selectedClass.value) {
        filteredStudents.value = students.value.filter(s => s.major_code === selectedClass.value)
      } else {
        filteredStudents.value = []
      }
    }

    const onStudentChange = () => {
    }

    const handleBlueBox1MonthChange = (month) => {
      blueBox2SelectedMonth.value = month
    }

    const initScrollAnimations = () => {
      const sections = [
        routeSection.value,
        terrainSection.value,
        cliffsSection.value,
        modeSection.value,
        trendsSection.value,
        compassSection.value,
        summitSection.value
      ]

      sections.forEach((section) => {
        if (section) {
          gsap.fromTo(
            section,
            {
              opacity: 0,
              y: 100
            },
            {
              opacity: 1,
              y: 0,
              duration: 1,
              ease: 'power2.out',
              scrollTrigger: {
                trigger: section,
                start: 'top 80%',
                end: 'top 20%',
                toggleActions: 'play none none reverse'
              }
            }
          )
        }
      })

      if (heroSection.value) {
        gsap.fromTo(
          heroSection.value.querySelector('.hero-content'),
          {
            opacity: 0,
            y: 50
          },
          {
            opacity: 1,
            y: 0,
            duration: 1.5,
            ease: 'power3.out'
          }
        )
      }

      if (controlBar.value) {
        gsap.to(controlBar.value, {
          scrollTrigger: {
            trigger: heroSection.value,
            start: 'bottom top',
            end: 'bottom top',
            onEnter: () => {
              controlBar.value.classList.add('scrolled')
            },
            onLeaveBack: () => {
              controlBar.value.classList.remove('scrolled')
            }
          }
        })
      }
    }

    onMounted(() => {
      loadClasses()
      loadStudents()
      setTimeout(() => {
        initScrollAnimations()
      }, 100)
    })

    onUnmounted(() => {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill())
    })

    return {
      classes,
      students,
      selectedClass,
      selectedStudent,
      filteredStudents,
      blueBox2SelectedMonth,
      onClassChange,
      onStudentChange,
      handleBlueBox1MonthChange,
      heroSection,
      routeSection,
      terrainSection,
      cliffsSection,
      modeSection,
      trendsSection,
      compassSection,
      summitSection,
      controlBar
    }
  }
}
</script>

<style scoped>
.summit-story {
  width: 100%;
  min-height: 100vh;
  background: linear-gradient(180deg, #0a0e27 0%, #1a1f3a 50%, #0f1419 100%);
  color: #e5e7eb;
  overflow-x: hidden;
}

.control-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  background: rgba(10, 14, 39, 0.7);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(100, 181, 246, 0.1);
  padding: 1rem 2rem;
  transition: all 0.3s ease;
}

.control-bar.scrolled {
  background: rgba(10, 14, 39, 0.95);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.control-content {
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo {
  font-size: 1.5rem;
  font-weight: 700;
  background: linear-gradient(135deg, #64b5f6 0%, #42a5f5 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0;
}

.controls {
  display: flex;
  gap: 1.5rem;
}

.control-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.control-item label {
  font-size: 0.9rem;
  color: #9ca3af;
}

.control-item select {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(100, 181, 246, 0.2);
  color: #e5e7eb;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.control-item select:hover {
  border-color: rgba(100, 181, 246, 0.4);
  background: rgba(255, 255, 255, 0.08);
}

.control-item select option {
  background: #1a1f3a;
  color: #e5e7eb;
}

.section {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 4rem 2rem;
  position: relative;
}

.hero-section {
  position: relative;
  overflow: hidden;
}

.mountain-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: 
    linear-gradient(180deg, transparent 0%, rgba(10, 14, 39, 0.8) 100%),
    radial-gradient(ellipse at 50% 80%, rgba(100, 181, 246, 0.1) 0%, transparent 50%);
  z-index: 0;
}

.hero-content {
  position: relative;
  z-index: 1;
  text-align: center;
  max-width: 900px;
}

.hero-title {
  font-size: 5rem;
  font-weight: 900;
  margin-bottom: 1rem;
  background: linear-gradient(135deg, #64b5f6 0%, #90caf9 50%, #42a5f5 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: 0.1em;
}

.hero-subtitle {
  font-size: 1.5rem;
  color: #9ca3af;
  margin-bottom: 3rem;
  font-weight: 300;
}

.hero-stats {
  display: flex;
  gap: 2rem;
  justify-content: center;
  margin-bottom: 4rem;
}

.stat-card {
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(100, 181, 246, 0.2);
  border-radius: 16px;
  padding: 2rem 3rem;
  min-width: 180px;
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-5px);
  border-color: rgba(100, 181, 246, 0.4);
  box-shadow: 0 10px 30px rgba(100, 181, 246, 0.2);
}

.stat-value {
  font-size: 2.5rem;
  font-weight: 700;
  color: #64b5f6;
  margin-bottom: 0.5rem;
}

.stat-label {
  font-size: 0.9rem;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.scroll-hint {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  color: #64b5f6;
  font-size: 0.9rem;
  animation: bounce 2s infinite;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.arrow-down {
  width: 2px;
  height: 40px;
  background: linear-gradient(180deg, transparent 0%, #64b5f6 100%);
  position: relative;
}

.arrow-down::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 6px solid transparent;
  border-right: 6px solid transparent;
  border-top: 8px solid #64b5f6;
}

.section-header {
  text-align: center;
  margin-bottom: 3rem;
  max-width: 800px;
}

.section-title {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 1rem;
  background: linear-gradient(135deg, #64b5f6 0%, #42a5f5 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.section-desc {
  font-size: 1.1rem;
  color: #9ca3af;
  line-height: 1.6;
}

.section-content {
  width: 100%;
  max-width: 1400px;
}

.chart-wrapper {
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(100, 181, 246, 0.1);
  border-radius: 20px;
  padding: 2rem;
  min-height: 500px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
}

.dual-chart {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  padding: 1rem;
}

.chart-half {
  min-height: 500px;
}

.summit-plan {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.plan-card {
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(100, 181, 246, 0.2);
  border-radius: 16px;
  padding: 2.5rem;
  text-align: center;
  transition: all 0.3s ease;
}

.plan-card:hover {
  transform: translateY(-10px);
  border-color: rgba(100, 181, 246, 0.4);
  box-shadow: 0 15px 40px rgba(100, 181, 246, 0.2);
}

.plan-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.plan-card h3 {
  font-size: 1.5rem;
  color: #64b5f6;
  margin-bottom: 1rem;
}

.plan-card p {
  color: #9ca3af;
  line-height: 1.6;
}

.route-section {
  background: radial-gradient(ellipse at 30% 50%, rgba(38, 166, 154, 0.05) 0%, transparent 50%);
}

.terrain-section {
  background: radial-gradient(ellipse at 70% 50%, rgba(102, 187, 106, 0.05) 0%, transparent 50%);
}

.cliffs-section {
  background: radial-gradient(ellipse at 50% 50%, rgba(255, 167, 38, 0.05) 0%, transparent 50%);
}

.compass-section {
  background: radial-gradient(ellipse at 50% 50%, rgba(100, 181, 246, 0.05) 0%, transparent 50%);
}

.summit-section {
  background: radial-gradient(ellipse at 50% 30%, rgba(100, 181, 246, 0.1) 0%, transparent 60%);
}
</style>
