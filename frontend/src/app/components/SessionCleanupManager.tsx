"use client";
import { useEffect, useRef } from "react";
import { usePipelineStore } from "../../store/pipelineStore";

export default function SessionCleanupManager() {
  const uploadedFileIds = usePipelineStore((state) => state.uploadedFileIds);
  // Store the ref of files to avoid closures in event listener capturing old state
  const filesRef = useRef<string[]>([]);
  
  useEffect(() => {
    filesRef.current = uploadedFileIds;
  }, [uploadedFileIds]);

  useEffect(() => {
    const cleanup = () => {
      filesRef.current.forEach(id => {
        fetch(`/api/dataset/cleanup?file_id=${encodeURIComponent(id)}`, {
          method: 'DELETE',
          keepalive: true
        }).catch(err => console.error("Cleanup failed", err));
      });
    };
    window.addEventListener('beforeunload', cleanup);
    return () => {
      window.removeEventListener('beforeunload', cleanup);
    };
  }, []);

  return null;
}
