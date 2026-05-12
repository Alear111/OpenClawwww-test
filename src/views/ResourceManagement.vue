<template>
  <!-- 目录树面板 -->
  <aside class="directory-panel">
    <div class="directory-panel__header">
      <input type="text" class="input input--search" placeholder="请输目录名称" v-model="searchKeyword">
      <button class="button button--primary button--sm">+ 新增目录</button>
    </div>
    <div class="directory-panel__content">
      <ul class="tree">
        <TreeItem 
          v-for="item in filteredDirectory" 
          :key="item.id" 
          :item="item"
          :selected-id="selectedDirectoryId"
          @select="selectDirectory"
        />
      </ul>
    </div>
  </aside>

  <!-- 主内容区 -->
  <main class="main-content">
    <!-- 搜索栏（两行） -->
    <div class="search-bar">
      <div class="search-bar__row1">
        <div class="search-bar__filters">
          <div class="search-input-group">
            <input type="text" class="input" placeholder="资源名称" v-model="searchName">
          </div>
          <div class="search-input-group">
            <select class="input input--select" v-model="searchType">
              <option value="">资源类型</option>
              <option value="video">视频</option>
              <option value="document">文档</option>
            </select>
          </div>
        </div>
        <div class="search-bar__buttons">
          <button class="button button--primary" @click="doSearch">搜索</button>
          <button class="button button--secondary" @click="resetSearch">重置</button>
          <button class="button button--primary" @click="openUploadModal">+ 上传</button>
        </div>
      </div>
      <div class="search-bar__row2">
        <div class="search-bar__tags">
          <TagFilter 
            v-for="dim in tagDimensions" 
            :key="dim.key"
            :label="dim.label"
            :options="availableTags[dim.key]"
            v-model="selectedTags[dim.key]"
          />
        </div>
        <UnanalyzedBadge 
          :count="unanalyzedCount" 
          @click="openUnanalyzedDrawer"
        />
      </div>
    </div>

    <!-- 资源列表 -->
    <div class="resource-list-wrapper">
      <div class="resource-list">
        <ResourceCard 
          v-for="resource in filteredResources" 
          :key="resource.id"
          :resource="resource"
          @click="openDetail(resource)"
        />
      </div>
    </div>

    <!-- 分页 -->
    <div class="pagination">
      <div class="pagination__info">第1页/共1页 每页18条 共{{ filteredResources.length }}条</div>
      <div class="pagination__controls">
        <button class="pagination__btn pagination__btn--prev" disabled>&lt;</button>
        <button class="pagination__btn pagination__btn--active">1</button>
        <button class="pagination__btn pagination__btn--next" disabled>&gt;</button>
      </div>
    </div>

    <!-- 详情弹窗 -->
    <DetailModal 
      :visible="detailModalVisible"
      :data="selectedResource"
      @close="detailModalVisible = false"
    />

    <!-- 上传弹窗 -->
    <UploadModal 
      :visible="uploadModalVisible"
      @close="uploadModalVisible = false"
    />

    <!-- 未分析课件抽屉 -->
    <UnanalyzedDrawer 
      v-model:visible="unanalyzedDrawerVisible"
      :list="unanalyzedList"
      @analyze="handleAnalyzeOne"
      @batch-analyze="handleBatchAnalyze"
      @view-result="handleViewResult"
    />
  </main>
</template>

<script setup>
import { ref, computed } from 'vue'
import TreeItem from '../components/TreeItem.vue'
import ResourceCard from '../components/ResourceCard.vue'
import TagFilter from '../components/TagFilter.vue'
import DetailModal from '../components/DetailModal.vue'
import UploadModal from '../components/UploadModal.vue'
import UnanalyzedBadge from '../components/UnanalyzedBadge.vue'
import UnanalyzedDrawer from '../components/UnanalyzedDrawer.vue'

