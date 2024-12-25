import { useState, useEffect } from "react";
import { User } from "firebase/auth";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Dialog, DialogContent, DialogClose } from "./ui/dialog";
import { ZoomIn, ZoomOut, X } from "lucide-react";

interface ImageGalleryProps {
  user: User;
}

interface ImageItem {
  name: string;
  url: string;
}

export default function ImageGallery({ user }: ImageGalleryProps) {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [selectedImage, setSelectedImage] = useState<ImageItem | null>(null);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const response = await fetch(
          `http://localhost:3001/images/${user.uid}`
        );
        if (response.ok) {
          const imageItems = await response.json();
          setImages(imageItems);
        } else {
          console.error("Failed to fetch images");
        }
      } catch (error) {
        console.error("Error fetching images:", error);
      }
    };

    fetchImages();
  }, [user]);

  const handleImageClick = (image: ImageItem) => {
    setSelectedImage(image);
    setZoom(1);
  };

  const handleZoomIn = () => {
    setZoom((prevZoom) => Math.min(prevZoom + 0.1, 3));
  };

  const handleZoomOut = () => {
    setZoom((prevZoom) => Math.max(prevZoom - 0.1, 0.1));
  };

  const handleDelete = async (image: ImageItem) => {
    try {
      const response = await fetch(
        `http://localhost:3001/image/${user.uid}/${image.name}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        setImages((prevImages) =>
          prevImages.filter((img) => img.name !== image.name)
        );
        if (selectedImage && selectedImage.name === image.name) {
          setSelectedImage(null);
        }
      } else {
        console.error("Failed to delete image");
      }
    } catch (error) {
      console.error("Error deleting image:", error);
    }
  };

  return (
    <Card className="w-full max-w-7xl mx-auto">
      <CardContent className="p-6">
        <motion.div
          layout
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
        >
          <AnimatePresence>
            {images.map((image) => (
              <motion.div
                key={image.name}
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="relative group"
              >
                <img
                  src={image.url}
                  alt={image.name}
                  className="w-full h-48 object-cover rounded-md cursor-pointer transition-transform group-hover:scale-105"
                  onClick={() => handleImageClick(image)}
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleDelete(image)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </CardContent>
      <Dialog
        open={!!selectedImage}
        onOpenChange={() => setSelectedImage(null)}
      >
        <DialogContent className="max-w-4xl w-full">
          {selectedImage && (
            <div className="relative">
              <img
                src={selectedImage.url}
                alt={selectedImage.name}
                className="w-full h-auto max-h-[80vh] object-contain transition-transform"
                style={{ transform: `scale(${zoom})` }}
              />
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                <Button variant="secondary" size="icon" onClick={handleZoomIn}>
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button variant="secondary" size="icon" onClick={handleZoomOut}>
                  <ZoomOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
          <DialogClose asChild>
            <Button
              variant="outline"
              size="icon"
              className="absolute top-2 right-2"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogClose>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
