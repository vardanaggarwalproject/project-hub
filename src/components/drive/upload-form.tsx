'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Upload, Loader2, ExternalLink } from 'lucide-react';

interface UploadFormProps {
  projectId: string;
  userRole: 'admin' | 'developer' | 'tester' | 'designer';
  userEmail?: string; // To check if user is himanshu064@gmail.com
  onUploadSuccess?: (asset: any) => void;
}

export function UploadForm({ projectId, userRole, userEmail, onUploadSuccess }: UploadFormProps) {
  const isOwner = userEmail === 'himanshu064@gmail.com';
  const [file, setFile] = useState<File | null>(null);
  const [assetName, setAssetName] = useState('');
  const [folderType, setFolderType] = useState<'client' | 'internal'>('internal');
  const [isUploading, setIsUploading] = useState(false);
  const [isAdminConnected, setIsAdminConnected] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    checkAdminConnection();
  }, []);

  const checkAdminConnection = async () => {
    try {
      setIsChecking(true);
      const response = await fetch('/api/drive/check-connection');
      const data = await response.json();
      setIsAdminConnected(data.connected);
    } catch (error) {
      console.error('Error checking admin connection:', error);
      setIsAdminConnected(false);
    } finally {
      setIsChecking(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      if (!assetName) {
        setAssetName(selectedFile.name);
      }
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a file');
      return;
    }

    if (!assetName.trim()) {
      toast.error('Please enter an asset name');
      return;
    }

    try {
      setIsUploading(true);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('projectId', projectId);
      formData.append('folderType', folderType);
      formData.append('assetName', assetName);

      const response = await fetch('/api/drive/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      toast.success('File uploaded successfully!');

      // Reset form
      setFile(null);
      setAssetName('');
      setFolderType('internal');

      // Reset file input
      const fileInput = document.getElementById('file-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

      // Callback
      if (onUploadSuccess) {
        onUploadSuccess(data.asset);
      }

    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to upload file');
    } finally {
      setIsUploading(false);
    }
  };

  if (isChecking) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">Checking connection...</span>
      </div>
    );
  }

  if (!isAdminConnected) {
    return (
      <div className="space-y-4 text-center">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Google Drive Not Connected</h3>
          <p className="text-sm text-muted-foreground">
            {isOwner
              ? 'You need to connect your Google Drive account. All uploads will be stored in your Drive.'
              : 'The system administrator (himanshu064@gmail.com) needs to connect Google Drive first. Please contact them.'}
          </p>
        </div>
        {isOwner && (
          <Button onClick={() => window.location.href = '/api/auth/google'} className="w-full">
            <ExternalLink className="mr-2 h-4 w-4" />
            Connect Google Drive
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="asset-name">Asset Name</Label>
        <Input
          id="asset-name"
          placeholder="e.g., Logo Set"
          value={assetName}
          onChange={(e) => setAssetName(e.target.value)}
          disabled={isUploading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="file-upload">Select File</Label>
        <Input
          id="file-upload"
          type="file"
          onChange={handleFileChange}
          disabled={isUploading}
        />
        {file && (
          <p className="text-sm text-muted-foreground">
            Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="folder-type">Upload to</Label>
        <Select
          value={folderType}
          onValueChange={(value: 'client' | 'internal') => setFolderType(value)}
          disabled={isUploading}
        >
          <SelectTrigger id="folder-type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="internal">Internal Folder</SelectItem>
            {userRole === 'admin' && (
              <SelectItem value="client">Client Folder</SelectItem>
            )}
          </SelectContent>
        </Select>
        {userRole !== 'admin' && folderType === 'client' && (
          <p className="text-sm text-destructive">
            Only admins can upload to client folder
          </p>
        )}
      </div>

      <Button
        onClick={handleUpload}
        disabled={!file || !assetName.trim() || isUploading}
        className="w-full"
      >
        {isUploading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Uploading...
          </>
        ) : (
          <>
            <Upload className="mr-2 h-4 w-4" />
            Upload to Google Drive
          </>
        )}
      </Button>
    </div>
  );
}
