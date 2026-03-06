export interface MediaItem {
  id: string;
  title: string;
  type: "image" | "video";
  src: string;
  thumbnail?: string;
}

export const placeholderMedia: MediaItem[] = [
  {
    id: "1",
    title: "Valorant Ace Clutch",
    type: "image",
    src: "/placeholder-1.jpg",
  },
  {
    id: "2",
    title: "Rocket League Overtime",
    type: "image",
    src: "/placeholder-2.jpg",
  },
  {
    id: "3",
    title: "Minecraft Build-off",
    type: "image",
    src: "/placeholder-3.jpg",
  },
  {
    id: "4",
    title: "Apex Squad Wipe",
    type: "image",
    src: "/placeholder-4.jpg",
  },
  {
    id: "5",
    title: "CS2 Highlights",
    type: "image",
    src: "/placeholder-5.jpg",
  },
  {
    id: "6",
    title: "Helldivers 2 Extraction",
    type: "image",
    src: "/placeholder-6.jpg",
  },
];
