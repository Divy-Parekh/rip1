import React from 'react';
import * as Diff from 'diff';
import clsx from 'clsx';

interface DiffViewerProps {
  oldText: string;
  newText: string;
  title?: string;
}

const DiffViewer: React.FC<DiffViewerProps> = ({ oldText, newText, title }) => {
  // Calculate diffs on lines to be cleaner for lists
  const diffs = Diff.diffLines(oldText || '', newText || '');
  
  // Check if there are any changes
  const hasChanges = diffs.some(part => part.added || part.removed);

  if (!hasChanges) {
    return (
        <div className="mb-4 border border-gray-200 rounded-lg overflow-hidden">
            {title && <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 font-medium text-gray-700 text-sm">{title}</div>}
            <div className="p-4 text-gray-500 italic text-sm bg-white">No changes detected.</div>
        </div>
    );
  }

  return (
    <div className="mb-4 border border-gray-200 rounded-lg overflow-hidden shadow-sm">
      {title && <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 font-medium text-gray-700 text-sm flex justify-between items-center">
          <span>{title}</span>
          <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full">Modified</span>
      </div>}
      <div className="font-mono text-sm bg-white p-0 overflow-x-auto max-h-96 overflow-y-auto">
        {diffs.map((part, index) => {
            if (!part.added && !part.removed) {
                // Context lines (unchanged), truncate if too long? For now keep all.
                return (
                    <div key={index} className="px-4 py-1 text-gray-500 flex border-b border-gray-50 last:border-0 hover:bg-gray-50">
                         <span className="w-6 inline-block text-center select-none opacity-50"> </span>
                         <span className="whitespace-pre-wrap break-words">{part.value}</span>
                    </div>
                );
            }
            
            const colorClass = part.added ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800 line-through decoration-red-300 opacity-70';
            const symbol = part.added ? '+' : '-';
            
            return (
                <div key={index} className={clsx("px-4 py-1 flex border-b border-white/50", colorClass)}>
                    <span className="w-6 inline-block text-center select-none font-bold opacity-70">{symbol}</span>
                    <span className="whitespace-pre-wrap break-words">{part.value}</span>
                </div>
            );
        })}
      </div>
    </div>
  );
};

export default DiffViewer;
