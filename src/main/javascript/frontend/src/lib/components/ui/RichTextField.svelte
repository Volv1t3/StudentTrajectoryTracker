<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import { Editor } from '@tiptap/core';
  import StarterKit from '@tiptap/starter-kit';
  import Underline from '@tiptap/extension-underline';
  import Placeholder from '@tiptap/extension-placeholder';
  import TaskList from '@tiptap/extension-task-list';
  import TaskItem from '@tiptap/extension-task-item';
  import Link from '@tiptap/extension-link';
  import HardBreak from '@tiptap/extension-hard-break';
  import {
    Bold,
    Italic,
    Underline as UnderlineIcon,
    Strikethrough,
    Heading1,
    Heading2,
    Heading3,
    List,
    ListOrdered,
    Quote,
    Code,
    Minus,
    Undo2,
    Redo2,
    CornerDownRight,
  } from 'lucide-svelte';

  interface Props {
    name: string;
    label: string;
    value?: string | null;
    placeholder?: string;
    required?: boolean;
    minHeightClass?: string;
    onchange?: (html: string) => void;
  }

  let {
    name,
    label,
    value = '',
    placeholder = 'Escribe el contenido aquí...',
    required = false,
    minHeightClass = 'min-h-[160px]',
    onchange,
  }: Props = $props();

  let editorEl = $state<HTMLDivElement | undefined>();
  let editor = $state<Editor | undefined>();
  let html = $state(value ?? '');
  let syncing = false;

  const editorClass = `tiptap-editor prose prose-sm max-w-none focus:outline-none ${minHeightClass} px-4 py-3 text-md text-[--text-primary]`;

  onMount(() => {
    editor = new Editor({
      element: editorEl,
      extensions: [
        StarterKit,
        Underline,
        Placeholder.configure({ placeholder: placeholder }),
        TaskList,
        TaskItem.configure({ nested: true }),
        Link.configure({ openOnClick: false }),
        HardBreak.configure({ keepMarks: true }),
      ],
      content: value ?? '',
      editorProps: {
        attributes: {
          class: editorClass,
        },
      },
      onTransaction: ({ editor: currentEditor }) => {
        if (syncing) return;
        html = currentEditor.getHTML();
        onchange?.(html);
      },
    });
  });

  onDestroy(() => {
    editor?.destroy();
  });

  $effect(() => {
    if (!editor) return;
    const nextValue = value ?? '';
    if (nextValue === editor.getHTML()) return;
    syncing = true;
    editor.commands.setContent(nextValue, { emitUpdate: false });
    html = editor.getHTML();
    syncing = false;
  });
</script>

