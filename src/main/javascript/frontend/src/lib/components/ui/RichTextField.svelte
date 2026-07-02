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
    AlertCircle,
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
    /**
     * Optional inline error message rendered beneath the editor, visually
     * matching `FormField.svelte`. Suppressed when `touched === false`.
     * Existing call sites that omit `error` and `touched` are unaffected.
     */
    error?: string;
    /** Optional helper text shown when there is no active error. */
    hint?: string;
    /**
     * When provided, also renders a `current/max` counter badge beneath
     * the editor and highlights it red when exceeded. The actual length
     * check is purely visual — the limit is enforced server-side.
     */
    counter?: number;
    /**
     * When provided, controls when the error is rendered.
     * - `undefined` → legacy behavior (always show `error` when set)
     * - `false` → suppress (user has not yet interacted)
     * - `true` → show whatever `error` evaluates to
     */
    touched?: boolean;
  }

  let {
    name,
    label,
    value = '',
    placeholder = 'Escribe el contenido aquí...',
    required = false,
    minHeightClass = 'min-h-[160px]',
    onchange,
    error,
    hint,
    counter,
    touched,
  }: Props = $props();

  let editorEl = $state<HTMLDivElement | undefined>();
  let editor = $state<Editor | undefined>();
  let html = $state(value ?? '');
  let syncing = false;
  let toolbarState = $state({
    bold: false,
    italic: false,
    underline: false,
    strike: false,
    heading1: false,
    heading2: false,
    heading3: false,
    bulletList: false,
    orderedList: false,
    taskList: false,
    blockquote: false,
    code: false,
    canUndo: false,
    canRedo: false,
  });

  // ---------------------------------------------------------------------
  // Inline error / counter (visual parity with `FormField.svelte`)
  // ---------------------------------------------------------------------
  // Strip HTML tags so the counter and emptiness checks reflect the
  // *content* the user sees, not the wrapping markup TipTap emits.
  function stripHtml(s: string): string {
    return s
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .trim();
  }

  let plainText = $derived(stripHtml(html ?? ''));
  let currentLength = $derived(plainText.length);
  let overLimit = $derived(typeof counter === 'number' && currentLength > counter);
  let showError = $derived((touched === undefined || touched === true) && !!error);

  const editorClass = `tiptap-editor prose prose-sm max-w-none focus:outline-none ${minHeightClass} px-4 py-3 text-md text-[--text-primary]`;

  function syncToolbarState(currentEditor: Editor) {
    toolbarState = {
      bold: currentEditor.isActive('bold'),
      italic: currentEditor.isActive('italic'),
      underline: currentEditor.isActive('underline'),
      strike: currentEditor.isActive('strike'),
      heading1: currentEditor.isActive('heading', { level: 1 }),
      heading2: currentEditor.isActive('heading', { level: 2 }),
      heading3: currentEditor.isActive('heading', { level: 3 }),
      bulletList: currentEditor.isActive('bulletList'),
      orderedList: currentEditor.isActive('orderedList'),
      taskList: currentEditor.isActive('taskList'),
      blockquote: currentEditor.isActive('blockquote'),
      code: currentEditor.isActive('code'),
      canUndo: currentEditor.can().undo(),
      canRedo: currentEditor.can().redo(),
    };
  }

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
      onCreate: ({ editor: currentEditor }) => {
        syncToolbarState(currentEditor);
      },
      onTransaction: ({ editor: currentEditor }) => {
        syncToolbarState(currentEditor);
        if (syncing) return;
        html = currentEditor.getHTML();
        onchange?.(html);
      },
      onSelectionUpdate: ({ editor: currentEditor }) => {
        syncToolbarState(currentEditor);
      },
      onFocus: ({ editor: currentEditor }) => {
        syncToolbarState(currentEditor);
      },
      onBlur: ({ editor: currentEditor }) => {
        syncToolbarState(currentEditor);
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
  :global(.tiptap-editor ol ol){
    list-style-type: lower-alpha;
    padding-left: 1.75rem;
    margin: 0.5rem 0;
  }
  :global(.tiptap-editor ol ol ol){
    list-style-type: lower-roman;
    padding-left: 2rem;
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
    font-family: var(--font-sans),sans-serif;
    font-size: var(--text-sm)
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
    padding: 8pt;
    font-size: var(--text-sm);
    font-family: var(--font-mono),monospace;

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
    font-family: var(--font-sans),sans-serif;
    font-size: var(--text-sm);
    pointer-events: none;
    height: 0;
  }

  :global(.tiptap-editor p) {
    font-family: var(--font-sans),sans-serif;
    font-size: var(--text-sm);
    color: var(--text-primary);
  }

  :global(.tiptap-editor h1){
    font-family: var(--font-heading),serif;
    font-size: var(--text-xl);
  }
  :global(.tiptap-editor h2){
    font-family: var(--font-subheading),serif;
    font-size: var(--text-md);
  }
  :global(.tiptap-editor h3){
    font-family: var(--font-subheading),serif;
    font-size: var(--text-sm);

  }
</style>

<input type="hidden" {name} value={html} />
<div class="space-y-1">
  <label class="block text-md font-bold mb-1" style="font-family: var(--font-subheading);">
    {label}
    {#if required}<span class="text-red-500">*</span>{/if}
  </label>
  <div
    class="rounded-lg border overflow-y-scroll overflow-x-hidden resize-y scrollbar-none transition-colors duration-150"
    class:border-red-400={showError}
    class:border-[--border]={!showError}
    style="background: var(--bg-surface);"
  >
    {#if editor}
      <div class="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-[--border] bg-[--bg-secondary]">
        <button type="button" class="p-1.5 rounded hover:bg-gray-500 transition-colors" class:bg-gray-500={toolbarState.bold}
                 onclick={() => editor!.chain().focus().toggleBold().run()} aria-label="Negrita"><Bold size={16} /></button>
        <button type="button" class="p-1.5 rounded hover:bg-gray-500 transition-colors" class:bg-gray-500={toolbarState.italic} onclick={() => editor!.chain().focus().toggleItalic().run()} aria-label="Cursiva"><Italic size={16} /></button>
        <button type="button" class="p-1.5 rounded hover:bg-gray-500 transition-colors" class:bg-gray-500={toolbarState.underline} onclick={() => editor!.chain().focus().toggleUnderline().run()} aria-label="Subrayado"><UnderlineIcon size={16} /></button>
        <button type="button" class="p-1.5 rounded hover:bg-gray-500 transition-colors" class:bg-gray-500={toolbarState.strike} onclick={() => editor!.chain().focus().toggleStrike().run()} aria-label="Tachado"><Strikethrough size={16} /></button>
        <div class="w-px h-5 bg-[--border] mx-1"></div>
        <button type="button" class="p-1.5 rounded hover:bg-gray-500 transition-colors" class:bg-gray-500={toolbarState.heading1} onclick={() => editor!.chain().focus().toggleHeading({ level: 1 }).run()} aria-label="H1"><Heading1 size={16} /></button>
        <button type="button" class="p-1.5 rounded hover:bg-gray-500 transition-colors" class:bg-gray-500={toolbarState.heading2} onclick={() => editor!.chain().focus().toggleHeading({ level: 2 }).run()} aria-label="H2"><Heading2 size={16} /></button>
        <button type="button" class="p-1.5 rounded hover:bg-gray-500 transition-colors" class:bg-gray-500={toolbarState.heading3} onclick={() => editor!.chain().focus().toggleHeading({ level: 3 }).run()} aria-label="H3"><Heading3 size={16} /></button>
        <div class="w-px h-5 bg-[--border] mx-1"></div>
        <button type="button" class="p-1.5 rounded hover:bg-gray-500 transition-colors" class:bg-gray-500={toolbarState.bulletList} onclick={() => editor!.chain().focus().toggleBulletList().run()} aria-label="Lista"><List size={16} /></button>
        <button type="button" class="p-1.5 rounded hover:bg-gray-500 transition-colors" class:bg-gray-500={toolbarState.orderedList} onclick={() => editor!.chain().focus().toggleOrderedList().run()} aria-label="Lista numerada"><ListOrdered size={16} /></button>
        <button type="button" class="p-1.5 rounded hover:bg-gray-500 transition-colors" class:bg-gray-500={toolbarState.taskList} onclick={() => editor!.chain().focus().toggleTaskList().run()} aria-label="Tareas">☑</button>
        <div class="w-px h-5 bg-[--border] mx-1"></div>
        <button type="button" class="p-1.5 rounded hover:bg-gray-500 transition-colors" class:bg-gray-500={toolbarState.blockquote} onclick={() => editor!.chain().focus().toggleBlockquote().run()} aria-label="Cita"><Quote size={16} /></button>
        <button type="button" class="p-1.5 rounded hover:bg-gray-500 transition-colors" class:bg-gray-500={toolbarState.code} onclick={() => editor!.chain().focus().toggleCode().run()} aria-label="Código"><Code size={16} /></button>
        <button type="button" class="p-1.5 rounded hover:bg-gray-500 transition-colors" onclick={() => editor!.chain().focus().setHorizontalRule().run()} aria-label="Separador"><Minus size={16} /></button>
        <button type="button" class="p-1.5 rounded hover:bg-gray-500 transition-colors" onclick={() => editor!.chain().focus().setHardBreak().run()} aria-label="Salto de línea"><CornerDownRight size={16} /></button>
        <div class="w-px h-5 bg-[--border] mx-1"></div>
        <button type="button" class="p-1.5 rounded hover:bg-gray-500 transition-colors" onclick={() => editor!.chain().focus().undo().run()} disabled={!toolbarState.canUndo} aria-label="Deshacer"><Undo2 size={16} /></button>
        <button type="button" class="p-1.5 rounded hover:bg-gray-500 transition-colors" onclick={() => editor!.chain().focus().redo().run()} disabled={!toolbarState.canRedo} aria-label="Rehacer"><Redo2 size={16} /></button>
      </div>
    {/if}
    <div bind:this={editorEl}></div>
  </div>

  <div class="flex items-start justify-between gap-2">
    <div class="flex-1 min-w-0">
      {#if hint && !showError}
        <p class="mt-1 text-xs text-[--text-muted]">{hint}</p>
      {/if}
      {#if showError}
        <p class="mt-1 text-xs text-red-500 flex items-center gap-1">
          <AlertCircle size={11} /> {error}
        </p>
      {/if}
    </div>
    {#if typeof counter === 'number'}
      <p
        class="mt-1 text-xs flex-shrink-0 tabular-nums"
        class:text-red-500={overLimit}
        class:text-[--text-muted]={!overLimit}
      >
        {currentLength}/{counter}
      </p>
    {/if}
  </div>
</div>
