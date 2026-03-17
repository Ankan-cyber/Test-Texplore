'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Upload, CheckCircle, XCircle, Loader2, FileImage } from 'lucide-react';
import { formatFileSize } from '@/lib/upload-utils';

export interface UploadFile {
  id: string;
  file: File;
  preview: string;
  progress: number;
  status: 'uploading' | 'success' | 'error';
  error?: string;
}

interface UploadPreviewCardProps {
  uploadFile: UploadFile;
  onCancel?: (id: string) => void;
  onRetry?: (id: string) => void;
}

export default function UploadPreviewCard({
  uploadFile,
  onCancel,
  onRetry,
}: UploadPreviewCardProps) {
  const getStatusIcon = () => {
    switch (uploadFile.status) {
      case 'uploading':
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Upload className="h-4 w-4" />;
    }
  };

  const getStatusText = () => {
    switch (uploadFile.status) {
      case 'uploading':
        return 'Uploading...';
      case 'success':
        return 'Uploaded';
      case 'error':
        return 'Failed';
      default:
        return 'Pending';
    }
  };

  const getStatusColor = () => {
    switch (uploadFile.status) {
      case 'uploading':
        return 'bg-blue-500';
      case 'success':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <Card className="group relative bg-white dark:bg-gray-800 rounded-lg border-2 border-dashed border-blue-300 dark:border-blue-600 hover:border-blue-400 dark:hover:border-blue-500 transition-all">
      {/* Image Preview */}
      <div className="aspect-square bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-t-lg overflow-hidden relative">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-indigo-400/20" />
          <div className="absolute top-4 left-4 w-8 h-8 border-2 border-blue-300 rounded-full" />
          <div className="absolute top-8 left-8 w-4 h-4 border-2 border-indigo-300 rounded-full" />
          <div className="absolute bottom-4 right-4 w-6 h-6 border-2 border-blue-300 rounded-full" />
        </div>

        {/* File Preview */}
        {uploadFile.preview ? (
          <img
            src={uploadFile.preview}
            alt={uploadFile.file.name}
            className="w-full h-full object-cover relative z-10"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center relative z-10">
            <div className="text-center">
              <FileImage className="h-12 w-12 text-blue-400 mx-auto mb-2" />
              <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                {uploadFile.file.name}
              </p>
            </div>
          </div>
        )}

        {/* Upload Overlay */}
        <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="bg-white/90 dark:bg-gray-800/90 rounded-lg p-3 backdrop-blur-sm">
            <div className="flex items-center gap-2">
              {getStatusIcon()}
              <span className="text-sm font-medium">{getStatusText()}</span>
            </div>
          </div>
        </div>

        {/* Status Badge */}
        <div className="absolute top-2 left-2">
          <Badge
            variant="secondary"
            className={`${getStatusColor()} text-white border-0`}
          >
            {getStatusIcon()}
            <span className="ml-1">{getStatusText()}</span>
          </Badge>
        </div>

        {/* Progress Bar */}
        {uploadFile.status === 'uploading' && (
          <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/50 to-transparent">
            <Progress value={uploadFile.progress} className="h-1 bg-white/20" />
            <p className="text-xs text-white mt-1 text-center">
              {uploadFile.progress}%
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex gap-1">
            {uploadFile.status === 'uploading' && onCancel && (
              <Button
                size="sm"
                variant="destructive"
                className="h-6 w-6 p-0 bg-red-500 hover:bg-red-600"
                onClick={(e) => {
                  e.stopPropagation();
                  onCancel(uploadFile.id);
                }}
              >
                <XCircle className="h-3 w-3" />
              </Button>
            )}
            {uploadFile.status === 'error' && onRetry && (
              <Button
                size="sm"
                variant="secondary"
                className="h-6 w-6 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  onRetry(uploadFile.id);
                }}
              >
                <Upload className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* File Info */}
      <CardContent className="p-3">
        <h3 className="font-medium text-sm truncate text-gray-900 dark:text-white">
          {uploadFile.file.name}
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
          {formatFileSize(uploadFile.file.size)}
        </p>

        {/* Error Message */}
        {uploadFile.status === 'error' && uploadFile.error && (
          <p className="text-xs text-red-500 mt-1 truncate">
            {uploadFile.error}
          </p>
        )}

        <div className="flex items-center justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
          <span>Uploading...</span>
          <span>{uploadFile.progress}%</span>
        </div>
      </CardContent>
    </Card>
  );
}
