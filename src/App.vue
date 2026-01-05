<template>
  <div id="app">
    <!-- 顶部：标题在左，下拉框在右 -->
    <div class="header">
      <!-- 标题 -->
      <div class="header-title">
        <h1>时序教育可视分析系统</h1>
      </div>
      <!-- 下拉框区域 -->
      <div class="header-controls">
        <div class="header-item">
          <label class="label">专业 :</label>
          <div class="custom-select">
            <select v-model="selectedClass" @change="onClassChange" class="select-box">
              <option value="">请选择专业</option>
              <option v-for="cls in classes" :key="cls.code" :value="cls.code">{{ cls.name }}</option>
            </select>
            <div class="select-arrow"></div>
          </div>
        </div>
        <div class="header-item">
          <label class="label">学生 :</label>
          <div class="custom-select">
            <select v-model="selectedStudent" @change="onStudentChange" class="select-box">
              <option value="">请选择学生</option>
              <option v-for="student in filteredStudents" :key="student.student_ID" :value="student.student_ID">
                {{ student.display_name }}
              </option>
            </select>
            <div class="select-arrow"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- 主要内容区域保持不变 -->
    <div class="main-content">
      <!-- 左列：3个粉色框 -->
      <div class="left-column">
        <div class="frame pink-frame">
          <div class="frame-content">
            <PinkHeatmap />
          </div>
        </div>
        <div class="frame pink-frame">
          <div class="frame-content">
            <PinkBubbles />
          </div>
        </div>
        <div class="frame pink-frame">
          <div class="frame-content">
            <PinkStateTrends />
          </div>
        </div>
      </div>

      <!-- 中列：2个绿色框 -->
      <div class="middle-column">
        <div class="frame green-frame large">
          <div class="frame-content">
            <GreenLarge />
          </div>
        </div>
        <div class="frame green-frame small green-box2-container">
          <div class="frame-content green-box2-content">
            <GreenBox2 
              :className="selectedClass"
              :studentId="selectedStudent"
            />
          </div>
        </div>
      </div>

      <!-- 右列：2个蓝色框 -->
      <div class="right-column">
        <div class="frame blue-frame medium">
          <div class="frame-content">
            <BlueBox1 
              :className="selectedClass"
              :studentId="selectedStudent"
              @month-change="handleBlueBox1MonthChange"
            />
          </div>
        </div>
        <div class="frame blue-frame small">
          <div class="frame-content">
            <BlueBox2 
              :className="selectedClass"
              :studentId="selectedStudent"
              :selectedMonth="blueBox2SelectedMonth"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
// script部分保持不变
import axios from 'axios'
import PinkHeatmap from './components/PinkHeatmap.vue'
import PinkBubbles from './components/PinkBubbles.vue'
import PinkStateTrends from './components/PinkStateTrends.vue'
import BlueBox1 from './components/BlueBox1.vue'
import BlueBox2 from './components/BlueBox2.vue'
import GreenLarge from './components/GreenLarge.vue'
import GreenBox2 from './components/GreenBox2.vue'

export default {
  name: 'App',
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

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

#app {
  width: 100vw;
  height: 100vh;
  padding: 0;
  font-family: 'Georgia', 'Times New Roman', serif;
  background: #f5f1e8;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 顶部样式 */
.header {
  background: linear-gradient(180deg, #1e4d2b 0%, #2d5a3a 100%);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18px 40px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  position: relative;
  z-index: 100;
}

.header::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #d4af37 0%, #f4e5c3 50%, #d4af37 100%);
}

.header-title h1 {
  color: #f5f1e8;
  font-size: 26px;
  font-weight: 700;
  letter-spacing: 1px;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
}

.header-controls {
  display: flex;
  gap: 40px;
}

.header-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.label {
  font-size: 16px;
  font-weight: 600;
  color: #f5f1e8;
  letter-spacing: 0.5px;
  font-style: italic;
}

/* 下拉框美化样式 */
.custom-select {
  position: relative;
  min-width: 220px;
}

.select-box {
  width: 100%;
  padding: 10px 35px 10px 15px;
  font-size: 15px;
  border: 2px solid #d4af37;
  border-radius: 6px;
  background: #f5f1e8;
  color: #2d5a3a;
  appearance: none;
  -webkit-appearance: none;
  cursor: pointer;
  transition: all 0.3s ease;
  font-family: 'Georgia', serif;
  font-weight: 500;
}

.select-box:focus {
  outline: none;
  border-color: #b8941f;
  box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.2);
  background: #ffffff;
}

.select-box:hover {
  border-color: #b8941f;
  background: #faf8f3;
}

.select-arrow {
  position: absolute;
  top: 50%;
  right: 12px;
  transform: translateY(-50%);
  width: 0;
  height: 0;
  border-left: 5px solid transparent;
  border-right: 5px solid transparent;
  border-top: 6px solid #2d5a3a;
  pointer-events: none;
  transition: transform 0.3s ease;
}

.select-box:focus + .select-arrow {
  transform: translateY(-50%) rotate(180deg);
  border-top-color: #1e4d2b;
}

/* 主要内容区域 */
.main-content {
  display: flex;
  gap: 16px;
  flex: 1;
  padding: 16px;
  overflow: hidden;
}

.left-column {
  display: flex;
  flex-direction: column;
  gap: 16px;
  flex: 0 0 400px;
}

.middle-column {
  display: flex;
  flex-direction: column;
  gap: 16px;
  flex: 1;
}

.right-column {
  display: flex;
  flex-direction: column;
  gap: 16px;
  flex: 0 0 480px;
}

.frame {
  border: 2px solid #d4af37;
  background: #ffffff;
  padding: 0;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border-radius: 4px;
  position: relative;
}

.frame::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, #2d5a3a 0%, #1e4d2b 100%);
  z-index: 1;
}

.pink-frame {
  flex: 2;
}

.green-frame.large {
  flex: 1.5;
}

.green-frame.small {
  flex: 1.5;
}

.blue-frame.medium {
  flex: 4;
}

.blue-frame.small {
  flex: 3;
}

.frame-content {
  width: 100%;
  height: 100%;
  overflow: hidden;
}
</style>