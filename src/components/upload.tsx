import { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabaseClient";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Upload, X } from "lucide-react";
import { toast } from "../hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface ImageUploadProps {
  user: User;
}

interface FileWithProgress extends File {
  progress: number;
  preview: string;
  status: "pending" | "uploading" | "completed" | "error";
  id: string;
}

export default function ImageUpload({ user }: ImageUploadProps) {
  const [files, setFiles] = useState<FileWithProgress[]>([]);
  const [uploading, setUploading] = useState(false);
  const navigate = useNavigate();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles((prevFiles) => [
      ...prevFiles,
      ...acceptedFiles.map((file) =>
        Object.assign(file, {
          progress: 0,
          preview: URL.createObjectURL(file),
          status: "pending" as const,
          id: `${file.name}-${file.lastModified}-${Math.random()
            .toString(36)
            .substr(2, 9)}`,
        })
      ),
    ]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  const removeFile = (file: FileWithProgress) => {
    URL.revokeObjectURL(file.preview);
    setFiles((prevFiles) => prevFiles.filter((f) => f !== file));
  };

  const updateFileProgress = (
    file: FileWithProgress,
    progress: number,
    status: FileWithProgress["status"]
  ) => {
    setFiles((prevFiles) =>
      prevFiles.map((f) => (f.id === file.id ? { ...f, progress, status } : f))
    );
  };

  const uploadFile = async (file: FileWithProgress) => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
    const filePath = `${user.id}/${fileName}`;

    try {
      // Indicate upload has started
      updateFileProgress(file, 0, "uploading");

      // Upload the file to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from("images")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get the public URL of the uploaded file
      const { data: publicUrlData } = supabase.storage
        .from("images")
        .getPublicUrl(filePath);

      if (!publicUrlData) {
        throw new Error("Failed to get public URL.");
      }

      // Insert file details into the database
      const { error: dbError } = await supabase.from("images").insert({
        name: fileName,
        url: publicUrlData.publicUrl,
        user_id: user.id,
      });

      if (dbError) {
        throw dbError;
      }

      // Indicate upload is completed
      updateFileProgress(file, 100, "completed");

      toast({
        title: "Upload successful",
        description: `${file.name} has been uploaded successfully.`,
      });
    } catch (error) {
      console.error("Error uploading file:", error);
      updateFileProgress(file, 0, "error");

      toast({
        title: "Upload failed",
        description: `Failed to upload ${file.name}. Please try again.`,
        variant: "destructive",
      });
    }
  };

  const uploadFiles = async () => {
    setUploading(true);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.status !== "completed" && file.status !== "error") {
        await uploadFile(file);
      }
      setFiles((prevFiles) =>
        prevFiles.map((f, index) => ({
          ...f,
          status: index <= i ? f.status : "pending",
          progress: index < i ? 100 : index === i ? f.progress : 0,
        }))
      );
    }

    setUploading(false);
  };

  useEffect(() => {
    return () => files.forEach((file) => URL.revokeObjectURL(file.preview));
  }, [files]);

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardContent className="p-6">
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive ? "border-primary bg-primary/10" : "border-gray-300"
          }`}
        >
          <input {...getInputProps()} />
          <Upload className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-sm text-gray-500">
            {isDragActive
              ? "Drop the files here ..."
              : "Drag 'n' drop some files here, or click to select files"}
          </p>
        </div>
        <AnimatePresence>
          {files.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mt-8"
            >
              <h3 className="text-lg font-semibold mb-4">Selected Files:</h3>
              <div className="space-y-4">
                {files.map((file) => (
                  <motion.div
                    key={file.id}
                    layout
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="relative flex items-center space-x-4"
                  >
                    <img
                      src={file.preview}
                      alt={file.name}
                      className="w-16 h-16 object-cover rounded-md"
                    />
                    <div className="flex-grow">
                      <p className="text-sm font-medium">{file.name}</p>
                      <div className="relative pt-1">
                        <div className="flex mb-2 items-center justify-between">
                          <div>
                            <span
                              className={`text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full ${
                                file.status === "completed"
                                  ? "text-green-600 bg-green-200"
                                  : file.status === "error"
                                  ? "text-red-600 bg-red-200"
                                  : "text-primary bg-primary-foreground"
                              }`}
                            >
                              {file.status === "completed"
                                ? "Completed"
                                : file.status === "error"
                                ? "Error"
                                : `${file.progress.toFixed(0)}%`}
                            </span>
                          </div>
                        </div>
                        <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-primary-foreground">
                          <motion.div
                            style={{ width: `${file.progress}%` }}
                            className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${
                              file.status === "completed"
                                ? "bg-green-500"
                                : file.status === "error"
                                ? "bg-red-500"
                                : "bg-primary"
                            }`}
                            initial={{ width: "0%" }}
                            animate={{ width: `${file.progress}%` }}
                            transition={{ duration: 0.5 }}
                          />
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="destructive"
                      size="icon"
                      className="shrink-0"
                      onClick={() => removeFile(file)}
                      disabled={file.status === "uploading"}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </motion.div>
                ))}
              </div>
              <Button
                onClick={
                  files.every((file) => file.status === "completed")
                    ? () => navigate("/gallery") // Navigate to the gallery page
                    : uploadFiles
                }
                disabled={uploading}
                className="mt-6 w-full"
              >
                {files.every((file) => file.status === "completed")
                  ? "Go to Gallery"
                  : uploading
                  ? `Uploading file ${
                      files.findIndex((f) => f.status === "uploading") + 1
                    } of ${files.length}...`
                  : "Upload Files"}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
