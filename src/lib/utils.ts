import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Generate consistent random color for each user based on their ID
export function getUserAvatarColor(userId: string) {
  const colors = [
    'bg-blue-400',
    'bg-purple-400',
    'bg-pink-400',
    'bg-red-400',
    'bg-orange-400',
    'bg-amber-400',
    'bg-yellow-400',
    'bg-lime-400',
    'bg-green-400',
    'bg-emerald-400',
    'bg-teal-400',
    'bg-cyan-400',
    'bg-sky-400',
    'bg-indigo-400',
    'bg-violet-400',
    'bg-fuchsia-400',
    'bg-rose-400',
    'bg-slate-400',
  ];

  // Generate hash from userId to get consistent color
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
}
