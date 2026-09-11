import type { UserRole } from "@/lib/constants";

export type UploadFolder = "gallery" | "blog" | "events" | "sermons" | "avatars";

export interface UploadPolicyConfig {
  allowedMimeTypes: readonly string[];
  maxSizeBytes: number;
  allowedRoles: readonly UserRole[];
}

export const UPLOAD_POLICIES: Record<UploadFolder, UploadPolicyConfig> = {
  gallery: {
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
    maxSizeBytes: 15 * 1024 * 1024, // 15 MB
    allowedRoles: ["ADMIN", "SUPER_ADMIN"],
  },
  blog: {
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
    maxSizeBytes: 8 * 1024 * 1024, // 8 MB
    allowedRoles: ["ADMIN", "SUPER_ADMIN"],
  },
  events: {
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
    maxSizeBytes: 8 * 1024 * 1024, // 8 MB
    allowedRoles: ["ADMIN", "SUPER_ADMIN"],
  },
  sermons: {
    allowedMimeTypes: [
      "image/jpeg",
      "image/png",
      "image/webp",
      "audio/mpeg",
      "audio/mp3",
      "audio/wav",
      "audio/m4a",
      "audio/x-m4a",
    ],
    maxSizeBytes: 25 * 1024 * 1024, // 25 MB
    allowedRoles: ["ADMIN", "SUPER_ADMIN"],
  },
  avatars: {
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
    maxSizeBytes: 2 * 1024 * 1024, // 2 MB
    allowedRoles: ["VISITOR", "MEMBER", "DEPT_LEAD", "FINANCE", "ADMIN", "SUPER_ADMIN"],
  },
};

export interface PathValidationResult {
  valid: boolean;
  folder?: UploadFolder;
  filename?: string;
  error?: string;
}

/**
 * Validates the upload pathname for directory traversal, null bytes,
 * length constraints, and allowed target folders.
 */
export function validateUploadPath(pathname: string): PathValidationResult {
  if (!pathname || typeof pathname !== "string") {
    return { valid: false, error: "Pathname is required." };
  }

  // Reject path traversal, backslashes, null bytes, double slashes, and leading slashes
  if (
    pathname.includes("..") ||
    pathname.includes("\\") ||
    pathname.includes("\0") ||
    pathname.includes("//") ||
    pathname.startsWith("/")
  ) {
    return { valid: false, error: "Path traversal or illegal characters detected in pathname." };
  }

  const parts = pathname.split("/");
  if (parts.length !== 2) {
    return { valid: false, error: "Pathname must strictly follow the format: <folder>/<filename>." };
  }

  const [folderStr, filename] = parts;

  if (!Object.prototype.hasOwnProperty.call(UPLOAD_POLICIES, folderStr)) {
    return { valid: false, error: `Invalid upload destination folder: '${folderStr}'.` };
  }

  if (!filename || filename.length < 3 || filename.length > 255) {
    return { valid: false, error: "Filename length must be between 3 and 255 characters." };
  }

  // Reject control characters or unsafe characters in filename
  if (/[<>:"|?*]/.test(filename)) {
    return { valid: false, error: "Filename contains unsafe characters." };
  }

  return {
    valid: true,
    folder: folderStr as UploadFolder,
    filename,
  };
}

/**
 * Checks whether a user role is permitted to upload into the specified folder.
 */
export function isRoleAllowedForFolder(role: UserRole, folder: UploadFolder): boolean {
  const policy = UPLOAD_POLICIES[folder];
  return policy ? policy.allowedRoles.includes(role) : false;
}
