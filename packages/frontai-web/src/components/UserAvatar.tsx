interface UserAvatarProps {
  name?: string | null;
  imageUrl?: string | null;
  className?: string;
}

export function UserAvatar({ name, imageUrl, className = '' }: UserAvatarProps) {
  const initial = name?.trim()?.[0]?.toUpperCase() || 'U';

  if (imageUrl) {
    return <img src={imageUrl} alt={name || 'User'} className={`object-cover ${className}`} />;
  }

  return (
    <div className={`flex items-center justify-center bg-slate-200 font-bold text-slate-600 ${className}`}>
      {initial}
    </div>
  );
}
