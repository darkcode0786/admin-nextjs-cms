export type UploadFolder = "blogs" | "locations" | "general";

export type UploadInput = {
  buffer: Buffer;
  originalName: string;
  mimeType: string;
  folder: UploadFolder;
};

export type StoredObject = {
  path: string;
  url: string;
};

export interface StorageAdapter {
  upload(input: UploadInput): Promise<StoredObject>;
  delete(publicPath: string): Promise<void>;
}
