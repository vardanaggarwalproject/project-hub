import { useState, useEffect } from 'react';

interface DriveFolders {
  projectFolderId: string;
  clientFolderId: string;
  internalFolderId: string;
}

export function useDriveFolders(projectId: string) {
  const [folders, setFolders] = useState<DriveFolders | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkFolders = async () => {
    try {
      setIsChecking(true);
      setError(null);

      const response = await fetch('/api/drive/check-folders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ projectId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to check folders');
      }

      setFolders(data.folders);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    if (projectId) {
      checkFolders();
    }
  }, [projectId]);

  return {
    folders,
    isChecking,
    error,
    refetch: checkFolders,
  };
}
