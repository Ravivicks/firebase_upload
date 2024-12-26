/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect } from "react";
import { User } from "@supabase/supabase-js";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import {
  Dialog,
  DialogContent,
  DialogClose,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Progress } from "./ui/progress"; // Assuming you have a Progress component
import { ZoomIn, ZoomOut, X } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import { useNavigate } from "react-router-dom";

interface ImageGalleryProps {
  user: User;
}

interface ImageItem {
  id: string;
  name: string;
  url: string;
}

export default function ImageGallery({ user }: ImageGalleryProps) {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [selectedImage, setSelectedImage] = useState<ImageItem | null>(null);
  const [zoom, setZoom] = useState(1);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [imageToDelete, setImageToDelete] = useState<ImageItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const navigate = useNavigate();

  const fetchImages = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("images")
        .select("*")
        .eq("user_id", user.id);

      if (error) throw error;

      const totalImages = data?.length || 0;
      if (totalImages === 0) {
        setImages([]);
        setLoading(false);
        return;
      }

      const loadedImages: ImageItem[] = [];
      for (let i = 0; i < totalImages; i++) {
        const image = data![i];
        loadedImages.push(image);

        // Update progress
        setProgress(Math.round(((i + 1) / totalImages) * 100));
      }

      setImages(loadedImages);
    } catch (error) {
      console.error("Error fetching images:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchImages();
  }, [user.id]);

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

  const handleDeleteClick = (image: ImageItem) => {
    setImageToDelete(image);
    setDeleteConfirmOpen(true);
  };

  const handleDelete = async () => {
    if (!imageToDelete) return;

    try {
      const { error } = await supabase
        .from("images")
        .delete()
        .eq("id", imageToDelete.id);

      if (error) throw error;

      setImages((prevImages) =>
        prevImages.filter((img) => img.id !== imageToDelete.id)
      );
      if (selectedImage && selectedImage.id === imageToDelete.id) {
        setSelectedImage(null);
      }
      setDeleteConfirmOpen(false);
    } catch (error) {
      console.error("Error deleting image:", error);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {loading ? (
        <div className="text-center">
          <p className="text-xl mb-4">Loading images...</p>
          <Progress value={progress} max={100} className="w-1/2 mx-auto" />
        </div>
      ) : (
        <Card className="w-full">
          <CardContent className="p-6">
            {images.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-xl mb-4">No images available</p>
                <Button onClick={() => navigate("/upload")}>
                  Upload Your First Image
                </Button>
              </div>
            ) : (
              <motion.div
                layout
                className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
              >
                <AnimatePresence>
                  {images.map((image) => (
                    <motion.div
                      key={image.id}
                      layout
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="relative group"
                    >
                      <img
                        src={image.url}
                        alt={image.name}
                        className="w-full h-48 object-fit border rounded-md cursor-pointer transition-transform group-hover:scale-105"
                        onClick={() => handleImageClick(image)}
                      />
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleDeleteClick(image)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Image Dialog */}
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
          </DialogHeader>
          <p>
            Are you sure you want to delete this image? This action cannot be
            undone.
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteConfirmOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
