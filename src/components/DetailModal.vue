<template>
  <div class="modal-overlay" :class="{ 'modal-overlay--active': visible }" @click.self="$emit('close')">
    <div class="modal modal--detail">
      <div class="modal__header">
        <h3 class="modal__title">{{ data?.title || '资源详情' }}.mp4</h3>
        <button class="modal__close" @click="$emit('close')">&times;</button>
      </div>
      <div class="modal__body" v-if="data">
        <div class="detail-section">
          <!-- 基本信息 + 预览按钮 -->
          <div class="detail-section__header">
            <h4 class="detail-section__title">基本信息</h4>
            <button class="button button--secondary button--sm">预览</button>
          </div>
          <!-- 警告提示 -->
          <div class="detail-notice">
            <span class="detail-notice__icon">⚠️</span>
            <span class="detail-notice__text">要求观看至90 %</span>
          </div>
          <!-- 详细信息表格（双列布局） -->
          <table class="detail-table">
            <!-- 第1行：资源名称 + 视频标签 -->
            <tr>
              <td class="detail-table__label">资源名称</td>
              <td class="detail-table__value" colspan="3" style="white-space: nowrap">
                <span class="tag tag--video">视频</span>
                <span>{{ data.title }}.mp4</span>
              </td>
            </tr>
            <!-- 第2行：所属目录 + 文件大小 -->
            <tr>
              <td class="detail-table__label">所属目录</td>
              <td class="detail-table__value">{{ detailData.directory }}</td>
              <td class="detail-table__label">文件大小</td>
              <td class="detail-table__value">{{ detailData.fileSize }}</td>
            </tr>
            <!-- 第3行：视频时长 + 讲师 -->
            <tr>
              <td class="detail-table__label">视频时长</td>
              <td class="detail-table__value">{{ detailData.duration }}</td>
              <td class="detail-table__label">讲师</td>
              <td class="detail-table__value">{{ data.author }}</td>
            </tr>
            <!-- 第4行：是否允许拖拽 + 是否允许倍速 -->
            <tr>
              <td class="detail-table__label">是否允许拖拽</td>
              <td class="detail-table__value">
                <label class="switch switch--disabled">
                  <input type="checkbox" disabled>
                  <span class="switch__slider"></span>
                </label>
              </td>
              <td class="detail-table__label">是否允许倍速</td>
              <td class="detail-table__value">
                <label class="switch switch--disabled">
                  <input type="checkbox" disabled>
                  <span class="switch__slider"></span>
                </label>
              </td>
            </tr>
            <!-- 第5行：是否重复观看 + 简介 -->
            <tr>
              <td class="detail-table__label">是否重复观看</td>
              <td class="detail-table__value">
                <label class="switch switch--disabled">
                  <input type="checkbox" checked disabled>
                  <span class="switch__slider"></span>
                </label>
              </td>
              <td class="detail-table__label">简介</td>
              <td class="detail-table__value">{{ detailData.intro }}</td>
            </tr>
            <!-- 第6行：标签信息 -->
            <tr class="detail-table__tag-row">
              <td class="detail-table__label">标签信息</td>
              <td class="detail-table__value detail-table__tags-cell" colspan="3">
                <div class="detail-tags-wrapper" ref="tagsWrapper">
                  <template v-if="hasTags">
                    <template v-for="(dim, index) in tagDimensions" :key="dim.key">
                      <template v-if="data.tags[dim.key] && data.tags[dim.key].length > 0">
                        <div class="detail-tag-group">
                          <span class="detail-tag-group__label">{{ dim.label }}</span>
                          <div class="detail-tag-group__value">
                            <span class="detail-tag" v-for="tag in data.tags[dim.key]" :key="tag">{{ tag }}</span>
                          </div>
                        </div>
                        <span 
                          class="detail-tag-group__separator" 
                          v-if="hasRemainingTags(index)"
                        >|</span>
                      </template>
                    </template>
                  </template>
                  <span v-else class="detail-tags-empty">暂无标签</span>
                </div>
              </td>
            </tr>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'

const props = defineProps({
  visible: Boolean,
  data: Object
})

const emit = defineEmits(['close'])

const tagsWrapper = ref(null)

const tagDimensions = [
  { key: 'department', label: '科室' },
  { key: 'disease', label: '病种' },
  { key: 'learnerType', label: '学员' },
  { key: 'topic', label: '主题' },
  { key: 'knowledge', label: '知识点' }
]

// 模拟详情数据（与原版一致）
const mockDetailData = {
  '呼吸机相关肺炎防控新进': {
    directory: '医院感染与控制',
    fileSize: '18.5MB',
    duration: '15分32秒',
    intro: '介绍呼吸机相关肺炎的防控措施和最新进展'
  },
  '插管相关血流感染（CLABSI）的预防': {
    directory: '医院感染与控制',
    fileSize: '22.1MB',
    duration: '18分45秒',
    intro: '讲解导管相关血流感染的预防策略'
  },
  '原发性醛固酮增多症': {
    directory: '内科基地住院医师临床小讲课',
    fileSize: '20.93MB',
    duration: '23分11秒',
    intro: '无内容'
  }
}

// 详情数据（根据资源标题匹配）
const detailData = computed(() => {
  const title = props.data?.title
  const mockInfo = mockDetailData[title] || {
    directory: '医院感染与控制',
    fileSize: '15.0MB',
    duration: '12分30秒',
    intro: '无内容'
  }
  return mockInfo
})

// 检查是否有任何标签
const hasTags = computed(() => {
  if (!props.data?.tags) return false
  return tagDimensions.some(dim => props.data.tags[dim.key] && props.data.tags[dim.key].length > 0)
})

// 检查指定索引之后是否还有标签
const hasRemainingTags = (currentIndex) => {
  if (!props.data?.tags) return false
  for (let i = currentIndex + 1; i < tagDimensions.length; i++) {
    const dim = tagDimensions[i]
    if (props.data.tags[dim.key] && props.data.tags[dim.key].length > 0) {
      return true
    }
  }
  return false
}

// 拖拽滚动
let isDown = false
let startX = 0
let scrollLeft = 0

const initDrag = () => {
  if (!tagsWrapper.value) return
  
  const handleMouseMove = (e) => {
    if (!isDown) return
    e.preventDefault()
    const x = e.pageX - tagsWrapper.value.getBoundingClientRect().left
    const walk = (x - startX) * 2
    tagsWrapper.value.scrollLeft = scrollLeft - walk
  }

  const handleMouseUp = () => {
    isDown = false
    if (tagsWrapper.value) {
      tagsWrapper.value.style.cursor = 'grab'
    }
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
  }

  tagsWrapper.value.addEventListener('mousedown', (e) => {
    isDown = true
    tagsWrapper.value.style.cursor = 'grabbing'
    startX = e.pageX - tagsWrapper.value.getBoundingClientRect().left
    scrollLeft = tagsWrapper.value.scrollLeft
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  })

  tagsWrapper.value.addEventListener('mouseleave', () => {
    if (isDown) {
      isDown = false
      tagsWrapper.value.style.cursor = 'grab'
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  })
}

onMounted(() => {
  initDrag()
})

watch(() => props.visible, (val) => {
  if (val) {
    setTimeout(() => initDrag(), 0)
  }
})
</script>
