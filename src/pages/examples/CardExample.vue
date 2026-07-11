<script setup lang="ts">
import { BaseCard, BaseButton } from '@/components/ui'
</script>

<template>
  <div class="space-y-8 max-w-4xl">
    <div>
      <h1 class="text-2xl font-bold text-gray-900">Card</h1>
      <p class="text-gray-500 mt-1">
        Container component untuk grouping content, dengan header dan footer slot.
      </p>
    </div>

    <!-- Variants -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <BaseCard variant="default">
        <template #header><h5 class="font-semibold">Default</h5></template>
        Card with border and subtle shadow. Cocok buat general purpose.
        <template #footer><span class="text-xs text-gray-500">Footer slot</span></template>
      </BaseCard>

      <BaseCard variant="bordered">
        <template #header><h5 class="font-semibold">Bordered</h5></template>
        Only border, no shadow. Clean look.
      </BaseCard>

      <BaseCard variant="elevated">
        <template #header><h5 class="font-semibold">Elevated</h5></template>
        Larger shadow, no border. Buat highlight content.
      </BaseCard>

      <BaseCard variant="flat">
        <template #header><h5 class="font-semibold">Flat</h5></template>
        Gray background, minimal style. Buat secondary content.
      </BaseCard>
    </div>

    <!-- Hoverable -->
    <BaseCard>
      <template #header><h4 class="font-semibold">Hoverable</h4></template>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <BaseCard variant="default" :hoverable="true">
          <p class="text-sm text-gray-600">
            Hover me! Card bakal naik sedikit dan shadow makin gede.
          </p>
        </BaseCard>
        <BaseCard variant="bordered" :hoverable="true">
          <p class="text-sm text-gray-600">Good for clickable cards like navigation tiles.</p>
        </BaseCard>
        <BaseCard variant="elevated" :hoverable="true">
          <p class="text-sm text-gray-600">Elevated + hoverable = premium look.</p>
        </BaseCard>
      </div>
    </BaseCard>

    <!-- No Padding -->
    <BaseCard>
      <template #header><h4 class="font-semibold">No Padding</h4></template>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <BaseCard variant="bordered" :padding="false">
          <div
            class="h-32 bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-semibold"
          >
            No padding, full bleed content
          </div>
        </BaseCard>
        <BaseCard variant="bordered" :padding="true">
          <div
            class="h-32 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-lg flex items-center justify-center text-white font-semibold"
          >
            With padding (default)
          </div>
        </BaseCard>
      </div>
    </BaseCard>

    <!-- With Footer Actions -->
    <BaseCard>
      <template #header><h4 class="font-semibold">With Footer Actions</h4></template>
      <BaseCard variant="bordered">
        <template #header>
          <div class="flex justify-between items-center">
            <h5 class="font-semibold">Create New Project</h5>
          </div>
        </template>
        <p class="text-sm text-gray-600">
          Fill in the details below to create a new project. All fields are required.
        </p>
        <template #footer>
          <div class="flex gap-2 justify-end w-full">
            <BaseButton variant="ghost" size="sm">Cancel</BaseButton>
            <BaseButton size="sm">Create</BaseButton>
          </div>
        </template>
      </BaseCard>
    </BaseCard>

    <!-- Usage -->
    <BaseCard variant="flat">
      <template #header><h4 class="font-semibold">Usage</h4></template>
      <pre
        class="bg-gray-900 text-gray-100 p-4 rounded-lg text-xs leading-relaxed overflow-x-auto"
      ><code>&lt;BaseCard variant="default" :hoverable="true"&gt;
  &lt;template #header&gt;
    &lt;h5&gt;Card Title&lt;/h5&gt;
  &lt;/template&gt;

  &lt;p&gt;Card body content goes here.&lt;/p&gt;

  &lt;template #footer&gt;
    &lt;BaseButton size="sm"&gt;Action&lt;/BaseButton&gt;
  &lt;/template&gt;
&lt;/BaseCard&gt;</code></pre>
    </BaseCard>
  </div>
</template>