<style>
  :global(.tiptap-editor ul) {
    list-style-type: disc;
    padding-left: 1.5rem;
    margin: 0.5rem 0;
  }
  :global(.tiptap-editor ol) {
    list-style-type: decimal;
    padding-left: 1.5rem;
    margin: 0.5rem 0;
  }
  :global(.tiptap-editor li) {
    margin: 0.15rem 0;
  }
  :global(.tiptap-editor li p) {
    margin: 0;
  }
  :global(.tiptap-editor ul ul) {
    list-style-type: circle;
  }
  :global(.tiptap-editor ul ul ul) {
    list-style-type: square;
  }
  :global(.tiptap-editor [data-type="taskList"]) {
    list-style: none;
    padding-left: 0;
  }
  :global(.tiptap-editor [data-type="taskList"] li) {
    display: flex;
    align-items: flex-start;
    gap: 0.5rem;
  }
  :global(.tiptap-editor [data-type="taskList"] li label) {
    margin-top: 0.25rem;
  }
  :global(.tiptap-editor [data-type="taskList"] li label input[type="checkbox"]) {
    width: 1rem;
    height: 1rem;
    accent-color: var(--accent, #dc2626);
    cursor: pointer;
  }
  :global(.tiptap-editor blockquote) {
    border-left: 3px solid var(--accent, #dc2626);
    padding-left: 1rem;
    margin: 0.5rem 0;
    color: var(--text-secondary);
  }
  :global(.tiptap-editor pre) {
    background: var(--bg-secondary);
    border-radius: 0.5rem;
    padding: 0.75rem 1rem;
    margin: 0.5rem 0;
    overflow-x: auto;
  }
  :global(.tiptap-editor code) {
    background: var(--bg-secondary);
    border-radius: 0.25rem;
    padding: 0.15rem 0.3rem;
    font-size: 0.875rem;
  }
  :global(.tiptap-editor pre code) {
    background: none;
    padding: 0;
  }
  :global(.tiptap-editor hr) {
    border: none;
    border-top: 2px solid var(--border);
    margin: 1rem 0;
  }
  :global(.tiptap-editor p.is-editor-empty:first-child::before) {
    content: attr(data-placeholder);
    float: left;
    color: var(--text-muted);
    pointer-events: none;
    height: 0;
  }
</style>

<input type="hidden" {name} value={html} />
<div class="space-y-1">
  <label class="block text-md font-bold mb-1" style="font-family: var(--font-subheading);">
    {label}
    {#if required}<span class="text-red-500">*</span>{/if}
  </label>
  <div class="rounded-lg border border-[--border] overflow-hidden" style="background: var(--bg-surface);">
    {#if editor}
      <div class="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-[--border] bg-[--bg-secondary]">
        <button type="button" class="p-1.5 rounded hover:bg-[--primary] transition-colors" class:bg-[--border]={editor.isActive('bold')} onclick={() => editor!.chain().focus().toggleBold().run()} aria-label="Negrita"><Bold size={16} /></button>
        <button type="button" class="p-1.5 rounded hover:bg-[--border] transition-colors" class:bg-[--border]={editor.isActive('italic')} onclick={() => editor!.chain().focus().toggleItalic().run()} aria-label="Cursiva"><Italic size={16} /></button>
        <button type="button" class="p-1.5 rounded hover:bg-[--border] transition-colors" class:bg-[--border]={editor.isActive('underline')} onclick={() => editor!.chain().focus().toggleUnderline().run()} aria-label="Subrayado"><UnderlineIcon size={16} /></button>
        <button type="button" class="p-1.5 rounded hover:bg-[--border] transition-colors" class:bg-[--border]={editor.isActive('strike')} onclick={() => editor!.chain().focus().toggleStrike().run()} aria-label="Tachado"><Strikethrough size={16} /></button>
        <div class="w-px h-5 bg-[--border] mx-1"></div>
        <button type="button" class="p-1.5 rounded hover:bg-[--border] transition-colors" class:bg-[--border]={editor.isActive('heading', { level: 1 })} onclick={() => editor!.chain().focus().toggleHeading({ level: 1 }).run()} aria-label="H1"><Heading1 size={16} /></button>
        <button type="button" class="p-1.5 rounded hover:bg-[--border] transition-colors" class:bg-[--border]={editor.isActive('heading', { level: 2 })} onclick={() => editor!.chain().focus().toggleHeading({ level: 2 }).run()} aria-label="H2"><Heading2 size={16} /></button>
        <button type="button" class="p-1.5 rounded hover:bg-[--border] transition-colors" class:bg-[--border]={editor.isActive('heading', { level: 3 })} onclick={() => editor!.chain().focus().toggleHeading({ level: 3 }).run()} aria-label="H3"><Heading3 size={16} /></button>
        <div class="w-px h-5 bg-[--border] mx-1"></div>
        <button type="button" class="p-1.5 rounded hover:bg-[--border] transition-colors" class:bg-[--border]={editor.isActive('bulletList')} onclick={() => editor!.chain().focus().toggleBulletList().run()} aria-label="Lista"><List size={16} /></button>
        <button type="button" class="p-1.5 rounded hover:bg-[--border] transition-colors" class:bg-[--border]={editor.isActive('orderedList')} onclick={() => editor!.chain().focus().toggleOrderedList().run()} aria-label="Lista numerada"><ListOrdered size={16} /></button>
        <button type="button" class="p-1.5 rounded hover:bg-[--border] transition-colors" class:bg-[--border]={editor.isActive('taskList')} onclick={() => editor!.chain().focus().toggleTaskList().run()} aria-label="Tareas">☑</button>
        <div class="w-px h-5 bg-[--border] mx-1"></div>
        <button type="button" class="p-1.5 rounded hover:bg-[--border] transition-colors" class:bg-[--border]={editor.isActive('blockquote')} onclick={() => editor!.chain().focus().toggleBlockquote().run()} aria-label="Cita"><Quote size={16} /></button>
        <button type="button" class="p-1.5 rounded hover:bg-[--border] transition-colors" class:bg-[--border]={editor.isActive('code')} onclick={() => editor!.chain().focus().toggleCode().run()} aria-label="Código"><Code size={16} /></button>
        <button type="button" class="p-1.5 rounded hover:bg-[--border] transition-colors" onclick={() => editor!.chain().focus().setHorizontalRule().run()} aria-label="Separador"><Minus size={16} /></button>
        <button type="button" class="p-1.5 rounded hover:bg-[--border] transition-colors" onclick={() => editor!.chain().focus().setHardBreak().run()} aria-label="Salto de línea"><CornerDownRight size={16} /></button>
        <div class="w-px h-5 bg-[--border] mx-1"></div>
        <button type="button" class="p-1.5 rounded hover:bg-[--border] transition-colors" onclick={() => editor!.chain().focus().undo().run()} disabled={!editor!.can().undo()} aria-label="Deshacer"><Undo2 size={16} /></button>
        <button type="button" class="p-1.5 rounded hover:bg-[--border] transition-colors" onclick={() => editor!.chain().focus().redo().run()} disabled={!editor!.can().redo()} aria-label="Rehacer"><Redo2 size={16} /></button>
      </div>
    {/if}
    <div bind:this={editorEl}></div>
  </div>
</div>
