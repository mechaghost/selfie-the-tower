import { useRef, useEffect, useState, useCallback } from 'react';
import { useGameStore } from '../../store/gameStore';
import { Camera, Upload, ArrowLeft, Loader } from 'lucide-react';
import { eightiesIcon } from '../ui/EightiesIcons';
import './SelfieCaptureScreen.css';

export function SelfieCaptureScreen() {
    const { ugcPhase, ugcError, selfieDataUrl, submitSelfie, cancelUgc } = useGameStore(state => ({
        ugcPhase: state.ugcPhase,
        ugcError: state.ugcError,
        selfieDataUrl: state.selfieDataUrl,
        submitSelfie: state.submitSelfie,
        cancelUgc: state.cancelUgc,
    }));

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const [cameraReady, setCameraReady] = useState(false);
    const [cameraError, setCameraError] = useState(false);

    const isGenerating = ugcPhase === 'generating';
    const [statusIndex, setStatusIndex] = useState(0);

    const STATUS_MESSAGES = [
        'Reading your aura',
        'Channeling street magic',
        'Forging your archetype',
        'Painting your portrait',
        'Designing your signature move',
        'Generating hero card art',
        'Shuffling the deck',
        'Tuning neon frequencies',
        'Consulting the oracle',
        'Infusing cards with power',
    ];

    useEffect(() => {
        if (!isGenerating) return;
        const interval = setInterval(() => {
            setStatusIndex(i => (i + 1) % STATUS_MESSAGES.length);
        }, 3000);
        return () => clearInterval(interval);
    }, [isGenerating]);

    const startCamera = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 640 } }
            });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.onloadedmetadata = () => setCameraReady(true);
            }
        } catch {
            setCameraError(true);
        }
    }, []);

    const stopCamera = useCallback(() => {
        streamRef.current?.getTracks().forEach(t => t.stop());
        streamRef.current = null;
        setCameraReady(false);
    }, []);

    useEffect(() => {
        if (!isGenerating) startCamera();
        return stopCamera;
    }, [isGenerating, startCamera, stopCamera]);

    const capturePhoto = () => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas) return;

        const size = Math.min(video.videoWidth, video.videoHeight);
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d')!;
        const sx = (video.videoWidth - size) / 2;
        const sy = (video.videoHeight - size) / 2;
        ctx.drawImage(video, sx, sy, size, size, 0, 0, 512, 512);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        stopCamera();
        submitSelfie(dataUrl);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => {
            const img = new Image();
            img.onload = () => {
                const canvas = canvasRef.current;
                if (!canvas) return;
                const size = Math.min(img.width, img.height);
                canvas.width = 512;
                canvas.height = 512;
                const ctx = canvas.getContext('2d')!;
                const sx = (img.width - size) / 2;
                const sy = (img.height - size) / 2;
                ctx.drawImage(img, sx, sy, size, size, 0, 0, 512, 512);
                const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
                stopCamera();
                submitSelfie(dataUrl);
            };
            img.src = reader.result as string;
        };
        reader.readAsDataURL(file);
    };

    if (isGenerating) {
        return (
            <div className="selfie-screen">
                <div className="selfie-sparkle selfie-sparkle-1"><img src={eightiesIcon(0)} alt="" /></div>
                <div className="selfie-sparkle selfie-sparkle-2"><img src={eightiesIcon(7)} alt="" /></div>
                <div className="selfie-sparkle selfie-sparkle-3"><img src={eightiesIcon(3)} alt="" /></div>
                <div className="selfie-sparkle selfie-sparkle-4"><img src={eightiesIcon(12)} alt="" /></div>
                <div className="generating-overlay">
                    <div className="generating-portal">
                        <div className="generating-orbit generating-orbit-1" />
                        <div className="generating-orbit generating-orbit-2" />
                        {selfieDataUrl && (
                            <img src={selfieDataUrl} className="generating-selfie" alt="Your photo" />
                        )}
                    </div>
                    <div className="generating-content">
                        <Loader size={36} className="generating-spinner" />
                        <p className="generating-label">80's Magic at work</p>
                        <p className="generating-text" key={statusIndex}>{STATUS_MESSAGES[statusIndex]}</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="selfie-screen">
            <button className="selfie-back-btn" onClick={cancelUgc}>
                <ArrowLeft size={20} />
            </button>

            <div className="selfie-sparkle selfie-sparkle-1"><img src={eightiesIcon(5)} alt="" /></div>
            <div className="selfie-sparkle selfie-sparkle-2"><img src={eightiesIcon(14)} alt="" /></div>
            <div className="selfie-sparkle selfie-sparkle-3"><img src={eightiesIcon(9)} alt="" /></div>
            <div className="selfie-sparkle selfie-sparkle-4"><img src={eightiesIcon(18)} alt="" /></div>

            <h2 className="selfie-title">Show Us Your Mug</h2>
            <p className="selfie-subtitle">The neon reads your soul and spits out a legend</p>

            <div className="selfie-viewport">
                <div className="selfie-orbit-ring" />
                {!cameraError ? (
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className={`selfie-video ${cameraReady ? 'ready' : ''}`}
                    />
                ) : (
                    <div className="selfie-placeholder">
                        <Camera size={48} />
                        <p>Camera unavailable</p>
                    </div>
                )}
                <div className="selfie-frame" />
            </div>

            {ugcError && (
                <p className="selfie-error">{ugcError}</p>
            )}

            <div className="selfie-actions">
                {cameraReady && (
                    <button className="selfie-capture-btn" onClick={capturePhoto}>
                        <img src={eightiesIcon(10)} alt="" className="btn-icon" />
                        Snap It
                    </button>
                )}
                <button className="selfie-upload-btn" onClick={() => fileInputRef.current?.click()}>
                    <Upload size={20} />
                    Upload Photo
                </button>
            </div>

            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
            />
            <canvas ref={canvasRef} style={{ display: 'none' }} />
        </div>
    );
}
