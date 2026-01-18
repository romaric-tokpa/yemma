import { useRef } from 'react'
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'

export function RichTextEditor({ value, onChange, placeholder, ...props }) {
  const quillRef = useRef(null)

  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'color': [] }, { 'background': [] }],
      ['link'],
      ['clean']
    ],
  }

  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet',
    'color', 'background',
    'link'
  ]

  return (
    <div className="rich-text-editor [&_.ql-container]:min-h-[150px] [&_.ql-editor]:min-h-[150px] [&_.ql-editor]:text-sm">
      <ReactQuill
        ref={quillRef}
        theme="snow"
        value={value || ''}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
        className="bg-background"
        {...props}
      />
      <style>{`
        .rich-text-editor .ql-container {
          min-height: 150px;
          font-size: 14px;
        }
        .rich-text-editor .ql-editor {
          min-height: 150px;
        }
        .rich-text-editor .ql-snow .ql-stroke {
          stroke: hsl(var(--foreground));
        }
        .rich-text-editor .ql-snow .ql-fill {
          fill: hsl(var(--foreground));
        }
        .rich-text-editor .ql-snow .ql-picker-label {
          color: hsl(var(--foreground));
        }
        .rich-text-editor .ql-snow .ql-editor {
          color: hsl(var(--foreground));
        }
        .rich-text-editor .ql-snow .ql-tooltip {
          background-color: hsl(var(--background));
          border-color: hsl(var(--border));
        }
      `}</style>
    </div>
  )
}
