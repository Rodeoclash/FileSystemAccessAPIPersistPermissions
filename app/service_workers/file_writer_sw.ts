/// <reference lib="webworker" />

declare const self: ServiceWorkerGlobalScope;

import { get, set } from 'idb-keyval';

// @ts-expect-error
const resources = self.__WB_MANIFEST; // this is just to satisfy workbox

const directoryPermissions: FileSystemHandlePermissionDescriptor = {
  mode: 'readwrite'
}

const handleWriteInterval = async () => {
  const date = (new Date()).toISOString();
  const directoryHandle = await get('directoryHandle');

  // If it's not set or has been removed, exit
  if (!directoryHandle) {
    console.warn('Directory not set for saving to')
    return;
  }

  // if it has been set, check that we can write to it
  if(await directoryHandle.queryPermission(directoryPermissions) === 'granted') {
    const fileHandle = await directoryHandle.getFileHandle('test.txt', { create: true });
    const fileStream = await fileHandle.createWritable();
    await fileStream.write(`Written from main process trigger: ${date}`)
    await fileStream.close()
    console.log('File successfully updated')
  } else {
    console.warn("Don't have permissions to write, exiting...")
  }
}

self.addEventListener("install", function (event) {
  console.log("Worker installed");
});

self.addEventListener('activate', (event) => {
  console.log('Worker activated')
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'WRITE_INTERVAL_FILE') {
    //handleWriteInterval();
  }
});

export {}