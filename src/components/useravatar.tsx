import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";

function getColorForUser(identifier: string) {
  const colors = [
    "bg-red-500",
    "bg-blue-500",
    "bg-green-500",
    "bg-yellow-500",
    "bg-purple-500",
    "bg-pink-500",
    "bg-orange-500",
  ];
  let hash = 0;
  for (let i = 0; i < identifier.length; i++) {
    hash = identifier.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
}

export function UserAvatar({
  name,
  email,
  image,
}: {
  name?: string | null;
  email?: string | null;
  image?: string | null;
}) {
  const identifier = email ?? name ?? "?";
  const initials =
    name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase() ??
    email?.[0]?.toUpperCase() ??
    "?";

  return (
    <Avatar className="h-8 w-8">
      <AvatarImage src={image ?? ""} alt={name ?? ""} />
      <AvatarFallback
        className={`font-medium text-white ${getColorForUser(identifier)}`}
      >
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}
