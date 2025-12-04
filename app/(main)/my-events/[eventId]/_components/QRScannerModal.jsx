import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { api } from '@/convex/_generated/api';
import { useConvexMutation } from '@/hooks/useConvexQuery';
import { Loader2, QrCode } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { toast } from 'sonner';

const QRScannerModal = ({ isOpen, onClose }) => {

  const [scannerReady, setScannerReady] = useState(false);
  const [error, setError] = useState(null);

  const { mutate: checkInAttendee, isLoading: isChecking } = useConvexMutation(api.registration.checkInAttendee)

  const handleCheckIn = async (qrCode) => {
    try {
      const result = await checkInAttendee({ qrCode });

      if (result.success) {
        toast.success("✅ Check-in successful!");
        onClose();
      } else {
        toast.error(result.message || "Check-in failed");
      }
    } catch (error) {
      toast.error(error.message || "Invalid QR code");
    }
  };

  useEffect(() => {
        let scanner = null;
        let mounted = true;

        const initScanner = async () => {
            if (!isOpen) return;

            // 1. Clear previous state
            setScannerReady(false);
            setError(null);

            try {
                // Dynamically import the library
                const { Html5QrcodeScanner } = await import("html5-qrcode");

                if (!mounted) return;

                // Ensure the mount point element exists before initialization
                const element = document.getElementById("qr-reader");
                if (!element) {
                    throw new Error("QR reader mount point not found.");
                }

                console.log("Creating scanner instance...");

                // Configuration for mobile:
                // We prioritize 'environment' (back camera), but if that fails, 
                // we allow the library to select any available video source with 'video: true'.
                const config = {
                    fps: 10,
                    qrbox: { width: 250, height: 250 },
                    aspectRatio: 1.0,
                    showTorchButtonIfSupported: true,
                    // *** REVISED CONSTRAINTS FOR MOBILE COMPATIBILITY ***
                    videoConstraints: {
                        // Option 1: Try back camera with a generic resolution requirement
                        facingMode: "environment", 
                        // Fallback option if facingMode fails (lets browser pick camera)
                        // It seems html5-qrcode's render method handles this flexibility well.
                        // Setting it to 'environment' is usually the best first attempt.
                    },
                };

                scanner = new Html5QrcodeScanner("qr-reader", config, /* verbose= */ false);

                const onScanSuccess = (decodedText) => {
                    if (!mounted) return;
                    console.log("QR Code detected:", decodedText);
                    
                    // Stop the scanner immediately upon successful scan to prevent re-scanning
                    if (scanner) {
                        // The clear() function handles stopping the camera stream
                        scanner.clear().catch(err => console.error("Error clearing scanner:", err));
                        scanner = null; // Mark as cleared
                    }
                    setScannerReady(false);
                    handleCheckIn(decodedText);
                };

                const onScanError = (error) => {
                    // Only log non-transient errors
                    if (error && !error.includes("NotFoundException")) {
                        console.debug("Transient scan error (expected):", error);
                    }
                };
                
                // Start the scanner rendering
                await scanner.render(onScanSuccess, onScanError);
                
                // Only set ready if render completed without throwing an error
                if (mounted) {
                    setScannerReady(true);
                    console.log("Scanner rendered successfully");
                }

            } catch (error) {
                console.error("Failed to initialize scanner:", error);
                
                // Explicitly clear/stop if initialization failed to release hardware
                if (scanner) {
                    scanner.clear().catch(err => console.error("Error during failed init cleanup:", err));
                    scanner = null;
                }
                
                // Check if the error is the specific mobile issue
                if (error.name === 'NotReadableError' || error.message.includes('Could not start video source')) {
                    setError("Camera failed to start. This often happens if the camera is in use by another app. Please close other camera apps and reopen the scanner.");
                    toast.error("Camera stream blocked. Try closing background apps.");
                } else if (error.name === 'NotAllowedError' || error.message.includes('permission')) {
                    setError("Camera permission denied. Please enable camera access in your browser settings.");
                } else {
                    setError(`Failed to start camera: ${error.message}. Please try manual entry.`);
                    toast.error("Camera failed to start.");
                }
                
                setScannerReady(false);
            }
        };

        // If the modal is open, start the scanner
        if (isOpen) {
            initScanner();
        }

        // Cleanup function for when the component unmounts or modal closes
        return () => {
            mounted = false;
            // Clear the scanner to stop the video stream gracefully
            if (scanner) {
                console.log("Cleaning up scanner...");
                scanner.clear().catch(err => console.error("Error during cleanup:", err));
            }
            // Reset states on close
            setScannerReady(false);
        };
    }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-purple-500" />
            Check-In Attendee
          </DialogTitle>
          <DialogDescription>
            Scan QR code or enter ticket ID manually
          </DialogDescription>
        </DialogHeader>

        {error ? (
          <div className="text-red-500 text-sm">{error}</div>
        ) : (
          <>
            <div
              id="qr-reader"
              className="w-full"
              style={{ minHeight: "350px" }}
            ></div>
            {!scannerReady && (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
                <span className="ml-2 text-sm text-muted-foreground">
                  Starting camera...
                </span>
              </div>
            )}
            <p className="text-sm text-muted-foreground text-center">
              {scannerReady
                ? "Position the QR code within the frame"
                : "Please allow camera access when prompted"}
            </p>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default QRScannerModal
