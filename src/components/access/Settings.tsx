'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "../ui/card"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { Button } from "../ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Slider } from "../ui/slider"
import { Settings as SettingsIcon } from 'lucide-react'
import { useToast } from "../ui/hooks/use-toast"
import { apiService } from '../../lib/api'

interface Camera {
  id: string;
  label: string;
}

export default function Settings() {
  const [confidenceThreshold, setConfidenceThreshold] = useState(80)
  const [cameras, setCameras] = useState<Camera[]>([])
  const [selectedCamera, setSelectedCamera] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchCameras()
  }, [])

  // Update the fetchCameras function:
  const fetchCameras = async () => {
    try {
      const data = await apiService.getCameras();
      setCameras(data);
      if (data.length > 0) setSelectedCamera(data[0].id);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch available cameras.",
        variant: "destructive",
      });
    }
  };

  const handleConfidenceChange = (value: number[]) => {
    setConfidenceThreshold(value[0])
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    // Here you would typically send the settings to your backend
    // For now, we'll just simulate an API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsLoading(false)
    toast({
      title: "Settings Saved",
      description: "Your settings have been successfully updated.",
    })
    // Save the selected camera to localStorage for use in the live feed
    localStorage.setItem('selectedCamera', selectedCamera)
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl flex items-center gap-2">
          <SettingsIcon className="h-6 w-6" />
          System Settings
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="camera-source">Camera Source</Label>
            <Select value={selectedCamera} onValueChange={setSelectedCamera}>
              <SelectTrigger id="camera-source">
                <SelectValue placeholder="Select camera source" />
              </SelectTrigger>
              <SelectContent>
                {cameras.map(camera => (
                  <SelectItem key={camera.id} value={camera.id}>{camera.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="confidence-threshold">Recognition Confidence Threshold</Label>
            <Slider
              id="confidence-threshold"
              min={0}
              max={100}
              step={1}
              value={[confidenceThreshold]}
              onValueChange={handleConfidenceChange}
            />
            <div className="text-sm text-muted-foreground">{confidenceThreshold}%</div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="database-url">Database Connection</Label>
            <Input id="database-url" placeholder="Database URL" />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="api-key">API Keys</Label>
            <Input id="api-key" type="password" placeholder="ML Model API Key" />
          </div>
        </form>
      </CardContent>
        <CardFooter className="flex justify-end space-x-4">
        <Button 
            variant="outline" 
            onClick={() => {
            setConfidenceThreshold(80)
            setSelectedCamera(cameras[0]?.id || '')
            toast({
                title: "Settings Reset",
                description: "Settings have been reset to default values.",
            })
            }}
        >
            Reset to Defaults
        </Button>
        <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save Settings'}
        </Button>
        </CardFooter>
    </Card>
  )
}