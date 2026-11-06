"use client";

import * as tus from "tus-js-client";

export const CHUNK_SIZE = 50 * 1024 * 1024;

/**
 * Uploads a file through the web's {@code /api/uploads} tus endpoint, resumably and in chunks of at most 50 MB.
 * Resolves with the upload's id, which a mutation then turns into a track.
 */
export function uploadFile(file: File, onProgress: (fraction: number) => void): Promise<string> {
  return new Promise((resolve, reject) => {
    const upload = new tus.Upload(file, {
      endpoint: "/api/uploads",
      chunkSize: CHUNK_SIZE,
      retryDelays: [0, 1000, 3000, 5000, 10000],
      metadata: { filename: file.name, filetype: file.type },
      removeFingerprintOnSuccess: true,
      onProgress: (sent, total) => onProgress(total > 0 ? sent / total : 0),
      onError: reject,
      onSuccess: () => {
        const id = upload.url?.split("/").pop();

        if (id) {
          resolve(id);
        } else {
          reject(new Error("The upload has no id"));
        }
      },
    });

    upload.findPreviousUploads().then(previous => {
      if (previous.length > 0) {
        upload.resumeFromPreviousUpload(previous[0]);
      }
      upload.start();
    }, reject);
  });
}
