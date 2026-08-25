"use client";

import { useRef, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import "react-quill-new/dist/quill.snow.css";

const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false, loading: () => <div className="h-64 flex items-center justify-center text-gray-400">Loading editor...</div> });

interface ComposeEditorProps {
  subject: string;
  setSubject: (v: string) => void;
  body: string;
  setBody: (v: string) => void;
  delay: string;
  setDelay: (v: string) => void;
  hourlyLimit: string;
  setHourlyLimit: (v: string) => void;
  onImageUploadClick: () => void;
  attachmentNode?: React.ReactNode;
  availableVariables?: string[];
  recipientCount?: number;
}

export function ComposeEditor({
  subject,
  setSubject,
  body,
  setBody,
  delay,
  setDelay,
  hourlyLimit,
  setHourlyLimit,
  onImageUploadClick,
  attachmentNode,
  availableVariables = [],
  recipientCount = 0
}: ComposeEditorProps) {

  const parsedHourlyLimit = parseInt(hourlyLimit);
  const showWarning = recipientCount > 0 && parsedHourlyLimit > 0 && recipientCount > parsedHourlyLimit;
  const totalHours = Math.ceil(recipientCount / parsedHourlyLimit);
  const totalDays = Math.ceil(totalHours / 24);

  const modules = useMemo(() => ({
    toolbar: {
      container: [
        [{ 'header': [1, 2, false] }],
        ['bold', 'italic', 'underline', 'strike', 'blockquote'],
        [{ 'list': 'ordered' }, { 'list': 'bullet' }, { 'indent': '-1' }, { 'indent': '+1' }],
        ['link', 'image'],
        ['clean']
      ],
      handlers: {
        // Route the toolbar's image button to the attachment flow instead of
        // Quill's default handler, which base64-encodes the file straight
        // into the body HTML with no size limit or styling.
        image: onImageUploadClick
      }
    },
  }), [onImageUploadClick]);

  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike', 'blockquote',
    'list', 'indent',
    'link', 'image'
  ];

  return (
    <>
      {/* Subject Row */}
      <div className="flex items-center border-b border-gray-100 dark:border-gray-800 pb-4">
        <div className="w-[120px] text-[15px] font-medium text-gray-700 dark:text-gray-300 shrink-0">Subject</div>
        <input
          type="text"
          placeholder="Subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="flex-1 bg-transparent border-none outline-none text-[15px] placeholder:text-gray-400 dark:text-white"
        />
      </div>

      {/* Delay & Hourly Limit Row */}
      <div className="flex flex-wrap items-center border-b border-gray-100 dark:border-gray-800 pb-4 gap-8 mt-4">
        <div className="flex items-center gap-3">
          <div className="text-[14px] font-medium text-gray-700 dark:text-gray-300 shrink-0">Delay between 2 emails</div>
          <input
            type="number"
            min="0"
            value={delay}
            onChange={(e) => setDelay(e.target.value)}
            className="w-[60px] px-2 py-1.5 bg-white dark:bg-dark-2 border border-gray-200 dark:border-gray-700 rounded-lg outline-none text-[14px] focus:border-[#10C35B] text-gray-700 dark:text-gray-200"
          />
        </div>
        <div className="flex items-center gap-3">
          <div className="text-[14px] font-medium text-gray-700 dark:text-gray-300 shrink-0">Hourly Limit</div>
          <input
            type="number"
            min="0"
            value={hourlyLimit}
            onChange={(e) => setHourlyLimit(e.target.value)}
            className="w-[60px] px-2 py-1.5 bg-white dark:bg-dark-2 border border-gray-200 dark:border-gray-700 rounded-lg outline-none text-[14px] focus:border-[#10C35B] text-gray-700 dark:text-gray-200"
          />
        </div>
      </div>

      {showWarning && (
        <div className="text-xs text-amber-500 font-medium mb-4 mt-2 bg-amber-50 dark:bg-amber-950/20 px-3 py-2 rounded-lg border border-amber-200 dark:border-amber-900 inline-block">
          At {hourlyLimit} emails/hr, this campaign will take {totalDays > 1 ? `${totalDays} days` : `${totalHours} hours`} to complete.
        </div>
      )}

      {/* Editor Workspace */}
      <div className="flex flex-col flex-1 mt-2 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-dark-2 transition-colors focus-within:border-gray-300 dark:focus-within:border-gray-700 relative">
        <div className="absolute top-2.5 right-4 z-10">
          <div className="relative group">
            <button type="button" className="text-sm font-medium text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 flex items-center gap-1 bg-white dark:bg-dark-3 px-2 py-1 rounded">
              {'{ }'} Variables
            </button>
            {availableVariables && availableVariables.length > 0 ? (
              <div className="hidden group-hover:block absolute top-full right-0 mt-1 w-48 bg-white dark:bg-dark-3 border border-gray-200 dark:border-gray-700 rounded-md shadow-[0_8px_30px_rgb(0,0,0,0.12)] overflow-hidden z-20">
                {availableVariables.map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setBody(body + ` {{${v}}} `)}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-2 transition-colors border-b border-gray-100 dark:border-gray-800 last:border-0"
                  >
                    {`{{${v}}}`}
                  </button>
                ))}
              </div>
            ) : (
              <div className="hidden group-hover:block absolute top-full right-0 mt-1 w-48 bg-white dark:bg-dark-3 border border-gray-200 dark:border-gray-700 rounded-md shadow-[0_8px_30px_rgb(0,0,0,0.12)] p-3 text-xs text-gray-400 z-20">
                Upload a CSV in the "To" field to see variables here.
              </div>
            )}
          </div>
        </div>

        <style jsx global>{`
          .quill {
            display: flex;
            flex-direction: column;
            border: none;
            height: 100%;
          }
          .ql-toolbar {
            border: none !important;
            border-bottom: 1px solid #E5E7EB !important;
            background: transparent;
            padding: 12px 16px !important;
          }
          .dark .ql-toolbar {
            border-bottom-color: #374151 !important;
          }
          .ql-container {
            border: none !important;
            flex: 1;
            font-family: inherit;
            font-size: 15px;
            background: transparent;
          }.ql-editor {
            min-height: 250px;
          }
          .dark .ql-editor {
            color: #f3f4f6;
          }
          .dark .ql-stroke {
            stroke: #9ca3af;
          }
          .dark .ql-fill {
            fill: #9ca3af;
          }
          .dark .ql-picker {
            color: #9ca3af;
          }
        `}</style>
        <ReactQuill
          theme="snow"
          value={body}
          onChange={setBody}
          modules={modules}
          formats={formats}
          placeholder="Type your message here... Use {{variable}} for mail merge."
        />
      </div>

      {attachmentNode && (
        <div className="mt-4">
          {attachmentNode}
        </div>
      )}
    </>
  );
}
