'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Upload, CheckCircle, XCircle, AlertCircle, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface UserImageType {
  id: string;
  userId: string;
  url: string;
  createdAt: Date;
  updatedAt: Date;
}

interface ImageUploadWrapperProps {
  userImage?: UserImageType | null;
  userId?: string;
  userImageStatus?: string;
}

export function ImageUploadWrapper({ userImage, userId, userImageStatus }: ImageUploadWrapperProps) {
  const t = useTranslations('ImageUpload');
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [currentImage, setCurrentImage] = useState<UserImageType | null>(userImage || null);
  const [currentStatus, setCurrentStatus] = useState<string>(userImageStatus || 'none');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setUploading(true);
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const data = await response.json();
      setCurrentImage(data.image);
      setCurrentStatus('pending');
      setProgress(100);
      
      setTimeout(() => setProgress(0), 1000);

    } catch (err: any) {
      setError(err.message);
      setProgress(0);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteImage = async () => {
    if (!currentImage) return;

    setDeleting(true);
    try {
      const response = await fetch('/api/upload', {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Delete failed');
      }

      setCurrentImage(null);
      setCurrentStatus('none');
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setDeleting(false);
    }
  };

  const getStatusIcon = () => {
    switch (currentStatus) {
      case 'success': return <CheckCircle className="h-8 w-8 text-green-600" />;
      case 'rejected': return <XCircle className="h-8 w-8 text-red-600" />;
      case 'pending': return <AlertCircle className="h-8 w-8 text-yellow-600" />;
      default: return <Upload className="h-8 w-8" />;
    }
  };

  const getStatusText = () => {
    switch (currentStatus) {
      case 'success': return t('approved');
      case 'rejected': return t('rejected');
      case 'pending': return t('pendingReview');
      default: return t('noImageUploaded');
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 justify-center">
          {getStatusIcon()}
          {t('title')}
        </CardTitle>
        <CardDescription>{t('description')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {currentImage && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{t('currentStatus')}:</span>
              <span className={`text-sm font-semibold ${
                currentStatus === 'success' ? 'text-green-600' :
                currentStatus === 'rejected' ? 'text-red-600' : 
                currentStatus === 'pending' ? 'text-yellow-600' : 'text-gray-600'
              }`}>
                {getStatusText()}
              </span>
            </div>
            <div className="border rounded-lg overflow-hidden relative">
              <img 
                src={currentImage.url} 
                alt="Uploaded document"
                className="w-full h-48 object-cover"
              />
              <Button
                onClick={handleDeleteImage}
                disabled={deleting}
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {uploading && (
          <div className="space-y-2">
            <Progress value={progress} className="w-full" />
            <p className="text-sm text-center text-muted-foreground">
              {t('uploading')}... {progress}%
            </p>
          </div>
        )}

        <div className="space-y-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            disabled={uploading || deleting || !!currentImage}
          />
          
          <div className="flex gap-2">
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading || deleting || !!currentImage}
              className="flex-1"
            >
              <Upload className="h-4 w-4 mr-2" />
              {currentImage ? t('replace') : t('upload')}
            </Button>
            
            {currentImage && (
              <Button
                onClick={handleDeleteImage}
                disabled={deleting}
                variant="outline"
                className="flex-1"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {t('delete')}
              </Button>
            )}
          </div>

          <p className="text-xs text-muted-foreground text-center">
            {t('supportedFormats')}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}