// 标签维度配置
const tagDimensions = [
  { key: 'department', label: '科室' },
  { key: 'disease', label: '病种' },
  { key: 'learnerType', label: '学员类型' },
  { key: 'topic', label: '主题' },
  { key: 'knowledge', label: '知识点' }
]

// 可选标签数据
const availableTags = {
  department: ['呼吸内科', '心血管内科', '消化内科', '神经内科', '内分泌科', '肾内科', '血液科', '风湿免疫科', '感染科', '重症医学科', '急诊科', '外科', '骨科', '心胸外科', '神经外科', '泌尿外科', '妇产科', '儿科', '眼科', '耳鼻喉科', '口腔科', '皮肤科', '麻醉科', '放射科', '超声科', '病理科', '检验科', '药剂科', '护理部'],
  disease: ['呼吸机相关肺炎', '医院获得性肺炎', '败血症', '深静脉血栓', '压力性损伤', '导管相关血流感染', '手术部位感染', '尿路感染', '多重耐药菌感染', '糖尿病', '高血压', '冠心病', '脑卒中', '慢性阻塞性肺疾病', '肺炎', '哮喘', '肺结核', '肝炎', '肝硬化', '胃炎', '胃溃疡', '肠炎', '肾炎', '肾功能不全', '贫血', '白血病', '淋巴瘤', '肿瘤'],
  learnerType: ['住院医师', '主治医师', '副主任医师', '主任医师', '规培生', '实习生', '进修生', '护理人员', '技师', '药师', '医学生', '研究生'],
  topic: ['医院感染防控', '手卫生', '职业防护', '医疗废物管理', '消毒灭菌技术', '呼吸支持技术', '心肺复苏', '气道管理', '静脉治疗', '伤口护理', '疼痛管理', '营养支持', '心理护理', '康复护理', '急救技能', '生命体征监测', '心电图判读', '影像诊断', '实验室检查', '药物治疗', '外科手术', '麻醉技术', '重症监护', '病例分析', '医患沟通', '医疗法规', '医学伦理', '科研方法'],
  knowledge: ['定义', '病因', '病理生理', '临床表现', '诊断标准', '鉴别诊断', '实验室检查', '影像学检查', '治疗原则', '药物治疗', '手术治疗', '康复治疗', '预防措施', '护理要点', '健康宣教', '并发症', '预后评估', '随访管理', '急救处理', '操作规范', '适应症', '禁忌症', '注意事项', '不良反应']
}

// 目录数据 - 与原版完全一致
const directoryData = [
  { id: 1, name: '研究生', children: [] },
  { id: 2, name: '三基培训', children: [] },
  { id: 3, name: '师资培训', children: [] },
  { id: 4, name: '住院医师', children: [
    { id: 41, name: '医院感染与控制', selected: true },
    { id: 42, name: '全科医学概论' },
    { id: 43, name: '医学心理课程' },
    { id: 44, name: '公共科目' },
    { id: 45, name: '2026年结业住院医师考前辅导' }
  ]},
  { id: 5, name: '学习视频', children: [] },
  { id: 6, name: '默认分类', children: [] },
  { id: 7, name: '直播录像', children: [] },
  { id: 8, name: '实习生', children: [] },
  { id: 9, name: '天天科普', children: [] },
  { id: 10, name: '口腔全科基地教学操作视频', children: [] },
  { id: 11, name: '博士后', children: [] },
  { id: 12, name: '本科生', children: [{ id: 121, name: '内科基地住院医师临床小讲课' }] }
]

