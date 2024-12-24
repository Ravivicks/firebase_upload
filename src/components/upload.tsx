import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { storage, db } from "../lib/firebase";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { collection, addDoc } from "firebase/firestore";
import { Button } from "../components/ui/button";
import { Progress } from "../components/ui/progress";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../components/ui/card";

export function Upload({ userId }: { userId: string }) {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<{ [key: string]: number }>({});

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles((prevFiles) => [...prevFiles, ...acceptedFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  const handleUpload = async () => {
    setUploading(true);
    for (const file of files) {
      const storageRef = ref(storage, `users/${userId}/${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const percent =
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setProgress((prev) => ({ ...prev, [file.name]: percent }));
        },
        (error) => console.error("Error uploading file:", error),
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          await addDoc(collection(db, "images"), {
            userId,
            name: file.name,
            url: downloadURL,
            createdAt: new Date(),
          });
        }
      );
    }
    setUploading(false);
    setFiles([]);
    setProgress({});
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Upload Images</CardTitle>
        <CardDescription>
          Drag and drop images or click to select
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-md p-4 ${
            isDragActive ? "border-primary" : "border-gray-300"
          }`}
        >
          <input {...getInputProps()} />
          <p className="text-center">
            {isDragActive
              ? "Drop the files here..."
              : "Drag and drop files here, or click to select files"}
          </p>
        </div>
        {files.length > 0 && (
          <div className="mt-4 space-y-2">
            {files.map((file, index) => (
              <div key={index} className="flex items-center justify-between">
                <span>{file.name}</span>
                <Progress value={progress[file.name] || 0} className="w-1/2" />
              </div>
            ))}
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button
          onClick={handleUpload}
          disabled={files.length === 0 || uploading}
          className="w-full"
        >
          {uploading ? "Uploading..." : "Upload"}
        </Button>
      </CardFooter>
    </Card>
  );
}
