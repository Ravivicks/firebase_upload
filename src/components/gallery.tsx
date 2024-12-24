import { useState, useEffect } from "react";
import { db, storage } from "../lib/firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { ref, deleteObject } from "firebase/storage";
import { Button } from "../components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "../components/ui/dialog";

interface Image {
  id: string;
  name: string;
  url: string;
}

export function Gallery({ userId }: { userId: string }) {
  const [images, setImages] = useState<Image[]>([]);

  useEffect(() => {
    const q = query(collection(db, "images"), where("userId", "==", userId));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const imagesData: Image[] = [];
      querySnapshot.forEach((doc) => {
        imagesData.push({ id: doc.id, ...doc.data() } as Image);
      });
      setImages(imagesData);
    });

    return () => unsubscribe();
  }, [userId]);

  const handleDelete = async (image: Image) => {
    try {
      await deleteDoc(doc(db, "images", image.id));
      const storageRef = ref(storage, `users/${userId}/${image.name}`);
      await deleteObject(storageRef);
    } catch (error) {
      console.error("Error deleting image:", error);
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {images.map((image) => (
        <Dialog key={image.id}>
          <DialogTrigger asChild>
            <div className="relative aspect-square cursor-pointer">
              <img src={image.url} alt={image.name} className="rounded-md" />
            </div>
          </DialogTrigger>
          <DialogContent className="max-w-3xl">
            <div className="relative aspect-video">
              <img src={image.url} alt={image.name} />
            </div>
            <Button onClick={() => handleDelete(image)} variant="destructive">
              Delete
            </Button>
          </DialogContent>
        </Dialog>
      ))}
    </div>
  );
}
