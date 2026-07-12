'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { Bold, Italic, Strikethrough, List, ListOrdered } from 'lucide-react';
import { useEffect } from 'react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
}

const MenuBar = ({ editor }: { editor: any }) => {
  if (!editor) {
    return null;
  }

  return (
    <div className="flex items-center gap-1 p-2 border-b border-slate-200 bg-slate-50 flex-wrap">
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={!editor.can().chain().focus().toggleBold().run()}
        className={`p-2 rounded-lg transition-colors ${editor.isActive('bold') ? 'bg-red-100 text-red-600' : 'text-slate-600 hover:bg-slate-200 hover:text-slate-900'}`}
        title="Bold"
      >
        <Bold className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={!editor.can().chain().focus().toggleItalic().run()}
        className={`p-2 rounded-lg transition-colors ${editor.isActive('italic') ? 'bg-red-100 text-red-600' : 'text-slate-600 hover:bg-slate-200 hover:text-slate-900'}`}
        title="Italic"
      >
        <Italic className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleStrike().run()}
        disabled={!editor.can().chain().focus().toggleStrike().run()}
        className={`p-2 rounded-lg transition-colors ${editor.isActive('strike') ? 'bg-red-100 text-red-600' : 'text-slate-600 hover:bg-slate-200 hover:text-slate-900'}`}
        title="Strikethrough"
      >
        <Strikethrough className="w-4 h-4" />
      </button>
      
      <div className="w-px h-6 bg-slate-300 mx-1"></div>

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`p-2 rounded-lg transition-colors ${editor.isActive('bulletList') ? 'bg-red-100 text-red-600' : 'text-slate-600 hover:bg-slate-200 hover:text-slate-900'}`}
        title="Bullet List"
      >
        <List className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`p-2 rounded-lg transition-colors ${editor.isActive('orderedList') ? 'bg-red-100 text-red-600' : 'text-slate-600 hover:bg-slate-200 hover:text-slate-900'}`}
        title="Numbered List"
      >
        <ListOrdered className="w-4 h-4" />
      </button>
    </div>
  );
};

export default function RichTextEditor({ value, onChange, placeholder = 'Tulis sesuatu...', minHeight = 'min-h-[150px]' }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder,
        emptyEditorClass: 'is-editor-empty',
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      // Prevent updating if content is just empty tags to simulate empty string
      const html = editor.getHTML();
      if (html === '<p></p>') {
        onChange('');
      } else {
        onChange(html);
      }
    },
    editorProps: {
      attributes: {
        class: `prose prose-sm max-w-none focus:outline-none p-4 ${minHeight} text-slate-700 bg-white leading-relaxed marker:text-slate-400 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5`,
      },
    },
  });

  // Keep editor content in sync with external value prop
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      // Avoid resetting if it's effectively empty
      if (value === '' && editor.getHTML() === '<p></p>') return;
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  return (
    <div className="flex flex-col border border-slate-200 rounded-xl overflow-hidden bg-white focus-within:border-red-500 transition-colors [&_.is-editor-empty:first-child::before]:text-slate-400 [&_.is-editor-empty:first-child::before]:content-[attr(data-placeholder)] [&_.is-editor-empty:first-child::before]:float-left [&_.is-editor-empty:first-child::before]:pointer-events-none [&_.is-editor-empty:first-child::before]:h-0">
      <MenuBar editor={editor} />
      <div className="flex-1 cursor-text bg-white" onClick={() => editor?.commands.focus()}>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
