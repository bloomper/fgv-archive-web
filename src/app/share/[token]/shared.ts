import type { SharedView } from "@/lib/share/share.server";

export type SharedFile = SharedView["versions"][number]["files"][number];

/**
 * Every file a share link opens can be opened through it, whatever the server says about the visitor.
 */
export function sharedFiles(view: SharedView): SharedFile[] {
  return view.versions.flatMap(version => version.files).map(file => ({ ...file, canOpen: true }));
}