// 资源数据 - 与原版完全一致
const resourceData = [
  { 
    id: 10, 
    title: '呼吸机相关肺炎防控新进', 
    type: '视频',
    author: '刘明',
    tags: {
      department: ['呼吸内科'],
      disease: ['呼吸机相关肺炎', '医院获得性肺炎', '多重耐药菌感染'],
      learnerType: ['住院医师', '规培生'],
      topic: ['医院感染防控', '呼吸支持技术'],
      knowledge: ['定义', '危险因素识别', '预防措施', '护理要点']
    }
  },
  { 
    id: 9, 
    title: '插管相关血流感染（CLABSI）的预防', 
    type: '视频',
    author: '张丽',
    tags: {
      department: ['重症医学科', '急诊科'],
      disease: ['导管相关血流感染', '败血症'],
      learnerType: ['住院医师', '护理人员'],
      topic: ['医院感染防控', '静脉治疗'],
      knowledge: ['定义', '危险因素识别', '预防措施', '操作规范']
    }
  },
  { 
    id: 8, 
    title: '多重耐药菌防控的组合干预措施', 
    type: '视频',
    author: '王华',
    tags: {
      department: ['感染科', '呼吸内科'],
      disease: ['多重耐药菌感染', '医院获得性肺炎'],
      learnerType: ['主治医师', '住院医师', '规培生'],
      topic: ['医院感染防控', '药物治疗'],
      knowledge: ['定义', '病因', '预防措施', '注意事项']
    }
  },
  { 
    id: 7, 
    title: '《手术部位感染的预防与控制》', 
    type: '视频',
    author: '李强',
    tags: {
      department: ['外科', '手术室'],
      disease: ['手术部位感染'],
      learnerType: ['住院医师', '主治医师'],
      topic: ['医院感染防控', '外科手术'],
      knowledge: ['定义', '病因', '预防措施', '治疗原则']
    }
  },
  { 
    id: 6, 
    title: '环境污染与医院感染相关研究进展', 
    type: '视频',
    author: '陈静',
    tags: {
      department: ['感染科', '放射科'],
      disease: ['医院获得性肺炎', '败血症'],
      learnerType: ['副主任医师', '主治医师'],
      topic: ['医院感染防控', '科研方法'],
      knowledge: ['病因', '病理生理', '预防措施', '实验室检查']
    }
  },
  { 
    id: 5, 
    title: '医院内胃肠道感染的流行及防控策略', 
    type: '视频',
    author: '赵军',
    tags: {
      department: ['消化内科', '感染科'],
      disease: ['胃炎', '肠炎'],
      learnerType: ['住院医师', '实习生'],
      topic: ['医院感染防控', '病例分析'],
      knowledge: ['定义', '临床表现', '诊断标准', '治疗原则']
    }
  },
  { 
    id: 4, 
    title: '医疗机构如何科学应对奥密克', 
    type: '视频',
    author: '孙伟',
    tags: {
      department: ['呼吸内科', '急诊科'],
      disease: ['肺炎', '哮喘'],
      learnerType: ['主任医师', '副主任医师', '主治医师'],
      topic: ['医院感染防控', '急救技能'],
      knowledge: ['定义', '临床表现', '治疗原则', '注意事项']
    }
  },
  { 
    id: 3, 
    title: '手卫生和个人防护用品的正确', 
    type: '视频',
    author: '周敏',
    tags: {
      department: ['全科医学'],
      disease: ['医院获得性肺炎', '压力性损伤'],
      learnerType: ['实习生', '护理人员', '规培生'],
      topic: ['手卫生', '职业防护'],
      knowledge: ['定义', '注意事项', '操作规范', '健康宣教']
    }
  },
  { 
    id: 2, 
    title: '临床微生物标本采集和送检', 
    type: '视频',
    author: '吴静',
    tags: {
      department: ['检验科', '重症医学科'],
      disease: ['败血症', '尿路感染'],
      learnerType: ['住院医师', '技师'],
      topic: ['实验室检查', '医院感染防控'],
      knowledge: ['实验室检查', '操作规范', '注意事项', '适应症']
    }
  },
  { 
    id: 1, 
    title: '我国医院感染防控理念、新方法、新要', 
    type: '视频',
    author: '郑强',
    tags: {
      department: ['感染科', '医务科'],
      disease: ['医院获得性肺炎', '多重耐药菌感染'],
      learnerType: ['主任医师', '副主任医师', '主治医师'],
      topic: ['医院感染防控', '医疗法规'],
      knowledge: ['定义', '预防措施', '治疗原则', '注意事项']
    }
  }
]

