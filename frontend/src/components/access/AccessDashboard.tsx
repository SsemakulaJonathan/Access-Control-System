'use client'

import { useState, useEffect, useRef } from 'react'
import { Camera, Clock, User, CreditCard } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Button } from "../ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table"

export default function AccessDashboard() {
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [accessStatus, setAccessStatus] = useState<'idle' | 'processing' | 'granted' | 'denied' | 'error'>('idle')
  const [recognition, setRecognition] = useState({
    plate: null as string | null,
    face: null as string | null,
    timestamp: null as string | null
  })

  // First, add the Detection interface at the top of your file
  interface Detection {
    type: 'face' | 'plate';
    x: number;
    y: number;
    width: number;
    height: number;
    label: string;
    confidence?: number;
    raw_text?: string;
  }

  // Update the detections state with the interface
  const [detections, setDetections] = useState<Detection[]>([]);
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const processingRef = useRef(false)
  const frameRef = useRef<number>()

  useEffect(() => {
    const startCamera = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            width: { ideal: 1280 },
            height: { ideal: 720 }
          } 
        })
        setStream(mediaStream)
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream
        }
      } catch (err) {
        console.error("Error accessing camera:", err)
      }
    }
    
    startCamera()
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }
      // Clean up animation frame
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current)
      }
    }
  }, [])

  useEffect(() => {
    let mounted = true;
    let interval: NodeJS.Timeout | null = null;
    
    const processFrame = async () => {
      if (!videoRef.current || !canvasRef.current || processingRef.current) return;
      
      try {
        processingRef.current = true;
        
        const canvas = canvasRef.current;
        const video = videoRef.current;
        const context = canvas.getContext('2d');
        
        if (!context) return;
        
        // Set canvas size
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        // Draw video frame to canvas
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Convert canvas to blob
        const blob = await new Promise<Blob>((resolve) => 
          canvas.toBlob(blob => blob ? resolve(blob) : null, 'image/jpeg', 0.8)
        );
        
        // Send frame to backend
        const formData = new FormData();
        formData.append('image', blob);
        
        const response = await fetch('http://localhost:8000/api/detect', {
          method: 'POST',
          body: formData,
        });
        
        if (!response.ok) throw new Error('Detection failed');
        
        const result = await response.json();
        
        if (mounted && result.detections) {
          setDetections(result.detections);
          
          // Clear previous drawings
          context.clearRect(0, 0, canvas.width, canvas.height);
          
          // Redraw the video frame
          context.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          // Draw new detections
          result.detections.forEach((det: any) => {
            context.strokeStyle = det.type === 'face' ? '#00ff00' : '#0000ff';
            context.lineWidth = 2;
            context.strokeRect(det.x, det.y, det.width, det.height);
            
            // Draw labels with background for better visibility
            const label = det.label || 'Unknown';
            context.font = '16px Arial';
            const textWidth = context.measureText(label).width;
            
            // Draw label background
            context.fillStyle = det.type === 'face' ? 'rgba(0,255,0,0.5)' : 'rgba(0,0,255,0.5)';
            context.fillRect(det.x, det.y - 25, textWidth + 10, 20);
            
            // Draw label text
            context.fillStyle = '#ffffff';
            context.fillText(label, det.x + 5, det.y - 10);
          });
        }
      } catch (error) {
        console.error('Frame processing error:', error);
      } finally {
        processingRef.current = false;
      }
    };
    
    if (stream) {
      // Process frame every second
      interval = setInterval(processFrame, 1000);
    }
    
    return () => {
      mounted = false;
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [stream]);

  const verifyAccess = async () => {
    try {
      setAccessStatus('processing')
      
      // Capture current frame
      if (!videoRef.current || !canvasRef.current) return;
      
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const context = canvas.getContext('2d');
      
      if (!context) return;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Convert canvas to blob
      const blob = await new Promise<Blob>((resolve) => 
        canvas.toBlob(blob => blob ? resolve(blob) : null, 'image/jpeg', 0.8)
      );
      
      // Send to backend
      const formData = new FormData();
      formData.append('image', blob);
      
      const response = await fetch('http://localhost:8000/api/verify-access', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) throw new Error('Verification failed');
      
      const result = await response.json();
      
      setAccessStatus(result.status);
      if (result.status === 'granted') {
        setRecognition({
          plate: result.plate,
          face: result.face,
          timestamp: new Date().toLocaleString()
        });
      }
    } catch (err) {
      console.error('Verification error:', err)
      setAccessStatus('error')
    }
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Camera Feed Section */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="w-5 h-5" />
              Live Camera Feed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="absolute inset-0 w-full h-full object-cover"
              />
              <canvas 
                ref={canvasRef} 
                className="absolute inset-0 w-full h-full"
              />
              
              {accessStatus === 'processing' && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent" />
                </div>
              )}
            </div>

            <div className="mt-4 space-y-4">
              <Button 
                onClick={verifyAccess}
                disabled={accessStatus === 'processing'}
                className="w-full"
              >
                Verify Access
              </Button>
              
              {accessStatus !== 'idle' && accessStatus !== 'processing' && (
                <div 
                  className={`p-4 rounded-lg text-white text-center font-medium ${
                    accessStatus === 'granted' ? 'bg-green-500' :
                    accessStatus === 'denied' ? 'bg-red-500' :
                    'bg-yellow-500'
                  }`}
                >
                  {accessStatus === 'error' ? 'Verification Error' : `Access ${accessStatus.toUpperCase()}`}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recognition Details */}
        <Card>
          <CardHeader>
            <CardTitle>Recognition Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Real-time Detections */}
            <div className="space-y-2">
              <h3 className="font-medium text-sm">Current Detections</h3>
              {detections.map((detection, index) => (
                <div key={index} className="p-3 bg-muted rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">
                      {detection.type === 'face' ? '👤 Face' : '🚗 Plate'}
                    </span>
                    {detection.confidence && (
                      <span className="text-xs text-muted-foreground">
                        {(detection.confidence * 100).toFixed(1)}% confidence
                      </span>
                    )}
                  </div>
                  <p className="text-sm mt-1">{detection.label}</p>
                </div>
              ))}
              {detections.length === 0 && (
                <div className="text-sm text-muted-foreground italic">
                  No detections yet
                </div>
              )}
            </div>

            {/* Verified Recognition */}
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">License Plate</p>
              <p className="font-medium">{recognition.plate || 'Not detected'}</p>
            </div>
            
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Face Recognition</p>
              <p className="font-medium">{recognition.face || 'Not detected'}</p>
            </div>
            
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Timestamp</p>
              <p className="font-medium">{recognition.timestamp || '-'}</p>
            </div>

            <div className="text-sm text-muted-foreground mt-4">
              <p>System Status: <span className="text-green-500">Active</span></p>
              <p>Last Update: {new Date().toLocaleTimeString()}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Access History */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Access History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead><Clock className="w-4 h-4 mr-2 inline-block" /> Time</TableHead>
                  <TableHead><User className="w-4 h-4 mr-2 inline-block" /> User</TableHead>
                  <TableHead><CreditCard className="w-4 h-4 mr-2 inline-block" /> Plate</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...Array(3)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>{new Date(Date.now() - i * 3600000).toLocaleTimeString()}</TableCell>
                    <TableCell>John Doe</TableCell>
                    <TableCell>ABC 123</TableCell>
                    <TableCell>
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                        {accessStatus}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}