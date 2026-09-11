import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  validateUploadPath,
  UPLOAD_POLICIES,
  isRoleAllowedForFolder,
} from "@/lib/uploads/policy";

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        // Authenticate the user
        const session = await auth();
        if (!session?.user?.id) {
          throw new Error("Unauthorized: Please sign in to upload files.");
        }

        // Validate pathname against traversal attacks
        const pathCheck = validateUploadPath(pathname);
        if (!pathCheck.valid || !pathCheck.folder) {
          throw new Error(pathCheck.error || "Invalid upload pathname.");
        }

        // Check user role permissions for this destination folder
        if (!isRoleAllowedForFolder(session.user.role, pathCheck.folder)) {
          throw new Error(
            `Forbidden: Role '${session.user.role}' is not authorized to upload to folder '${pathCheck.folder}'.`
          );
        }

        const policy = UPLOAD_POLICIES[pathCheck.folder];

        return {
          allowedContentTypes: policy.allowedMimeTypes as unknown as string[],
          maximumSizeInBytes: policy.maxSizeBytes,
          tokenPayload: JSON.stringify({
            userId: session.user.id,
            folder: pathCheck.folder,
          }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        // Asynchronously logged on upload completion
        try {
          const payload = tokenPayload ? JSON.parse(tokenPayload) : null;
          console.log(
            `[UPLOAD COMPLETED] Blob created: ${blob.url} by user: ${payload?.userId || "unknown"} in folder: ${payload?.folder || "unknown"}`
          );
        } catch {
          // Non-critical logging
        }
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload authorization failed";
    console.error("[UPLOAD HANDLER ERROR]", message);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
