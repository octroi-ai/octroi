"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Une erreur est survenue
        </h2>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          {error.message || "Erreur inattendue"}
        </p>
        <button
          className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          onClick={reset}
        >
          Reessayer
        </button>
      </div>
    </div>
  );
}
