<template>
  <plugin-block-list
    ref="blockRef"
    :data="blockList"
    :show-add-button="state.showAddButton"
    :block-style="state.displayType"
    :show-block-detail="state.showDetailPanel"
    :show-block-shot="state.showShot"
    :show-checkbox="showCheckbox"
    :checked="checked"
    :grid-columns="gridColumns"
    default-icon-tip="查看区块详情信息"
    @click="blockClick"
    @iconClick="openDetail"
    @openVersionPanel="openVersionPanel"
    @add="setBlockPanelVisible(true)"
    @deleteBlock="deleteBlock"
    @checkAll="(items) => checkAll(items)"
    @cancelCheckAll="cancelCheckAll"
  ></plugin-block-list>
</template>

<script lang="jsx">
import { computed, inject, reactive, ref } from 'vue'
import {
  useBlock,
  useMaterial,
  useModal,
  useCanvas,
  getMetaApi,
  META_SERVICE
} from '@opentiny/tiny-engine-meta-register'
import { PluginBlockList } from '@opentiny/tiny-engine-common'
import { requestUpdateGroup, fetchGroupBlocksById } from './http'
import { setBlockPanelVisible, setBlockVersionPanelVisible } from './js/usePanel'

export default {
  components: {
    PluginBlockList
  },
  props: {
    blockList: {
      type: Array,
      default: () => []
    },
    showAddButton: {
      type: Boolean,
      default: false
    },
    triggerCheck: {
      type: Boolean,
      default: false
    },
    /*
      是否显示快照
    */
    showBlockShot: {
      type: Boolean,
      default: true
    },
    // 是否显示多选框
    showCheckbox: {
      type: Boolean,
      default: false
    },
    // 选中的区块
    checked: {
      type: Array,
      default: () => []
    },
    gridColumns: {
      type: Number,
      default: 2
    }
  },
  emits: ['check', 'close', 'checkAll', 'cancelCheckAll'],
  setup(props, { emit }) {
    const { generateNode, getBlockByName } = useMaterial()
    const { isDefaultGroupId, isAllGroupId, selectedBlock, selectedGroup, isRefresh, getBlockAssetsByVersion } =
      useBlock()
    const blockRef = ref(null)
    const panelState = inject('panelState', {})
    const displayType = inject('displayType')
    const { message, confirm } = useModal()
    const getAppId = () => getMetaApi(META_SERVICE.GlobalService).getBaseInfo().id

    const openVersionPanel = async ({ item }) => {
      selectedBlock.value = item
      setBlockVersionPanelVisible(true)
    }

    const state = reactive({
      showAddButton: computed(
        () =>
          !panelState.isShortcutPanel &&
          props.showAddButton &&
          !isAllGroupId(selectedGroup.value.groupId) &&
          !isDefaultGroupId(selectedGroup.value.groupId)
      ),
      displayType: computed(() => displayType?.value),
      activeIndex: 0,
      showDetailPanel: false,
      location: null,
      detail: null,
      showShot: computed(() => props.showBlockShot && !panelState.isShortcutPanel)
    })

    const blockClick = (block) => {
      //  添加区块分组情形无需 注册 block，因为获取区块分组列表接口没有 assets 信息，会导致无法得到 webcomponent url
      if (props.triggerCheck) {
        emit('check', block)
        return
      }
      const { isShortcutPanel, emitEvent } = panelState

      block.assets = getBlockAssetsByVersion(block, block.current_version)

      // 获取 区块、子区块详情，并编译
      getBlockByName(block.label)

      const blockName = block.component || block.blockName || block.label
      const node = generateNode({ type: 'block', component: blockName })
      const { addComponent, dragStart } = useCanvas().canvasApi.value

      if (isShortcutPanel) {
        emitEvent('close')
        addComponent(node, isShortcutPanel)
      } else {
        dragStart(node)
      }
    }

    const openDetail = ({ item, index }) => {
      const nodeItem = blockRef.value.$el.querySelector(`.block-item:nth-child(${index + 1})`)
      const itemOffsetWidth = nodeItem.offsetWidth
      const itemOffsetHeight = nodeItem.offsetHeight
      const itemX = nodeItem.getBoundingClientRect().left
      const itemY = nodeItem.getBoundingClientRect().top
      const offset = index % 2 ? itemOffsetWidth * 0.9 : -itemOffsetWidth * 0.1
      const offsetWidth =
        panelState.isBlockGroupPanel && panelState.isBlockList ? -(itemOffsetWidth / 8) : itemOffsetWidth / 4
      const location =
        index % 2 ? `calc(50% + ${itemOffsetWidth / 2 + 'px'})` : `calc(50% - ${itemOffsetWidth / 2 + 'px'})`
      const itemOffset = !panelState.isShortcutPanel && !panelState.isBlockGroupPanel ? offset : offsetWidth
      const itemLocation = !panelState.isShortcutPanel && !panelState.isBlockGroupPanel ? location : '50%'
      const ARROW_HEIGHT = 10

      state.position = {
        left: itemX - itemOffset + 'px',
        top: itemY + itemOffsetHeight + ARROW_HEIGHT + 'px'
      }

      state.location = {
        left: itemLocation
      }

      state.activeIndex = index
      selectedBlock.value = item.id
      state.showDetailPanel = true
      state.detail = item
    }

    const closeDetail = () => {
      state.showDetailPanel = false
      blockRef.value.clearActive()
    }

    const deleteBlock = ({ id: blockId, label, groupId: id, groupName: name }) => {
      const groupId = id || selectedGroup.value.groupId
      const groupName = name || selectedGroup.value.groupName

      const title = `移除区块${label}`
      const messageRender = {
        render: () => (
          <span>
            您确定将区块 <b>{label}</b> 从分组 <b>{groupName}</b> 中移除吗?
          </span>
        )
      }
      const exec = () => {
        fetchGroupBlocksById({ groupId })
          .then((data) => {
            // 删除成功后需要关闭版本选择弹窗，避免当前版本选择弹窗就是删除的区块
            setBlockVersionPanelVisible(false)

            const blocks = data
              ?.filter((item) => item.id !== blockId)
              .map((block) => ({ id: block.id, version: block.current_version }))

            requestUpdateGroup({ id: groupId, blocks, app: getAppId() }).then(() => {
              isRefresh.value = true
            })
          })
          .catch((error) => {
            message({ message: `移除区块失败: ${error.message || error}`, status: 'error' })
          })
      }
      confirm({ title, message: messageRender, exec })
    }

    const checkAll = (items) => {
      emit('checkAll', items)
    }

    const cancelCheckAll = () => {
      emit('cancelCheckAll')
    }

    return {
      blockRef,
      state,
      blockClick,
      openDetail,
      closeDetail,
      setBlockPanelVisible,
      openVersionPanel,
      deleteBlock,
      checkAll,
      cancelCheckAll
    }
  }
}
</script>
