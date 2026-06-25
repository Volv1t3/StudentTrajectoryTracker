<script lang="ts">
  interface Props {
    label: string;
  }

  let { label }: Props = $props();
</script>

<span class="inline-flex items-center px-2.5 py-1 rounded-md bg-[--color-red-light] text-[--color-red] text-xs font-medium">
  {label}
</span>