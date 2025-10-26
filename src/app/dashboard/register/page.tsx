"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import Dropzone from "~/components/dropzone";

export default function RegisterComplaint() {
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const [category, setCategory] = useState("SANITATION"); // default category
  const [priority, setPriority] = useState("MEDIUM"); // default priority
  const [location, setLocation] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");

    try {
      const res = await fetch("/api/complaints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          details,
          category,
          priority,
          location: location || null,
          latitude: latitude ? parseFloat(latitude) : null,
          longitude: longitude ? parseFloat(longitude) : null,
          photoUrl: photoUrl || null,
        }),
      });

      if (!res.ok) throw new Error("Failed to register complaint");

      setMessage("✅ Complaint registered successfully!");
      setTitle("");
      setDetails("");
      setLocation("");
      setLatitude("");
      setLongitude("");
      setPhotoUrl("");
    } catch (err: any) {
      setMessage("❌ " + err.message);
    }
  }

  return (
    <Card className="mt-4 w-full">
      <CardHeader>
        <CardTitle>Register a Complaint</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <Textarea
            placeholder="Details"
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            required
          />
          <div className="flex gap-4">
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ROADS">Roads</SelectItem>
                <SelectItem value="WATER">Water</SelectItem>
                <SelectItem value="ELECTRICITY">Electricity</SelectItem>
                <SelectItem value="SANITATION">Sanitation</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger>
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="LOW">Low</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="HIGH">High</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Input
            placeholder="Location (optional)"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
          <div className="flex gap-2">
            <Input
              placeholder="Latitude (optional)"
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
              type="number"
            />
            <Input
              placeholder="Longitude (optional)"
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
              type="number"
            />
          </div>
          <Input
            placeholder="Photo URL (optional)"
            value={photoUrl}
            onChange={(e) => setPhotoUrl(e.target.value)}
          />
          <Dropzone onUploadComplete={(url) => setPhotoUrl(url ?? "")} />
          <Button type="submit">Submit</Button>
        </form>
        {message && <p className="mt-4">{message}</p>}
      </CardContent>
    </Card>
  );
}
