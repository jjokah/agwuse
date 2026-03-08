import Image from "next/image";
import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-block">
            <Image
              src="/ag-logo.png"
              alt="AG Wuse"
              width={64}
              height={64}
              className="mx-auto"
            />
          </Link>
          <p className="mt-2 text-sm text-muted-foreground">
            AG Wuse Church Management System
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}
