import { BrowserMultiFormatReader, type IScannerControls } from "@zxing/browser";
import { AlertCircle, Camera, Keyboard, LoaderCircle, ScanLine } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { lookupBarcode } from "../services/openFoodFacts";
import type { FoodDraft } from "../types";
import { Modal } from "./Modal";

interface BarcodeScannerModalProps {
  open: boolean;
  onClose: () => void;
  onFound: (food: FoodDraft) => void;
}

export function BarcodeScannerModal({ open, onClose, onFound }: BarcodeScannerModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const [barcode, setBarcode] = useState("");
  const [cameraActive, setCameraActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const stopCamera = () => {
    controlsRef.current?.stop();
    controlsRef.current = null;
    setCameraActive(false);
  };

  useEffect(() => {
    if (!open) {
      stopCamera();
      setError("");
      setBarcode("");
    }
    return stopCamera;
  }, [open]);

  const findProduct = async (value: string) => {
    if (!value.trim() || loading) return;
    setLoading(true);
    setError("");
    stopCamera();
    try {
      const food = await lookupBarcode(value.trim());
      onFound(food);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "We couldn't look up that product.");
    } finally {
      setLoading(false);
    }
  };

  const startCamera = async () => {
    setError("");
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Camera scanning is not supported here. Enter the barcode below instead.");
      return;
    }
    try {
      const reader = new BrowserMultiFormatReader();
      const devices = await BrowserMultiFormatReader.listVideoInputDevices();
      const preferred = devices.find((device) => /back|rear|environment/i.test(device.label));
      setCameraActive(true);
      controlsRef.current = await reader.decodeFromVideoDevice(
        preferred?.deviceId,
        videoRef.current!,
        (result) => {
          if (result) {
            const value = result.getText();
            setBarcode(value);
            void findProduct(value);
          }
        }
      );
    } catch (caught) {
      setCameraActive(false);
      const message =
        caught instanceof DOMException && caught.name === "NotAllowedError"
          ? "Camera permission was denied. Allow camera access or enter the barcode manually."
          : "The camera could not start. You can enter the barcode manually.";
      setError(message);
    }
  };

  return (
    <Modal open={open} title="Scan a food" eyebrow="Open Food Facts lookup" onClose={onClose}>
      <div className="scanner">
        <div className={`scanner-viewport ${cameraActive ? "is-active" : ""}`}>
          <video ref={videoRef} muted playsInline />
          {!cameraActive && (
            <div className="scanner-placeholder">
              <span><ScanLine size={34} /></span>
              <strong>Point your camera at a barcode</strong>
              <p>Nutrition details will be ready for you to review before anything is saved.</p>
              <button className="button button--primary" type="button" onClick={startCamera}>
                <Camera size={18} />
                Open camera
              </button>
            </div>
          )}
          {cameraActive && <div className="scan-target" aria-hidden="true" />}
        </div>

        <div className="scanner-divider"><span>or enter it</span></div>

        <form
          className="barcode-form"
          onSubmit={(event) => {
            event.preventDefault();
            void findProduct(barcode);
          }}
        >
          <label className="field">
            <span><Keyboard size={15} /> Barcode number</span>
            <input
              inputMode="numeric"
              value={barcode}
              onChange={(event) => setBarcode(event.target.value.replace(/\D/g, ""))}
              placeholder="e.g. 737628064502"
            />
          </label>
          <button className="button button--secondary" type="submit" disabled={!barcode || loading}>
            {loading ? <LoaderCircle className="spin" size={18} /> : <ScanLine size={18} />}
            {loading ? "Looking up..." : "Look up"}
          </button>
        </form>

        {error && (
          <div className="inline-alert" role="alert">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}
        <p className="fine-print">
          Product data comes from the community-maintained Open Food Facts database. Always check
          the label before saving.
        </p>
      </div>
    </Modal>
  );
}
