'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Camera, X, RefreshCw, CheckCircle, AlertCircle, FileUp, Loader2 } from 'lucide-react';
import { extractDocumentDetails } from '@/lib/gemini';

interface NICScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (details: {
    name: string;
    nic: string;
    address: string;
    frontPhoto: string;
    backPhoto: string;
  }) => void;
}

type ScanStep = 'front' | 'back' | 'scanning' | 'verify';

export default function NICScanner({ isOpen, onClose, onConfirm }: NICScannerProps) {
  const [step, setStep] = useState<ScanStep>('front');
  
  // Document Selection
  const [docType, setDocType] = useState<'nic' | 'dl'>('nic');
  const [isOldNic, setIsOldNic] = useState<boolean>(false);
  
  // Photo states
  const [frontPhoto, setFrontPhoto] = useState<string>('');
  const [backPhoto, setBackPhoto] = useState<string>('');
  
  // Extracted details states
  const [name, setName] = useState<string>('');
  const [nic, setNic] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  
  // Camera stream states
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string>('');
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  
  // Loading & error states
  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string>('');
  const [zoomedPhoto, setZoomedPhoto] = useState<string | null>(null);

  // Start the camera stream
  const startCamera = async () => {
    setCameraError('');
    try {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment', // Prefer rear camera on mobile devices
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });
      
      setStream(mediaStream);
      setIsCameraActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: any) {
      console.warn("Camera access failed:", err);
      setCameraError("Unable to access camera. Please upload an image or check permissions.");
      setIsCameraActive(false);
    }
  };

  // Stop the camera stream
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCameraActive(false);
  };

  // Manage camera streaming based on current step and modal status
  useEffect(() => {
    if (isOpen && (step === 'front' || step === 'back')) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, step]);

  // Process selected file / capture and compress it to base64
  const processCapturedImage = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxDim = 800; // Resize to max 800px dimension
        
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const base64 = canvas.toDataURL('image/jpeg', 0.7); // Compress JPEG quality 0.7
          
          if (step === 'front') {
            setFrontPhoto(base64);
            if (docType === 'dl') {
              triggerOcrScan(base64, '');
            } else {
              setStep('back');
            }
          } else if (step === 'back') {
            setBackPhoto(base64);
            triggerOcrScan(frontPhoto, base64);
          }
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Capture snapshot from video stream
  const handleCapture = () => {
    if (videoRef.current && isCameraActive) {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const base64 = canvas.toDataURL('image/jpeg', 0.7);
        
        if (step === 'front') {
          setFrontPhoto(base64);
          if (docType === 'dl') {
            triggerOcrScan(base64, '');
          } else {
            setStep('back');
          }
        } else if (step === 'back') {
          setBackPhoto(base64);
          triggerOcrScan(frontPhoto, base64);
        }
      }
    }
  };

  // Handle manual file upload selection
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processCapturedImage(file);
      e.target.value = ''; // Reset value to allow same-file selection if needed
    }
  };

  // Call Gemini API to extract details
  const triggerOcrScan = async (front: string, back: string) => {
    setStep('scanning');
    setIsExtracting(true);
    setApiError('');
    try {
      const details = await extractDocumentDetails(docType, isOldNic, front, back);
      setName(details.name);
      setNic(details.nic);
      setAddress(details.address);
      setStep('verify');
    } catch (err: any) {
      console.error(err);
      setApiError(err.message || "Failed to parse document. Please verify your internet connection or try again.");
      setStep('verify'); // Transition to verify step so user can fill in manually anyway
    } finally {
      setIsExtracting(false);
    }
  };

  // Return to scanning start
  const handleReset = () => {
    setFrontPhoto('');
    setBackPhoto('');
    setName('');
    setNic('');
    setAddress('');
    setApiError('');
    setStep('front');
  };

  // Reset all states when the modal is opened
  useEffect(() => {
    if (isOpen) {
      handleReset();
    }
  }, [isOpen]);

  // Submit final verified values
  const handleConfirm = () => {
    onConfirm({
      name,
      nic,
      address,
      frontPhoto,
      backPhoto
    });
    onClose();
    handleReset();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" style={{ zIndex: 1000 }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-box fade-up" style={{ maxWidth: 600, padding: 0, overflow: 'hidden', border: '1px solid var(--border)' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
          <div>
            <h3 style={{ fontWeight: 800, fontSize: 16, color: 'var(--text-900)' }}>
              {step === 'front' && (docType === 'nic' ? "Scan NIC Front" : "Scan Driving License")}
              {step === 'back' && "Scan NIC Back"}
              {step === 'scanning' && "Scanning & OCR Processing"}
              {step === 'verify' && "Verify Extracted Details"}
            </h3>
            <p style={{ fontSize: 12, color: 'var(--text-500)', marginTop: 2 }}>
              {step === 'front' && (docType === 'nic' ? "Capture or upload the front side of the national identity card" : "Capture or upload the front side of the driving license")}
              {step === 'back' && "Capture or upload the back side of the national identity card"}
              {step === 'scanning' && "Extracting details using Gemini 2.5 Flash..."}
              {step === 'verify' && "Review extracted fields, correct errors, and apply"}
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'var(--bg-alt)', border: 'none', cursor: 'pointer', color: 'var(--text-600)', borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={16} />
          </button>
        </div>

        {/* Step Indicator */}
        <div style={{ display: 'flex', background: 'var(--surface-alt)', borderBottom: '1px solid var(--border)', padding: '10px 20px' }}>
          {[
            { label: 'Front Card', active: step === 'front', done: step !== 'front' },
            ...(docType === 'nic' ? [{ label: 'Back Card', active: step === 'back', done: step === 'scanning' || step === 'verify' }] : []),
            { label: 'AI Scan', active: step === 'scanning', done: step === 'verify' },
            { label: 'Verify', active: step === 'verify', done: false }
          ].map((s, idx) => (
            <div key={s.label} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, color: s.active ? '#2563eb' : s.done ? '#16a34a' : 'var(--text-400)' }}>
              <span style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                width: 18, 
                height: 18, 
                borderRadius: '50%', 
                background: s.active ? '#dbeafe' : s.done ? '#dcfce7' : 'var(--bg-alt)', 
                color: s.active ? '#2563eb' : s.done ? '#16a34a' : 'var(--text-500)',
                border: s.active ? '1px solid #3b82f6' : '1px solid var(--border)'
              }}>
                {s.done ? "✓" : (docType === 'dl' && idx === 1 ? 2 : docType === 'dl' && idx === 2 ? 3 : idx + 1)}
              </span>
              <span className="step-label-text">{s.label}</span>
              {idx < (docType === 'nic' ? 3 : 2) && <span style={{ flex: 1, height: 2, background: s.done ? '#16a34a' : 'var(--border)', margin: '0 4px' }} />}
            </div>
          ))}
        </div>

        {/* Content area */}
        <div style={{ padding: 20 }}>
          
          {/* STEP: CAMERA CAPTURE (FRONT & BACK) */}
          {(step === 'front' || step === 'back') && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              
              {/* Document selection options (only editable on 'front' step) */}
              {step === 'front' && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, background: 'var(--surface-alt)', padding: 12, borderRadius: 10, border: '1px solid var(--border)', alignItems: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 180, flex: 1 }}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-700)' }}>Document Type</label>
                    <select 
                      value={docType} 
                      onChange={(e) => {
                        const val = e.target.value as 'nic' | 'dl';
                        setDocType(val);
                        if (val === 'dl') setIsOldNic(false);
                      }}
                      style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--surface)', fontSize: 13, color: 'var(--text-900)', outline: 'none', fontWeight: 600 }}
                    >
                      <option value="nic">National Identity Card (NIC)</option>
                      <option value="dl">Driving License</option>
                    </select>
                  </div>
                  
                  {docType === 'nic' && (
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 700, color: 'var(--text-700)', cursor: 'pointer', marginTop: 16 }}>
                      <input 
                        type="checkbox" 
                        checked={isOldNic} 
                        onChange={(e) => setIsOldNic(e.target.checked)}
                        style={{ width: 16, height: 16, accentColor: '#2563eb' }}
                      />
                      <span>Use Old NIC format (Name/Address on back)</span>
                    </label>
                  )}
                </div>
              )}
              
              {/* Frame box */}
              <div style={{ position: 'relative', width: '100%', aspectRatio: '1.58/1', background: '#000', borderRadius: 12, overflow: 'hidden', border: '2px solid var(--border)', boxShadow: 'inset 0 0 40px rgba(0,0,0,0.6)' }}>
                {isCameraActive ? (
                  <>
                    <video ref={videoRef} autoPlay playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    
                    {/* Overlay Frame */}
                    <div style={{ position: 'absolute', inset: '10%', border: '2px dashed rgba(255,255,255,0.7)', borderRadius: 12, pointerEvents: 'none', boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)' }}>
                      {/* Guide texts */}
                      <div style={{ position: 'absolute', bottom: -30, left: 0, right: 0, textAlign: 'center', color: '#fff', fontSize: 12, fontWeight: 700, textShadow: '1px 1px 4px rgba(0,0,0,0.8)' }}>
                        Align {docType === 'nic' ? 'NIC' : 'Driving License'} {step === 'front' ? 'FRONT' : 'BACK'} inside the frame
                      </div>
                    </div>
                  </>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-400)', gap: 10, padding: 20 }}>
                    <Camera size={40} style={{ opacity: 0.5 }} />
                    <p style={{ fontSize: 13, textAlign: 'center', fontWeight: 600 }}>
                      {cameraError || "Loading camera stream..."}
                    </p>
                    <button onClick={startCamera} className="btn btn-secondary btn-sm" style={{ padding: '8px 16px', fontSize: 12 }}>
                      <RefreshCw size={12} style={{ marginRight: 6 }} /> Retry Camera
                    </button>
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: 10, justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="btn btn-secondary" style={{ flex: 1, padding: '10px 14px', fontSize: 13, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, cursor: 'pointer', background: 'var(--surface-alt)' }}>
                  <FileUp size={16} />
                  <span>Upload File</span>
                  <input key={step} type="file" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} />
                </label>
                
                {isCameraActive && (
                  <button onClick={handleCapture} className="btn btn-primary" style={{ flex: 2, padding: '12px 18px', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <Camera size={18} />
                    <span>Capture Photo</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* STEP: SCANNING ANIMATION */}
          {step === 'scanning' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 10px', gap: 20 }}>
              
              {/* Photo previews with Scanning line */}
              <div style={{ display: 'flex', gap: 14, width: '100%', maxWidth: docType === 'nic' ? 460 : 230, position: 'relative' }} className="scanner-container">
                
                {/* Sweep laser line animation */}
                <div className="scanner-laser" />
                
                <div style={{ flex: 1, aspectRatio: '1.58/1', borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border)' }}>
                  <img src={frontPhoto} alt="Front preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div style={{ position: 'absolute', bottom: 4, left: 4, background: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: 9, padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>FRONT</div>
                </div>
                {docType === 'nic' && (
                  <div style={{ flex: 1, aspectRatio: '1.58/1', borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border)' }}>
                    <img src={backPhoto} alt="Back preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <div style={{ position: 'absolute', bottom: 4, right: 4, background: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: 9, padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>BACK</div>
                  </div>
                )}
              </div>

              {/* Progress feedback */}
              <div style={{ textAlign: 'center', marginTop: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', color: '#2563eb', fontWeight: 800, fontSize: 15 }}>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Extracting {docType === 'nic' ? 'NIC' : 'Driving License'} details...</span>
                </div>
                <p style={{ fontSize: 12, color: 'var(--text-500)', marginTop: 6 }}>
                  Gemini API is recognizing name, identity number, and resident address from document images.
                </p>
              </div>
            </div>
          )}

          {/* STEP: VERIFICATION & MANUALLY EDIT FIELDS */}
          {step === 'verify' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              
              {/* Photo Previews */}
              <div style={{ display: 'flex', gap: 10 }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-500)' }}>FRONT SIDE</span>
                  <div style={{ height: 100, borderRadius: 6, overflow: 'hidden', border: '1px solid var(--border)', background: '#f8fafc', cursor: 'zoom-in' }} onClick={() => setZoomedPhoto(frontPhoto)}>
                    <img src={frontPhoto} alt="Front card" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  </div>
                </div>
                {docType === 'nic' && (
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-500)' }}>BACK SIDE</span>
                    <div style={{ height: 100, borderRadius: 6, overflow: 'hidden', border: '1px solid var(--border)', background: '#f8fafc', cursor: backPhoto ? 'zoom-in' : 'default' }} onClick={() => backPhoto && setZoomedPhoto(backPhoto)}>
                      {backPhoto ? (
                        <img src={backPhoto} alt="Back card" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', background: 'var(--bg-alt)', color: 'var(--text-400)', fontSize: 11, fontStyle: 'italic' }}>
                          No Back Photo
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* System alerts */}
              {apiError ? (
                <div style={{ display: 'flex', gap: 8, background: '#fef2f2', border: '1px solid #fee2e2', color: '#991b1b', padding: '10px 14px', borderRadius: 8, fontSize: 12 }}>
                  <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
                  <div>
                    <span style={{ fontWeight: 700 }}>OCR Scanning Issue:</span> {apiError}
                    <p style={{ marginTop: 2, color: '#7f1d1d' }}>Please manually type the customer details below.</p>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: 8, background: '#f0fdf4', border: '1px solid #dcfce7', color: '#166534', padding: '10px 14px', borderRadius: 8, fontSize: 12 }}>
                  <CheckCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
                  <div>
                    <span style={{ fontWeight: 700 }}>Successfully Scanned {docType === 'nic' ? 'NIC' : 'Driving License'}!</span>
                    <p style={{ marginTop: 2, color: '#14532d' }}>Gemini extracted cardholder data. Double check and correct if wrong.</p>
                  </div>
                </div>
              )}

              {/* Form Input fields */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-600)', display: 'block', marginBottom: 4 }}>Full Name</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="Enter Customer Name" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    style={{ fontSize: 13 }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-600)', display: 'block', marginBottom: 4 }}>
                    {docType === 'nic' ? 'NIC Number' : 'License / NIC Number'}
                  </label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. 199912345678" 
                    value={nic} 
                    onChange={(e) => setNic(e.target.value)} 
                    style={{ fontSize: 13 }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-600)', display: 'block', marginBottom: 4 }}>Address</label>
                  <textarea 
                    className="form-input" 
                    rows={2} 
                    placeholder="Enter Resident Address" 
                    value={address} 
                    onChange={(e) => setAddress(e.target.value)} 
                    style={{ resize: 'none', fontSize: 13 }}
                  />
                </div>
              </div>

              {/* Confirm / Reset Buttons */}
              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button onClick={handleReset} className="btn btn-secondary" style={{ flex: 1, padding: '10px 14px', fontSize: 13, justifyContent: 'center' }}>
                  Scan Again
                </button>
                <button onClick={handleConfirm} className="btn btn-primary" style={{ flex: 2, padding: '12px 18px', fontSize: 14, justifyContent: 'center' }}>
                  Confirm & Fill Form
                </button>
              </div>

            </div>
          )}

        </div>

      </div>
      
      {/* ── Zoomed Full Screen Preview Overlay ── */}
      {zoomedPhoto && (
        <div 
          className="modal-overlay" 
          style={{ zIndex: 1100, background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(4px)' }} 
          onClick={() => setZoomedPhoto(null)}
        >
          <div style={{ position: 'relative', width: '90%', maxWidth: 700, aspectRatio: '1.58/1', borderRadius: 12, overflow: 'hidden', background: '#000', border: '1px solid rgba(255, 255, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={e => e.stopPropagation()}>
            <img src={zoomedPhoto} alt="Full screen preview" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            <button 
              onClick={() => setZoomedPhoto(null)} 
              style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(255,255,255,0.9)', border: 'none', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#374151', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
