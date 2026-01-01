<template>
  <div id="app">
    <!-- 顶部：专业和学生下拉列表 -->
    <div class="header">
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

    <!-- 主要内容区域 -->
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
            <h3>蓝色框 2 - 时间维度分析</h3>
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
  padding: 20px;
  font-family: 'Comic Sans MS', cursive, sans-serif;
  background: white;
}

.header {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 30px;
  margin-bottom: 20px;
  padding: 10px;
}

.header-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.label {
  font-size: 18px;
  font-weight: bold;
}

.select-box {
  padding: 5px 10px;
  font-size: 16px;
  min-width: 200px;
  background: white;
}

.main-content {
  display: flex;
  gap: 20px;
  height: calc(100vh - 150px);
}

.left-column {
  display: flex;
  flex-direction: column;
  gap: 15px;
  flex: 0 0 400px;
}

.middle-column {
  display: flex;
  flex-direction: column;
  gap: 15px;
  flex: 1;
}

.right-column {
  display: flex;
  flex-direction: column;
  gap: 15px;
  flex: 0 0 480px;
}

.frame {
  border: 3px solid; /* 保留彩色边框，仅移除黑色边框 */
  background: white;
  padding: 15px;
  overflow: auto;
}

.pink-frame {
  border: none;
  background: transparent;
  padding: 0;
  flex: 2;
  overflow: visible; 
}

.green-frame {
  border-color: transparent;
}

.green-frame.large {
  flex: 2;
}

.green-frame.small {
  flex: 1;
}

.green-box2-container {
  border: none !important;
  padding: 0 !important;
  overflow: hidden;
}

.green-box2-content {
  padding: 0 !important;
  overflow: hidden;
}

.green-box2-content h3 {
  display: none;
}

.blue-frame {
  border: none;
  background: linear-gradient(135deg, #f9fafb 0%, #e5e7eb 100%);
  padding: 0;
  overflow: visible;
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
  overflow: visible; 
}

.frame-content h3 {
  margin-bottom: 15px;
  font-size: 18px;
  font-weight: 600;
  color: #2c3e50;
  text-align: center;
  padding-bottom: 10px;
  border-bottom: 2px solid rgba(65, 105, 225, 0.2);
}

.frame-content pre {
  font-size: 12px;
  white-space: pre-wrap;
  word-wrap: break-word;
}
</style>