import { useRef, useState } from "react";
import { Paperclip, X, FileText, Image, Music, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FilePreview {
  file: File;
  url: string;
  type: 'image' | 'document' | 'audio' | 'video' | 'other';
}

interface FileUploadProps {
  onFilesSelected: (files: FilePreview[]) => void;
  selectedFiles: FilePreview[];
  onRemoveFile: (index: number) => void;
}

const getFileType = (file: File): FilePreview['type'] => {
  if (file.type.startsWith('image/')) return 'image';
  if (file.type.startsWith('audio/')) return 'audio';
  if (file.type.startsWith('video/')) return 'video';
  if (file.type.includes('pdf') || file.type.includes('document') || file.type.includes('text')) return 'document';
  return 'other';
};

const getFileIcon = (type: FilePreview['type']) => {
  switch (type) {
    case 'image': return Image;
    case 'document': return FileText;
    case 'audio': return Music;
    case 'video': return Video;
    default: return FileText;
  }
};

export function FileUpload({ onFilesSelected, selectedFiles, onRemoveFile }: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    const newFiles: FilePreview[] = files.map(file => ({
      file,
      url: URL.createObjectURL(file),
      type: getFileType(file)
    }));

    onFilesSelected([...selectedFiles, ...newFiles]);
    
    // Reset the input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleFileChange}
        accept="image/*,audio/*,video/*,.pdf,.doc,.docx,.txt"
      />
      
      <Button
        variant="ghost"
        size="sm"
        onClick={handleFileSelect}
        className="hover:bg-gmail-blue/10"
      >
        <Paperclip className="h-4 w-4" />
      </Button>

      {selectedFiles.length > 0 && (
        <div className="mt-2 p-2 bg-muted/50 rounded-lg">
          <div className="space-y-2">
            {selectedFiles.map((filePreview, index) => {
              const Icon = getFileIcon(filePreview.type);
              
              return (
                <div key={index} className="flex items-center gap-2 p-2 bg-background rounded border">
                  {filePreview.type === 'image' ? (
                    <img 
                      src={filePreview.url} 
                      alt={filePreview.file.name}
                      className="w-10 h-10 object-cover rounded"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-accent/50 rounded flex items-center justify-center">
                      <Icon className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{filePreview.file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(filePreview.file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemoveFile(index)}
                    className="h-8 w-8 p-0 hover:bg-destructive/10"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}