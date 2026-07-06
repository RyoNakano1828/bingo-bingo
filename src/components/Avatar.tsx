type Props = {
  name: string;
  iconUrl?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
};

const sizeClasses = {
  sm: "h-8 w-8 text-sm",
  md: "h-12 w-12 text-base",
  lg: "h-16 w-16 text-xl",
  xl: "h-24 w-24 text-3xl",
};

export function Avatar({ name, iconUrl, size = "md", className = "" }: Props) {
  const sizeClass = sizeClasses[size];

  if (iconUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={iconUrl}
        alt=""
        className={`rounded-full object-cover ${sizeClass} ${className}`}
      />
    );
  }

  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full bg-indigo-100 font-semibold text-indigo-700 ${sizeClass} ${className}`}
    >
      {name.charAt(0)}
    </span>
  );
}
