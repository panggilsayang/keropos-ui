<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft } from '@lucide/vue'
import { BaseButton, BaseInput } from '@/components/ui'
import { terminal } from '@/lib/terminal'

const router = useRouter()

const serverUrl = ref('')
const storeId = ref('')
const loading = ref(true)
const saving = ref(false)
const error = ref('')
const saved = ref(false)

onMounted(async () => {
  try {
    const s = await terminal.getServerSettings()
    serverUrl.value = s.server_url
    storeId.value = s.store_id
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e)
  } finally {
    loading.value = false
  }
})

async function save() {
  saving.value = true
  error.value = ''
  saved.value = false
  try {
    await terminal.saveServerSettings(serverUrl.value.trim(), storeId.value.trim())
    saved.value = true
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e)
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="max-w-md mx-auto">
    <button
      class="flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary-600 mb-4 cursor-pointer dark:text-gray-400"
      @click="router.push({ name: 'pos-terminal' })"
    >
      <ArrowLeft class="w-4 h-4" /> Back to Terminal
    </button>

    <div
      class="bg-white border border-gray-200 rounded-xl p-4 space-y-4 dark:bg-gray-800 dark:border-gray-700"
    >
      <h2 class="font-semibold text-gray-900 dark:text-gray-100">Terminal Settings</h2>

      <div v-if="loading" class="text-sm text-gray-400 text-center py-6">Loading...</div>
      <template v-else>
        <BaseInput
          v-model="serverUrl"
          label="Server URL"
          placeholder="http://192.168.1.10:3000"
        />
        <BaseInput v-model="storeId" label="Store ID" placeholder="UUID" />

        <p v-if="saved" class="text-sm text-emerald-600 dark:text-emerald-400">
          Saved. Restart the app for changes to take effect.
        </p>
        <p v-if="error" class="text-sm text-red-600 dark:text-red-400">{{ error }}</p>

        <BaseButton block :disabled="saving" @click="save">
          {{ saving ? 'Saving...' : 'Save' }}
        </BaseButton>
      </template>
    </div>
  </div>
</template>
