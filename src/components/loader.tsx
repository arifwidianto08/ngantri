interface LoaderProps {
  message?: string;
  size?: "sm" | "md" | "lg";
  fullScreen?: boolean;
}

export default function Loader({
  message,
  size = "md",
  fullScreen = false,
}: LoaderProps) {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-12 w-12",
    lg: "h-16 w-16",
  };

  const containerClasses = fullScreen
    ? "min-h-screen flex items-center justify-center"
    : "flex items-center justify-center py-20";

  return (
    <div className={containerClasses}>
      <div className="text-center">
        <div
          className={`inline-block ${sizeClasses[size]} animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]`}
        />
        {message && <p className="mt-4 text-gray-600">{message}</p>}
      </div>
    </div>
  );
}
