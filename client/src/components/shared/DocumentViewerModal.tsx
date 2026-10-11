'use client';

import React from 'react';
import { Modal } from './Modal';
import { FileText, Download, ExternalLink } from 'lucide-react';
import { buildSalarySlipUrl } from '../../lib/api';

import { Tooltip } from '../ui/tooltip';

interface DocumentViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentPath?: string;
  applicantName: string;
}

export const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({
  isOpen,
  onClose,
  documentPath,
  applicantName,
}) => {
  if (!documentPath) return null;

  const fullUrl = buildSalarySlipUrl(documentPath);

  const isPdf = documentPath.toLowerCase().endsWith('.pdf');
  const isImage = /\.(jpe?g|png|webp)$/i.test(documentPath);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Salary Slip — ${applicantName}`}
      maxWidth="4xl"
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-200">
          <div className="flex items-center space-x-2 text-sm text-slate-700">
            <FileText className="w-4 h-4 text-indigo-600" />
            <span className="font-medium truncate max-w-md">{documentPath.split('/').pop()}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Tooltip content="Open this document in a new tab for full-screen inspection" position="bottom">
              <a
                href={fullUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-md transition-colors cursor-pointer hover-lift"
              >
                <ExternalLink className="w-3.5 h-3.5 mr-1" />
                Open In New Tab
              </a>
            </Tooltip>
            <Tooltip content="Download a copy of this salary document directly to your device" position="bottom">
              <a
                href={fullUrl}
                download
                className="inline-flex items-center px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors shadow-xs cursor-pointer hover-lift"
              >
                <Download className="w-3.5 h-3.5 mr-1" />
                Download
              </a>
            </Tooltip>
          </div>
        </div>

        {/* Document Render Area */}
        <div className="w-full h-[500px] border border-slate-200 rounded-lg overflow-hidden bg-slate-100 flex items-center justify-center">
          {isImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={fullUrl}
              alt="Salary Slip Document"
              className="max-h-full max-w-full object-contain p-2"
            />
          ) : isPdf ? (
            <iframe
              src={fullUrl}
              title="Salary Slip PDF Viewer"
              className="w-full h-full border-0"
            />
          ) : (
            <iframe
              src={fullUrl}
              title="Salary Document Preview"
              className="w-full h-full border-0 bg-white"
            />
          )}
        </div>
      </div>
    </Modal>
  );
};
