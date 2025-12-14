<template>
  <div id="app">
    <!-- 顶部：class和student下拉列表 -->
    <div class="header">
      <div class="header-item">
        <label class="label">class :</label>
        <select v-model="selectedClass" @change="onClassChange" class="select-box">
          <option value="">请选择班级</option>
          <option v-for="cls in classes" :key="cls" :value="cls">{{ cls }}</option>
        </select>
      </div>
      <div class="header-item">
        <label class="label">student :</label>
        <select v-model="selectedStudent" @change="onStudentChange" class="select-box">
          <option value="">请选择学生</option>
          <option v-for="student in filteredStudents" :key="student.student_ID" :value="student.student_ID">
            {{ student.student_ID }}
          </option>
        </select>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="main-content">
      <!-- 左列：3个粉色框 -->
      <div class="left-column">
        <div class="frame pink-frame" v-for="i in 3" :key="i">
          <div class="frame-content">
            <p>粉色框 {{ i }}</p>
            <!-- 可以在这里添加具体内容 -->
          </div>
        </div>
      </div>

      <!-- 中列：2个绿色框 -->
      <div class="middle-column">
        <div class="frame green-frame large">
          <div class="frame-content">
            <h3>绿色框 1</h3>
            <div v-if="greenBox1Data">
              <pre>{{ JSON.stringify(greenBox1Data.slice(0, 5), null, 2) }}</pre>
            </div>
          </div>
        </div>
        <div class="frame green-frame small">
          <div class="frame-content">
            <h3>绿色框 2</h3>
            <div v-if="greenBox2Data">
              <pre>{{ JSON.stringify(greenBox2Data.slice(0, 3), null, 2) }}</pre>
            </div>
          </div>
        </div>
      </div>

      <!-- 右列：2个蓝色框 -->
      <div class="right-column">
        <div class="frame blue-frame medium">
          <div class="frame-content">
            <h3>蓝色框 1 - 个性化学习行为模式</h3>
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
import BlueBox1 from './components/BlueBox1.vue'
import BlueBox2 from './components/BlueBox2.vue'

export default {
  name: 'App',
  components: {
    BlueBox1,
    BlueBox2
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
      return this.students.filter(s => s.major === this.selectedClass)
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
  padding: 20px; /* 移除了黑色边框 */
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
  /* 移除了黑色边框 */
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
  flex: 0 0 450px;
}

.frame {
  border: 3px solid; /* 保留彩色边框，仅移除黑色边框 */
  background: white;
  padding: 15px;
  overflow: auto;
}

.pink-frame {
  border-color: #ff69b4;
  flex: 2;
}

.green-frame {
  border-color: #32cd32;
}

.green-frame.large {
  flex: 2;
}

.green-frame.small {
  flex: 1;
}

.blue-frame {
  border-color: #4169e1;
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
}

.frame-content h3 {
  margin-bottom: 10px;
  font-size: 16px;
}

.frame-content pre {
  font-size: 12px;
  white-space: pre-wrap;
  word-wrap: break-word;
}
</style>