// 状态
const searchKeyword = ref('')
const searchName = ref('')
const searchType = ref('')
const selectedDirectoryId = ref(41)
const selectedTags = ref({ department: [], disease: [], learnerType: [], topic: [], knowledge: [] })
const detailModalVisible = ref(false)
const uploadModalVisible = ref(false)
const selectedResource = ref(null)

// 未分析课件相关状态
const unanalyzedDrawerVisible = ref(false)
const unanalyzedList = ref([
  { id: 'u1', name: '呼吸机相关肺炎防控新进展', author: '刘明' },
  { id: 'u2', name: '插管相关血流感染的预防', author: '张丽' },
  { id: 'u3', name: '多重耐药菌防控的组合干预措施', author: '王华' },
  { id: 'u4', name: '手术部位感染的预防与控制', author: '李强' },
  { id: 'u5', name: '环境污染与医院感染相关研究进展', author: '陈静' },
  { id: 'u6', name: '医院内胃肠道感染的流行及防控策略', author: '赵军' },
  { id: 'u7', name: '手卫生和个人防护用品的正确使用', author: '周敏' }
])

// 未分析课件数量
const unanalyzedCount = computed(() => unanalyzedList.value.length)

// 计算属性
const filteredDirectory = computed(() => {
  if (!searchKeyword.value) return directoryData
  const filterTree = (items) => {
    return items.filter(item => {
      if (item.name.includes(searchKeyword.value)) return true
      if (item.children) {
        const filteredChildren = filterTree(item.children)
        if (filteredChildren.length > 0) {
          return { ...item, children: filteredChildren }
        }
      }
      return false
    })
  }
  return filterTree(directoryData)
})

const filteredResources = computed(() => {
  return resourceData.filter(r => {
    // 名称筛选
    if (searchName.value && !r.title.includes(searchName.value)) return false
    // 类型筛选
    if (searchType.value && r.type !== (searchType.value === 'video' ? '视频' : '文档')) return false
    // 标签筛选（AND逻辑）
    for (const dim of tagDimensions) {
      const selected = selectedTags.value[dim.key]
      if (selected.length > 0) {
        const resourceTags = r.tags[dim.key] || []
        if (!selected.every(t => resourceTags.includes(t))) return false
      }
    }
    return true
  })
})

// 方法
const selectDirectory = (id) => {
  selectedDirectoryId.value = id
}

const doSearch = () => {
  // 搜索逻辑已通过计算属性实现
}

const resetSearch = () => {
  searchName.value = ''
  searchType.value = ''
  selectedTags.value = { department: [], disease: [], learnerType: [], topic: [], knowledge: [] }
}

const openDetail = (resource) => {
  selectedResource.value = resource
  detailModalVisible.value = true
}

const openUploadModal = () => {
  uploadModalVisible.value = true
}

// 未分析课件相关方法
const openUnanalyzedDrawer = () => {
  unanalyzedDrawerVisible.value = true
}

const handleAnalyzeOne = (id) => {
  // 分析逻辑由抽屉组件内部处理
  console.log('开始分析:', id)
}

const handleBatchAnalyze = (ids) => {
  // 批量分析逻辑由抽屉组件内部处理
  console.log('批量分析:', ids)
}

const handleViewResult = (id) => {
  // 查看分析结果
  console.log('查看结果:', id)
  // TODO: 可以跳转到详情页或打开结果弹窗
}
</script>

<style scoped>
/* 标签筛选器行 - flex布局，左边标签，右边徽章 */
:deep(.search-bar__row2) {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

:deep(.search-bar__tags) {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}
</style>
