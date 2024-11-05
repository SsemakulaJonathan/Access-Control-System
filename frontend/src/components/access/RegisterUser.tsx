'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { Button } from "../ui/button"
import { UserPlus } from 'lucide-react'
import { useToast } from "../ui/hooks/use-toast"

interface FormData {
  name: string;
  contact: string;
  carPlate: string;
}

export default function RegisterUser() {
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [formData, setFormData] = useState<FormData>({
    name: '',
    contact: '',
    carPlate: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')
          const scaleFactor = Math.min(1, 800 / img.width)
          canvas.width = img.width * scaleFactor
          canvas.height = img.height * scaleFactor
          ctx?.drawImage(img, 0, 0, canvas.width, canvas.height)
          const resizedImageUrl = canvas.toDataURL('image/jpeg', 0.8)
          setImagePreview(resizedImageUrl)
        }
        img.src = e.target?.result as string
      }
      reader.readAsDataURL(file)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      const submitFormData = new FormData()
      submitFormData.append('name', formData.name)
      submitFormData.append('contact', formData.contact)
      submitFormData.append('carPlate', formData.carPlate)
      
      // Get the file from the preview data
      if (imagePreview) {
        const response = await fetch(imagePreview)
        const blob = await response.blob()
        submitFormData.append('image', blob, `${formData.name}.jpg`)
      }

      const response = await fetch('http://localhost:8000/api/register-user', {
        method: 'POST',
        body: submitFormData,
      })

      const result = await response.json()
      
      if (result.status === 'success') {
        toast({
          title: "Success",
          description: "User registered successfully",
        })
        // Reset form
        setFormData({ name: '', contact: '', carPlate: '' })
        setImagePreview(null)
      } else {
        throw new Error(result.message || 'Failed to register user')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to register user",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl flex items-center gap-2">
          <UserPlus className="h-6 w-6" />
          Register New User
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input 
              id="name" 
              name="name" 
              value={formData.name} 
              onChange={handleInputChange} 
              placeholder="Enter full name" 
              required 
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact">Contact</Label>
            <Input 
              id="contact" 
              name="contact" 
              value={formData.contact} 
              onChange={handleInputChange} 
              type="tel" 
              placeholder="Enter contact number" 
              required 
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="carPlate">Car Plate Number</Label>
            <Input 
              id="carPlate" 
              name="carPlate" 
              value={formData.carPlate} 
              onChange={handleInputChange} 
              placeholder="Enter car plate number" 
              required 
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="image">Profile Image</Label>
            <Input 
              id="image" 
              type="file" 
              accept="image/*" 
              onChange={handleImageChange} 
              required 
            />
            {imagePreview && (
              <div className="mt-2">
                <img 
                  src={imagePreview} 
                  alt="Profile preview" 
                  className="max-w-xs rounded-lg" 
                />
              </div>
            )}
          </div>
          <Button 
            type="submit" 
            className="w-full" 
            disabled={isLoading}
          >
            {isLoading ? 'Registering...' : 'Register User'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}