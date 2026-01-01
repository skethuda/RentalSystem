import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Underline from '@tiptap/extension-underline';
import { useMemo, useEffect, useRef } from 'react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export default function RichTextEditor({ 
  value, 
  onChange, 
  placeholder = 'Açıklama yazın...',
  className = ''
}: RichTextEditorProps) {
  // Value'yu güvenli hale getir
  const safeValue = useMemo(() => {
    return value || '';
  }, [value]);
  
  // Sonsuz döngüyü önlemek için ref
  const isUpdatingFromProps = useRef(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-[#D4AF37] underline hover:text-[#B8960D]',
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg',
        },
      }),
    ],
    content: safeValue,
    onUpdate: ({ editor }) => {
      // Props'tan gelen güncellemeleri ignore et
      if (isUpdatingFromProps.current) {
        isUpdatingFromProps.current = false;
        return;
      }
      const htmlContent = editor.getHTML();
      console.log('RichTextEditor: onUpdate tetiklendi, HTML:', htmlContent);
      onChange(htmlContent);
    },
    onBlur: ({ editor }) => {
      // Odaktan çıkınca da kaydet (son değişiklikleri yakalamak için)
      const htmlContent = editor.getHTML();
      console.log('RichTextEditor: onBlur tetiklendi, HTML:', htmlContent);
      onChange(htmlContent);
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[200px] px-4 py-3',
      },
    },
  });

  // Value değiştiğinde editor'ı güncelle (sadece dışarıdan değiştiğinde)
  useEffect(() => {
    if (editor) {
      const currentContent = editor.getHTML();
      // Sadece gerçekten farklıysa güncelle
      if (safeValue !== currentContent) {
        isUpdatingFromProps.current = true;
        editor.commands.setContent(safeValue);
      }
    }
  }, [safeValue, editor]);

  if (!editor) {
    return (
      <div className={`w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 ${className}`}>
        <p className="text-sm text-gray-500">Editör yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className={`rich-text-editor ${className}`}>
      <style>{`
        .rich-text-editor .ProseMirror {
          min-height: 200px;
          font-size: 14px;
          line-height: 1.6;
        }
        .rich-text-editor .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #9ca3af;
          pointer-events: none;
          height: 0;
        }
        .rich-text-editor .ProseMirror:focus {
          outline: none;
        }
        .rich-text-editor .ProseMirror h1 {
          font-size: 1.5rem;
          font-weight: bold;
          margin-top: 1rem;
          margin-bottom: 0.5rem;
        }
        .rich-text-editor .ProseMirror h2 {
          font-size: 1.25rem;
          font-weight: bold;
          margin-top: 0.75rem;
          margin-bottom: 0.5rem;
        }
        .rich-text-editor .ProseMirror h3 {
          font-size: 1.125rem;
          font-weight: bold;
          margin-top: 0.5rem;
          margin-bottom: 0.25rem;
        }
        .rich-text-editor .ProseMirror ul, .rich-text-editor .ProseMirror ol {
          padding-left: 1.5rem;
          margin: 0.5rem 0;
        }
        .rich-text-editor .ProseMirror ul {
          list-style-type: disc;
        }
        .rich-text-editor .ProseMirror ol {
          list-style-type: decimal;
        }
        .rich-text-editor .ProseMirror a {
          color: #D4AF37;
          text-decoration: underline;
        }
        .rich-text-editor .ProseMirror a:hover {
          color: #B8960D;
        }
        .rich-text-editor .ProseMirror img {
          max-width: 100%;
          height: auto;
          border-radius: 0.5rem;
          margin: 1rem 0;
        }
      `}</style>
      
      {/* Toolbar */}
      <div className="border border-gray-300 rounded-t-lg bg-gray-50 p-2 flex flex-wrap items-center gap-2">
        {/* Başlıklar */}
        <div className="flex items-center gap-1 border-r border-gray-300 pr-2">
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={`p-2 rounded hover:bg-gray-200 transition-colors ${
              editor.isActive('heading', { level: 1 }) ? 'bg-gray-200 text-[#D4AF37]' : 'text-gray-700'
            }`}
            title="Başlık 1"
          >
            <i className="ri-h-1 text-lg"></i>
          </button>
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`p-2 rounded hover:bg-gray-200 transition-colors ${
              editor.isActive('heading', { level: 2 }) ? 'bg-gray-200 text-[#D4AF37]' : 'text-gray-700'
            }`}
            title="Başlık 2"
          >
            <i className="ri-h-2 text-lg"></i>
          </button>
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={`p-2 rounded hover:bg-gray-200 transition-colors ${
              editor.isActive('heading', { level: 3 }) ? 'bg-gray-200 text-[#D4AF37]' : 'text-gray-700'
            }`}
            title="Başlık 3"
          >
            <i className="ri-h-3 text-lg"></i>
          </button>
        </div>

        {/* Metin Formatlama */}
        <div className="flex items-center gap-1 border-r border-gray-300 pr-2">
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`p-2 rounded hover:bg-gray-200 transition-colors ${
              editor.isActive('bold') ? 'bg-gray-200 text-[#D4AF37]' : 'text-gray-700'
            }`}
            title="Kalın"
          >
            <i className="ri-bold text-lg"></i>
          </button>
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-2 rounded hover:bg-gray-200 transition-colors ${
              editor.isActive('italic') ? 'bg-gray-200 text-[#D4AF37]' : 'text-gray-700'
            }`}
            title="İtalik"
          >
            <i className="ri-italic text-lg"></i>
          </button>
          <button
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={`p-2 rounded hover:bg-gray-200 transition-colors ${
              editor.isActive('underline') ? 'bg-gray-200 text-[#D4AF37]' : 'text-gray-700'
            }`}
            title="Altı Çizili"
          >
            <i className="ri-underline text-lg"></i>
          </button>
          <button
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={`p-2 rounded hover:bg-gray-200 transition-colors ${
              editor.isActive('strike') ? 'bg-gray-200 text-[#D4AF37]' : 'text-gray-700'
            }`}
            title="Üstü Çizili"
          >
            <i className="ri-strikethrough text-lg"></i>
          </button>
        </div>

        {/* Listeler */}
        <div className="flex items-center gap-1 border-r border-gray-300 pr-2">
          <button
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`p-2 rounded hover:bg-gray-200 transition-colors ${
              editor.isActive('bulletList') ? 'bg-gray-200 text-[#D4AF37]' : 'text-gray-700'
            }`}
            title="Madde İşareti"
          >
            <i className="ri-list-unordered text-lg"></i>
          </button>
          <button
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`p-2 rounded hover:bg-gray-200 transition-colors ${
              editor.isActive('orderedList') ? 'bg-gray-200 text-[#D4AF37]' : 'text-gray-700'
            }`}
            title="Numaralı Liste"
          >
            <i className="ri-list-ordered text-lg"></i>
          </button>
        </div>

        {/* Hizalama */}
        <div className="flex items-center gap-1 border-r border-gray-300 pr-2">
          <button
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            className={`p-2 rounded hover:bg-gray-200 transition-colors ${
              editor.isActive({ textAlign: 'left' }) ? 'bg-gray-200 text-[#D4AF37]' : 'text-gray-700'
            }`}
            title="Sola Hizala"
          >
            <i className="ri-align-left text-lg"></i>
          </button>
          <button
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            className={`p-2 rounded hover:bg-gray-200 transition-colors ${
              editor.isActive({ textAlign: 'center' }) ? 'bg-gray-200 text-[#D4AF37]' : 'text-gray-700'
            }`}
            title="Ortala"
          >
            <i className="ri-align-center text-lg"></i>
          </button>
          <button
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            className={`p-2 rounded hover:bg-gray-200 transition-colors ${
              editor.isActive({ textAlign: 'right' }) ? 'bg-gray-200 text-[#D4AF37]' : 'text-gray-700'
            }`}
            title="Sağa Hizala"
          >
            <i className="ri-align-right text-lg"></i>
          </button>
        </div>

        {/* Link */}
        <button
          onClick={() => {
            const url = window.prompt('Link URL\'si girin:');
            if (url) {
              editor.chain().focus().setLink({ href: url }).run();
            }
          }}
          className={`p-2 rounded hover:bg-gray-200 transition-colors ${
            editor.isActive('link') ? 'bg-gray-200 text-[#D4AF37]' : 'text-gray-700'
          }`}
          title="Link Ekle"
        >
          <i className="ri-links-line text-lg"></i>
        </button>

        {/* Temizle */}
        <button
          onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
          className="p-2 rounded hover:bg-gray-200 transition-colors text-gray-700"
          title="Formatı Temizle"
        >
          <i className="ri-format-clear text-lg"></i>
        </button>
      </div>

      {/* Editor Content */}
      <div className="border border-t-0 border-gray-300 rounded-b-lg bg-white">
        <EditorContent 
          editor={editor} 
          data-placeholder={placeholder}
        />
      </div>
    </div>
  );
}
